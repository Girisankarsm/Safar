from fastapi import APIRouter, Query

from app.repositories import store
from app.schemas.schemas import ReportCreate
from app.services.safety.context import live_context
from app.services.safety.osm_cctv import osm_cctv

router = APIRouter(prefix="/safety", tags=["safety"])


@router.get("/context")
def safety_context(lat: float = Query(...), lng: float = Query(...), city: str = "chennai"):
    return live_context(lat, lng, city)


@router.get("/cctv")
def cctv_nodes(city: str = "chennai", lat: float | None = None, lng: float | None = None, refresh: bool = False):
    nodes = osm_cctv.get_nodes(city, force_refresh=refresh)
    if lat is not None and lng is not None:
        nodes = osm_cctv.nearby(lat, lng, city, radius_m=2000, limit=100)
    return {"city": city, "count": len(nodes), "nodes": nodes, "source": "openstreetmap_overpass"}


@router.get("/reports")
def list_reports(city: str = "chennai"):
    return {"reports": store.list_reports(city)}


@router.post("/reports")
def create_report(body: ReportCreate):
    report = store.create_report(body.model_dump())
    return {"report": report}
