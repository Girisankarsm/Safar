from fastapi import APIRouter, HTTPException, Query

from app.repositories import store
from app.schemas.schemas import ReportCreate, ReportVote
from app.services.safety.context import live_context
from app.services.safety.osm_cctv import COVERAGE_NOTE, osm_cctv
from app.services.safety.zones import get_safe_spots, get_zones

router = APIRouter(prefix="/safety", tags=["safety"])


@router.get("/context")
def safety_context(lat: float = Query(...), lng: float = Query(...), city: str = "chennai"):
    return live_context(lat, lng, city)


@router.get("/cctv")
def cctv_nodes(city: str = "chennai", lat: float | None = None, lng: float | None = None, refresh: bool = False):
    nodes = osm_cctv.get_nodes(city, force_refresh=refresh)
    radius_count: int | None = None
    if lat is not None and lng is not None:
        nodes = osm_cctv.nearby(lat, lng, city, radius_m=2000, limit=100)
        radius_count = osm_cctv.count_near(lat, lng, city, 500)
    count = radius_count if radius_count is not None else len(nodes)
    return {
        "city": city,
        "count": len(nodes),
        "radius_count": radius_count,
        "density_score": osm_cctv.density_score(count),
        "nodes": nodes,
        "source": "openstreetmap_overpass",
        "coverage_note": COVERAGE_NOTE,
    }


@router.get("/reports")
def list_reports(city: str = "chennai"):
    return {"reports": store.list_reports(city)}


@router.post("/reports")
def create_report(body: ReportCreate):
    report = store.create_report(body.model_dump())
    return {"report": report}


@router.post("/reports/{report_id}/vote")
def vote_report(report_id: str, body: ReportVote):
    report = store.vote_report(report_id, body.vote_type)
    if not report:
        raise HTTPException(404, "Report not found")
    return {"report": report}


@router.get("/zones")
def safety_zones(city: str = "chennai"):
    zones = get_zones(city)
    safe = sum(1 for z in zones if z["zone_type"] == "safe")
    moderate = sum(1 for z in zones if z["zone_type"] == "moderate")
    high = sum(1 for z in zones if z["zone_type"] == "high_risk")
    return {"city": city, "zones": zones, "summary": {"safe": safe, "moderate": moderate, "high_risk": high}}


@router.get("/safe-spots")
def safe_waiting_spots(city: str = "chennai", lat: float | None = None, lng: float | None = None):
    spots = get_safe_spots(city, lat, lng)
    return {"city": city, "spots": spots, "count": len(spots)}
