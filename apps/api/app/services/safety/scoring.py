"""Multi-factor safety scoring: CCTV, transit stops, community reports, night mode."""

from app.services.safety.osm_cctv import osm_cctv


def score_route(
    legs: list[dict],
    city_id: str,
    reports_near: int = 0,
    hour: int | None = None,
    women_mode: bool = False,
) -> dict:
    from datetime import datetime

    hour = hour if hour is not None else datetime.now().hour
    is_night = hour >= 22 or hour < 5

    cctv_pts = 0
    cctv_nearby = 0
    lighting_pts = 0
    transit_pts = 0
    women_pts = 0
    walk_penalty = 0

    for leg in legs:
        lat = leg.get("from_lat") or leg.get("lat")
        lng = leg.get("from_lng") or leg.get("lng")
        if lat and lng:
            cams = osm_cctv.count_near(lat, lng, city_id, 500)
            cctv_nearby += cams
            density = osm_cctv.density_score(cams)
            cctv_pts += int(density * 12 / 100)

        if leg["mode"] == "walk":
            if leg["distance_km"] > 0.6 and is_night:
                walk_penalty += 8
            elif leg["distance_km"] > 1.0:
                walk_penalty += 4
        if leg["mode"] in ("metro", "bus"):
            if leg.get("well_lit_stop", True):
                lighting_pts += 8
            transit_pts += 6
            if leg.get("women_only_coach") and women_mode:
                women_pts += 10

    report_penalty = min(25, reports_near * 5)
    night_bonus = 5 if is_night and transit_pts > 0 else 0

    raw = 55 + cctv_pts + lighting_pts + transit_pts + women_pts + night_bonus - walk_penalty - report_penalty
    score = max(15, min(98, int(raw)))

    if score >= 80:
        label = "excellent"
    elif score >= 65:
        label = "good"
    elif score >= 45:
        label = "moderate"
    else:
        label = "caution"

    return {
        "score": score,
        "label": label,
        "breakdown": [
            {"factor": "CCTV coverage", "impact": cctv_pts, "source": "osm_live"},
            {"factor": "Well-lit stops", "impact": lighting_pts, "source": "gtfs_static"},
            {"factor": "Public transit", "impact": transit_pts, "source": "gtfs_static"},
            {"factor": "Women-only coach", "impact": women_pts, "source": "gtfs_static"},
            {"factor": "Community reports", "impact": -report_penalty, "source": "supabase"},
            {"factor": "Night walk risk", "impact": -walk_penalty, "source": "realtime"},
        ],
        "cctv_nearby": cctv_nearby,
        "cctv_density": osm_cctv.density_score(cctv_nearby),
        "is_night": is_night,
    }
