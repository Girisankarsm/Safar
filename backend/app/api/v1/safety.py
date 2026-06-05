import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.schemas.schemas import SafetyReportCreate, VoteRequest
from app.core.demo_store import store, DEMO_USER_ID, DEMO_ROAD_RATINGS

router = APIRouter()
roads_router = APIRouter()


@router.get("/reports")
def list_reports(city: str = "hyderabad"):
    return {"reports": [r for r in store.reports if r.get("city") == city]}


@router.post("/reports")
def create_report(req: SafetyReportCreate):
    report = {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "report_type": req.report_type,
        "description": req.description,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "upvotes": 0,
        "verifications": 0,
        "is_verified": False,
        "city": "hyderabad",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    store.reports.insert(0, report)
    return report


@router.post("/reports/{report_id}/vote")
def vote_report(report_id: str, req: VoteRequest):
    report = _get_report(report_id)
    key = (DEMO_USER_ID, report_id, req.vote_type)
    if key in store.votes:
        raise HTTPException(400, "Already voted")

    store.votes.add(key)
    if req.vote_type == "upvote":
        report["upvotes"] += 1
    elif req.vote_type == "verify":
        report["verifications"] += 1
        if report["verifications"] >= 3:
            report["is_verified"] = True

    return report


@roads_router.get("/ratings")
def road_ratings(city: str = "hyderabad"):
    return {"segments": DEMO_ROAD_RATINGS}


def _get_report(report_id: str) -> dict:
    for r in store.reports:
        if r["id"] == report_id:
            return r
    raise HTTPException(404, "Report not found")
