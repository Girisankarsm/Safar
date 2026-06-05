import secrets
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.schemas.schemas import TripStartRequest, TripLocationUpdate, TripCompleteResponse
from app.services.data import repository as repo
from app.services.carbon.token_service import CarbonTokenService

router = APIRouter()
carbon_service = CarbonTokenService()


@router.post("/start")
def start_trip(req: TripStartRequest):
    route = repo.get_route(req.route_id)
    if not route:
        raise HTTPException(404, "Route not found. Search routes first.")

    trip_id = str(uuid.uuid4())
    share_token = secrets.token_urlsafe(16)
    trip = {
        "id": trip_id,
        "route_id": req.route_id,
        "route": route,
        "status": "active",
        "share_token": share_token,
        "share_link": f"https://safarai.app/trip/share/{share_token}",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "path_coordinates": [],
        "deviation_alerted": False,
    }
    return repo.save_trip(trip)


@router.patch("/{trip_id}/location")
def update_location(trip_id: str, loc: TripLocationUpdate):
    trip = repo.get_trip(trip_id)
    if not trip:
        raise HTTPException(404, "Trip not found")

    trip["current_lat"] = loc.latitude
    trip["current_lng"] = loc.longitude
    trip["path_coordinates"].append({"lat": loc.latitude, "lng": loc.longitude})

    deviation = False
    if len(trip["path_coordinates"]) > 3 and not trip["deviation_alerted"]:
        trip["deviation_alerted"] = True
        deviation = True

    repo.save_trip(trip)
    return {"status": "ok", "deviation_alert": deviation}


@router.post("/{trip_id}/complete", response_model=TripCompleteResponse)
def complete_trip(trip_id: str):
    trip = repo.get_trip(trip_id)
    if not trip:
        raise HTTPException(404, "Trip not found")

    route = trip.get("route") or repo.get_route(trip["route_id"])
    if not route:
        raise HTTPException(400, "Route data missing")

    reward = carbon_service.calculate_trip_reward(route["legs"])
    balance = repo.credit_wallet(
        reward.tokens_earned,
        reward.co2_saved_kg,
        f"Trip {route['source']} → {route['destination']}",
    )

    trip["status"] = "completed"
    trip["tokens_earned"] = reward.tokens_earned
    trip["co2_saved_kg"] = reward.co2_saved_kg
    trip["completed_at"] = datetime.now(timezone.utc).isoformat()
    repo.save_trip(trip)

    return TripCompleteResponse(
        tokens_earned=reward.tokens_earned,
        co2_saved_kg=reward.co2_saved_kg,
        wallet_balance=balance,
        message=f"Great green commute! You earned {reward.tokens_earned} tokens.",
    )


@router.get("/history")
def trip_history():
    return {"trips": repo.get_completed_trips()}


@router.get("/share/{share_token}")
def get_shared_trip(share_token: str):
    trip = repo.get_trip_by_share_token(share_token)
    if not trip:
        raise HTTPException(404, "Shared trip not found")
    return {
        "status": trip["status"],
        "route": trip.get("route", {}),
        "current_lat": trip.get("current_lat"),
        "current_lng": trip.get("current_lng"),
        "started_at": trip.get("started_at"),
    }
