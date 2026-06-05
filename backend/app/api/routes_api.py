from fastapi import APIRouter, HTTPException

from app.repositories import store
from app.schemas.schemas import RouteSearchRequest
from app.services.routing.engine import build_routes

router = APIRouter(prefix="/routes", tags=["routes"])


@router.post("/search")
def search_routes(body: RouteSearchRequest):
    user = store.get_current_user()
    women = body.women_mode or user.get("women_safety_mode", False)
    night = body.night_mode or user.get("night_safe_preference", False)
    routes = build_routes(body.source, body.destination, body.city, night_mode=night, women_mode=women)
    if not routes:
        raise HTTPException(404, "Could not build routes — check place names for this city")
    saved = store.save_routes(routes)
    return {"routes": saved, "count": len(saved), "realtime_sources": ["gtfs_static", "osm_cctv"]}


@router.get("/{route_id}")
def get_route(route_id: str):
    route = store.get_route(route_id)
    if not route:
        raise HTTPException(404, "Route not found")
    return route
