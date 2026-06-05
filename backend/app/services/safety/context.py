from app.services.safety.osm_cctv import osm_cctv
from app.repositories import store


def live_context(lat: float, lng: float, city_id: str) -> dict:
    cctv = osm_cctv.nearby(lat, lng, city_id, radius_m=600, limit=15)
    reports = store.reports_near(lat, lng, city_id, radius_km=0.8)
    cam_count = len(cctv)

    if cam_count >= 5:
        crowd = "moderate — CCTV-monitored corridor"
        lighting = "well_lit"
    elif cam_count >= 2:
        crowd = "low-moderate"
        lighting = "adequate"
    else:
        crowd = "sparse — stay alert"
        lighting = "variable"

    return {
        "latitude": lat,
        "longitude": lng,
        "city": city_id,
        "cctv_count": cam_count,
        "cctv_nodes": cctv,
        "community_reports": len(reports),
        "reports": reports[:5],
        "crowd_level": crowd,
        "lighting": lighting,
        "live": True,
    }
