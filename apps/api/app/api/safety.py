from fastapi import APIRouter, Query

from app.repositories import store
from app.schemas.schemas import ReportCreate
from app.services.safety.context import live_context
from app.services.safety.osm_cctv import COVERAGE_NOTE, osm_cctv

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
