from fastapi import APIRouter

from app.services.routing.gtfs_transit import gtfs_service

router = APIRouter(prefix="/transit", tags=["transit"])


@router.get("/stops")
def transit_stops(city: str = "chennai"):
    metro = gtfs_service.get_metro_stops(city)
    bus = gtfs_service.get_bus_stops(city)
    return {
        "city": city,
        "metro_stops": metro,
        "bus_stops": bus,
        "source": "gtfs_static",
        "women_coach_stations": sum(1 for s in metro if s.get("women_only_coach")),
        "night_bus_stops": sum(1 for s in bus if s.get("night_service")),
    }
