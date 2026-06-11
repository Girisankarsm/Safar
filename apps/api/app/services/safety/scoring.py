"""Transparent safety scoring engine for Safar routes."""

from datetime import datetime

from app.services.safety.osm_cctv import osm_cctv


def _clamp(n: float, lo: int = 0, hi: int = 100) -> int:
    return max(lo, min(hi, int(round(n))))


def score_route(
    legs: list[dict],
    city_id: str,
    reports_near: int = 0,
    hour: int | None = None,
    women_mode: bool = False,
) -> dict:
    hour = hour if hour is not None else datetime.now().hour
    is_night = hour >= 22 or hour < 5

    # Component scores (0–100 each)
    community_base = max(20, 100 - min(80, reports_near * 12))
    popularity = 55 + min(40, sum(1 for l in legs if l["mode"] in ("metro", "bus")) * 12)
    police_proximity = 40
    cctv_nearby = 0
    for leg in legs:
        lat = leg.get("from_lat") or leg.get("lat")
        lng = leg.get("from_lng") or leg.get("lng")
        if lat and lng:
            cams = osm_cctv.count_near(lat, lng, city_id, 500)
            cctv_nearby += cams
            police_proximity = max(police_proximity, min(95, 40 + cams * 8))

    transit_activity = min(95, 50 + sum(8 for l in legs if l["mode"] in ("metro", "bus")))
    time_risk = 85 if not is_night else (55 if any(l["mode"] in ("metro", "bus") for l in legs) else 35)
    if women_mode and any(l.get("women_only_coach") for l in legs):
        community_base = min(100, community_base + 8)

    walk_penalty = 0
    for leg in legs:
        if leg["mode"] == "walk" and leg["distance_km"] > 0.5:
            walk_penalty += 6 if is_night else 3

    weighted = (
        community_base * 0.35
        + popularity * 0.25
        + police_proximity * 0.20
        + transit_activity * 0.10
        + time_risk * 0.10
    ) - walk_penalty

    score = _clamp(weighted)

    if score >= 80:
        label = "safe"
        risk_category = "Safe"
    elif score >= 50:
        label = "moderate"
        risk_category = "Moderate"
    else:
        label = "high_risk"
        risk_category = "High Risk"

    return {
        "score": score,
        "label": label,
        "risk_category": risk_category,
        "breakdown": [
            {"factor": "Community Safety Rating", "weight_pct": 35, "score": _clamp(community_base), "contribution": round(community_base * 0.35)},
            {"factor": "Route Popularity", "weight_pct": 25, "score": _clamp(popularity), "contribution": round(popularity * 0.25)},
            {"factor": "Police Station Proximity", "weight_pct": 20, "score": _clamp(police_proximity), "contribution": round(police_proximity * 0.20)},
            {"factor": "Public Transport Activity", "weight_pct": 10, "score": _clamp(transit_activity), "contribution": round(transit_activity * 0.10)},
            {"factor": "Time-of-Day Risk", "weight_pct": 10, "score": _clamp(time_risk), "contribution": round(time_risk * 0.10)},
        ],
        "cctv_nearby": cctv_nearby,
        "cctv_density": osm_cctv.density_score(cctv_nearby),
        "is_night": is_night,
    }
