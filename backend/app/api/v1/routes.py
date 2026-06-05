from fastapi import APIRouter
from app.schemas.schemas import RouteSearchRequest, RouteSearchResponse
from app.services.routing.city_router import CityRouter
from app.services.data import repository as repo

router = APIRouter()
city_router = CityRouter()


@router.post("/search", response_model=RouteSearchResponse)
def search_routes(req: RouteSearchRequest):
    routes = city_router.search(
        source=req.source,
        destination=req.destination,
        city_id=req.city,
        women_safety_mode=req.women_safety_mode,
        prefer_night_safe=req.prefer_night_safe,
    )
    repo.cache_routes(routes)
    return {"routes": routes}
