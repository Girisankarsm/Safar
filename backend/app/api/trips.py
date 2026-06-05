from fastapi import APIRouter, HTTPException

from app.repositories import store
from app.schemas.schemas import TripCheckIn, TripLocationUpdate, TripStartRequest
from app.services.carbon.calc import trip_impact
from app.services.safety.context import live_context
from app.services.safety.scoring import score_route

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("/start")
def start_trip(body: TripStartRequest):
    trip = store.start_trip(body.route_id)
    if not trip:
        raise HTTPException(404, "Route not found")
    return trip


@router.get("/{trip_id}")
def get_trip(trip_id: str):
    trip = store.get_trip(trip_id)
    if not trip:
        raise HTTPException(404, "Trip not found")
    return trip


@router.get("/share/{share_token}")
def share_trip(share_token: str):
    trip = store.get_trip_by_share(share_token)
    if not trip:
        raise HTTPException(404, "Shared trip not found")
    ctx = None
    if trip.get("current_lat") and trip.get("current_lng"):
        city = trip.get("route", {}).get("city", "chennai")
        ctx = live_context(trip["current_lat"], trip["current_lng"], city)
    return {"trip": trip, "live_context": ctx}


@router.patch("/{trip_id}/location")
def update_location(trip_id: str, body: TripLocationUpdate):
    trip = store.update_trip_location(trip_id, body.latitude, body.longitude)
    if not trip:
        raise HTTPException(404, "Active trip not found")
    route = trip.get("route") or {}
    city = route.get("city", "chennai")
    ctx = live_context(body.latitude, body.longitude, city)
    safety = score_route(route.get("legs", []), city)
    impact = trip_impact(route.get("distance_km") or 0)
    return {
        "trip": trip,
        "live_context": ctx,
        "safety_score": safety["score"],
        "safety_label": safety["label"],
        "carbon_nudge": impact["nudge"],
    }


@router.post("/{trip_id}/check-in")
def check_in(trip_id: str, body: TripCheckIn):
    result = store.check_in_trip(trip_id, body.latitude, body.longitude, body.mode)
    if not result:
        raise HTTPException(404, "Trip not found")
    return result


@router.post("/{trip_id}/complete")
def complete_trip(trip_id: str):
    trip = store.complete_trip(trip_id)
    if not trip:
        raise HTTPException(404, "Trip not found")
    wallet = store.get_wallet()
    return {"trip": trip, "wallet": wallet}
