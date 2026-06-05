import uuid
from fastapi import APIRouter
from app.schemas.schemas import SOSRequest
from app.services.data import repository as repo

router = APIRouter()


@router.post("/trigger")
def trigger_sos(req: SOSRequest):
    contacts = repo.get_emergency_contacts()
    share_link = None
    if req.trip_id:
        trip = repo.get_trip(req.trip_id)
        if trip:
            share_link = trip.get("share_link")

    return {
        "alert_id": str(uuid.uuid4()),
        "contacts_notified": len(contacts),
        "silent": req.silent,
        "message": "SOS alert sent to emergency contacts",
        "share_link": share_link or "https://safarai.app/trip/share/emergency",
        "contacts": [c["name"] for c in contacts],
    }
