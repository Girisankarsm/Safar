from fastapi import APIRouter
from app.services.cities.city_registry import list_cities, get_city
from app.services.safety.osm_cctv_service import cctv_service

router = APIRouter()


@router.get("")
def get_cities():
    cities = list_cities()
    for c in cities:
        cctv_service.ensure_loaded(c["id"])
        c["cctv_count"] = len(cctv_service.get_all_cameras(c["id"]))
    return {"cities": cities, "default": "chennai"}


@router.get("/{city_id}")
def get_city_detail(city_id: str):
    city = get_city(city_id)
    cctv_service.ensure_loaded(city.id)
    return {
        "id": city.id,
        "name": city.name,
        "display_name": city.display_name,
        "default_source": city.default_source,
        "default_destination": city.default_destination,
        "demo_corridor": city.demo_corridor,
        "center": {"lat": city.default_center[0], "lng": city.default_center[1]},
        "cctv_count": len(cctv_service.get_all_cameras(city.id)),
    }
