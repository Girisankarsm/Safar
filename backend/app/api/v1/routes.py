from fastapi import APIRouter
from app.schemas.schemas import RouteSearchRequest, RouteSearchResponse
from app.services.routing.hyderabad_router import HyderabadRouter
from app.core.demo_store import store

router = APIRouter()
hyderabad_router = HyderabadRouter()


@router.post("/search", response_model=RouteSearchResponse)
def search_routes(req: RouteSearchRequest):
    routes = hyderabad_router.search(
        source=req.source,
        destination=req.destination,
        women_safety_mode=req.women_safety_mode,
        prefer_night_safe=req.prefer_night_safe,
    )
    store.cache_routes(routes)
    return {"routes": routes}
