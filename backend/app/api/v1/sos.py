import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas.schemas import SOSRequest
from app.core.demo_store import store, DEMO_USER_ID

router = APIRouter()


@router.post("/trigger")
def trigger_sos(req: SOSRequest):
    contacts = store.contacts
    alert = {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "trip_id": req.trip_id,
        "silent": req.silent,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "contacts_notified": len(contacts),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    share_link = None
    if req.trip_id and req.trip_id in store.trips:
        share_link = store.trips[req.trip_id].get("share_link")

    return {
        "alert_id": alert["id"],
        "contacts_notified": len(contacts),
        "silent": req.silent,
        "message": "SOS alert sent to emergency contacts",
        "share_link": share_link or "https://safarai.app/trip/share/emergency",
        "contacts": [c["name"] for c in contacts],
    }
