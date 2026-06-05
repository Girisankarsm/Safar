"""SOS: persist alert, notify contacts via Twilio when configured, return share link."""

import os
import secrets
from datetime import datetime

import httpx

from app.core.config import settings


def _twilio_send(to: str, body: str) -> bool:
    sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    token = os.getenv("TWILIO_AUTH_TOKEN", "")
    from_num = os.getenv("TWILIO_FROM_NUMBER", "")
    if not all([sid, token, from_num]):
        return False
    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    try:
        with httpx.Client(timeout=15) as client:
            resp = client.post(url, data={"To": to, "From": from_num, "Body": body}, auth=(sid, token))
            return resp.status_code in (200, 201)
    except Exception:
        return False


def dispatch_sos(
    user_name: str,
    contacts: list[dict],
    lat: float | None,
    lng: float | None,
    silent: bool,
    trip_id: str | None,
    share_token: str | None,
) -> dict:
    loc = f"{lat},{lng}" if lat and lng else "location unavailable"
    maps = f"https://maps.google.com/?q={lat},{lng}" if lat and lng else ""
    share_url = f"{settings.app_public_url}/trip/share/{share_token}" if share_token else None

    msg = (
        f"[SafarAI SOS] {user_name} triggered {'silent ' if silent else ''}alert at {datetime.now().isoformat()}. "
        f"Location: {loc}. {maps}"
    )
    if share_url:
        msg += f" Live trip: {share_url}"

    notified = 0
    for c in contacts:
        if _twilio_send(c["phone"], msg):
            notified += 1

    return {
        "notified": notified,
        "total_contacts": len(contacts),
        "twilio_enabled": bool(os.getenv("TWILIO_ACCOUNT_SID")),
        "share_url": share_url,
        "message_preview": msg[:200],
    }
