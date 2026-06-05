from fastapi import APIRouter

from app.services.routing.gtfs_transit import gtfs_service
from app.services.safety.osm_cctv import osm_cctv

router = APIRouter(prefix="/cities", tags=["cities"])

CITIES = [
    {
        "id": "chennai",
        "name": "Chennai",
        "metro": "CMRL",
        "default": True,
        "center": {"lat": 13.0827, "lng": 80.2707},
    },
    {
        "id": "hyderabad",
        "name": "Hyderabad",
        "metro": "HMRL",
        "default": False,
        "center": {"lat": 17.385, "lng": 78.4867},
    },
]


@router.get("")
def list_cities():
    out = []
    for c in CITIES:
        cid = c["id"]
        out.append({
            **c,
            "metro_stops": len(gtfs_service.get_metro_stops(cid)),
            "cctv_cached": len(osm_cctv.get_nodes(cid)),
        })
    return {"cities": out}
