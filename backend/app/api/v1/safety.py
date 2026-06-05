from fastapi import APIRouter, HTTPException, Query
from app.schemas.schemas import SafetyReportCreate, VoteRequest
from app.services.data import repository as repo
from app.services.safety.location_context import analyze_location
from app.services.safety.osm_cctv_service import cctv_service
from app.services.safety.scoring_engine import SafetyScoringEngine

router = APIRouter()
roads_router = APIRouter()
scoring_engine = SafetyScoringEngine()


@router.get("/reports")
def list_reports(city: str = "chennai"):
    return {"reports": repo.get_safety_reports(city)}


@router.post("/reports")
def create_report(req: SafetyReportCreate):
    return repo.create_safety_report(
        req.report_type, req.description or "", req.latitude, req.longitude, req.city
    )


@router.post("/reports/{report_id}/vote")
def vote_report(report_id: str, req: VoteRequest):
    try:
        return repo.vote_report(report_id, req.vote_type)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/cctv")
def list_cctv_near(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius_m: int = Query(500, ge=50, le=2000),
    city: str = "chennai",
):
    """Real OSM surveillance cameras near a coordinate."""
    cameras = cctv_service.get_cameras_near(lat, lng, radius_m, city)
    return {
        "cameras": cameras,
        "count": len(cameras),
        "source": "openstreetmap",
        "meta": cctv_service.meta(),
    }


@router.get("/cctv/map")
def list_cctv_for_map(city: str = "chennai"):
    """All cached OSM CCTV cameras for Hyderabad map layer."""
    cameras = cctv_service.get_all_cameras(city)
    return {
        "cameras": cameras,
        "count": len(cameras),
        "source": "openstreetmap",
        "meta": cctv_service.meta(),
    }


@router.get("/context")
def location_safety_context(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_m: int = Query(400, ge=50, le=2000),
    city: str = "chennai",
):
    """Real-time safety context at a location: OSM CCTV + community reports."""
    reports = repo.get_safety_reports(city)
    ctx = analyze_location(lat, lng, reports, radius_m)
    score = scoring_engine.score_route(
        cctv_nearby=ctx["cctv_count"],
        harassment_reports_nearby=ctx["harassment_reports_nearby"],
        verified_reports_nearby=ctx["verified_reports_nearby"],
        community_unsafe=ctx["community_unsafe"],
        lighting="poor" if ctx["broken_lights_nearby"] > 0 else "moderate",
    )
    return {
        **ctx,
        "safety_score": score.total,
        "safety_label": score.label,
        "safety_breakdown": [
            {"factor": f.factor, "impact": f.impact, "description": f.description}
            for f in score.factors
        ],
        "data_sources": ["openstreetmap_cctv", "community_reports"],
    }


@roads_router.get("/ratings")
def road_ratings(city: str = "chennai"):
    return {"segments": repo.get_road_ratings(city)}
