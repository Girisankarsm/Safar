"""Real-world safety context from OSM CCTV + community reports at a location."""

from app.services.safety.geo_utils import haversine_m
from app.services.safety.osm_cctv_service import cctv_service

HARASSMENT_TYPES = {"harassment", "unsafe_area"}
UNSAFE_TYPES = {"unsafe_area", "harassment", "dangerous_crossing", "flooded_road"}
POSITIVE_TYPES = {"safe_zone"}  # future community tags


def _reports_near(
    reports: list[dict],
    lat: float,
    lng: float,
    radius_m: float,
) -> list[dict]:
    return [
        r for r in reports
        if haversine_m(lat, lng, r["latitude"], r["longitude"]) <= radius_m
    ]


def analyze_location(
    lat: float,
    lng: float,
    reports: list[dict],
    radius_m: float = 400,
    city_id: str = "chennai",
) -> dict:
    """Build safety context for a real coordinate."""
    cctv_service.ensure_loaded(city_id)
    nearby_cctv = cctv_service.get_cameras_near(lat, lng, radius_m, city_id)
    nearby_reports = _reports_near(reports, lat, lng, radius_m)

    harassment = sum(1 for r in nearby_reports if r.get("report_type") in HARASSMENT_TYPES)
    unsafe = sum(1 for r in nearby_reports if r.get("report_type") in UNSAFE_TYPES)
    broken_lights = sum(1 for r in nearby_reports if r.get("report_type") == "broken_light")
    verified_safe = sum(
        1 for r in nearby_reports
        if r.get("is_verified") and r.get("report_type") not in UNSAFE_TYPES
    )

    return {
        "latitude": lat,
        "longitude": lng,
        "radius_m": radius_m,
        "cctv_count": len(nearby_cctv),
        "cctv_cameras": nearby_cctv,
        "community_reports_nearby": len(nearby_reports),
        "harassment_reports_nearby": harassment,
        "unsafe_reports_nearby": unsafe,
        "broken_lights_nearby": broken_lights,
        "verified_reports_nearby": verified_safe,
        "community_unsafe": unsafe > 0,
    }


def analyze_route_endpoints(
    src_lat: float,
    src_lng: float,
    dst_lat: float,
    dst_lng: float,
    reports: list[dict],
    radius_m: float = 400,
    city_id: str = "chennai",
) -> dict:
    """Merge safety context at route origin and destination (walking zones)."""
    src = analyze_location(src_lat, src_lng, reports, radius_m, city_id)
    dst = analyze_location(dst_lat, dst_lng, reports, radius_m, city_id)

    mid_lat = (src_lat + dst_lat) / 2
    mid_lng = (src_lng + dst_lng) / 2
    mid = analyze_location(mid_lat, mid_lng, reports, radius_m, city_id)

    # Use max CCTV along corridor — cameras at either end or midpoint matter for walks
    cctv_count = max(src["cctv_count"], dst["cctv_count"], mid["cctv_count"])

    return {
        "cctv_nearby": cctv_count,
        "cctv_cameras_route": {
            "origin": src["cctv_cameras"],
            "destination": dst["cctv_cameras"],
            "midpoint": mid["cctv_cameras"],
        },
        "harassment_reports_nearby": (
            src["harassment_reports_nearby"]
            + dst["harassment_reports_nearby"]
            + mid["harassment_reports_nearby"]
        ),
        "verified_reports_nearby": (
            src["verified_reports_nearby"]
            + dst["verified_reports_nearby"]
        ),
        "community_unsafe": src["community_unsafe"] or dst["community_unsafe"] or mid["community_unsafe"],
        "broken_lights_nearby": (
            src["broken_lights_nearby"]
            + dst["broken_lights_nearby"]
            + mid["broken_lights_nearby"]
        ),
        "community_reports_nearby": (
            src["community_reports_nearby"]
            + dst["community_reports_nearby"]
            + mid["community_reports_nearby"]
        ),
        "origin_context": src,
        "destination_context": dst,
    }
