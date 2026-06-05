from fastapi import APIRouter, HTTPException

from app.repositories import store
from app.schemas.schemas import SOSRequest
from app.services.notify.sos import dispatch_sos

router = APIRouter(prefix="/sos", tags=["sos"])


@router.post("/trigger")
def trigger_sos(body: SOSRequest):
    user = store.get_current_user()
    contacts = store.get_contacts()
    trip = store.get_trip(body.trip_id) if body.trip_id else None
    share = trip.get("share_token") if trip else None

    alert = store.create_sos(body.latitude, body.longitude, body.silent, body.trip_id)
    result = dispatch_sos(
        user["name"], contacts, body.latitude, body.longitude, body.silent, body.trip_id, share
    )
    return {
        "alert_id": alert["id"],
        "status": "active",
        "silent": body.silent,
        **result,
    }


@router.get("/contacts")
def emergency_contacts():
    return {"contacts": store.get_contacts()}
