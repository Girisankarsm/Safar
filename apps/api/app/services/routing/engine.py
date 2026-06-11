"""Route builder — Safest, Cheapest, Balanced, Women-Friendly variants."""

import json
from pathlib import Path

from app.services.routing.geocode import geocode_place
from app.services.routing.gtfs_transit import gtfs_service
from app.services.safety.scoring import score_route
from app.repositories import store

DATA_ROOT = Path(__file__).resolve().parent.parent.parent / "data"


def _resolve_place(name: str, city_id: str) -> dict | None:
    key = name.strip().lower()
    path = DATA_ROOT / city_id / "landmarks.json"
    if not path.exists():
        return None
    data = json.loads(path.read_text())
    hit = data.get(key)
    if hit:
        return hit
    for k, v in data.items():
        if key in k or k in key:
            return v
    return geocode_place(name, city_id)


def _totals(legs: list[dict]) -> tuple[float, int]:
    km = sum(l["distance_km"] for l in legs)
    mins = sum(l["duration_min"] for l in legs)
    return round(km, 2), mins


def _car_co2(km: float) -> float:
    return round(km * 0.21, 2)


def _transit_co2(km: float) -> float:
    return round(km * 0.035, 2)


def _route_metrics(legs: list[dict], safety_score: int) -> dict:
    walk_km = round(sum(l["distance_km"] for l in legs if l["mode"] == "walk"), 2)
    transit_legs = [l for l in legs if l["mode"] in ("metro", "bus")]
    transfers = max(0, len(transit_legs) - 1)

    # Estimated INR cost: metro ₹40 base + ₹5/km, bus ₹25, walk free
    cost = 0.0
    for leg in legs:
        if leg["mode"] == "metro":
            cost += 40 + leg["distance_km"] * 5
        elif leg["mode"] == "bus":
            cost += 25 + leg["distance_km"] * 2
    cost = round(max(15, cost))

    reliability = min(98, 70 + len(transit_legs) * 8 + (10 if safety_score >= 70 else 0))
    crowd_levels = ["Low", "Moderate", "High", "Very High"]
    crowd_idx = min(3, transfers + (1 if any(l["mode"] == "metro" for l in legs) else 0))
    crowd = crowd_levels[crowd_idx]

    return {
        "walking_distance_km": walk_km,
        "transfer_count": transfers,
        "estimated_cost_inr": cost,
        "reliability_score": reliability,
        "crowd_level": crowd,
    }


def build_routes(
    source: str,
    destination: str,
    city_id: str,
    night_mode: bool = False,
    women_mode: bool = False,
) -> list[dict]:
    src = _resolve_place(source, city_id)
    dst = _resolve_place(destination, city_id)
    if not src or not dst:
        return []

    src_name, dst_name = src["name"], dst["name"]
    slat, slng = src["lat"], src["lng"]
    dlat, dlng = dst["lat"], dst["lng"]

    balanced_legs = gtfs_service.build_metro_route(
        slat, slng, dlat, dlng, city_id, src_name, dst_name, prefer_lit=False
    )
    safest_legs = gtfs_service.build_metro_route(
        slat, slng, dlat, dlng, city_id, src_name, dst_name, prefer_lit=True, extra_stops=True
    )
    cheapest_legs = gtfs_service.build_bus_route(
        slat, slng, dlat, dlng, city_id, src_name, dst_name, night_only=night_mode
    )
    if not cheapest_legs:
        cheapest_legs = balanced_legs

    women_legs = gtfs_service.build_metro_route(
        slat, slng, dlat, dlng, city_id, src_name, dst_name, prefer_lit=True, extra_stops=True
    )

    variants = [
        ("safest", safest_legs),
        ("cheapest", cheapest_legs),
        ("balanced", balanced_legs),
        ("women_friendly", women_legs),
    ]

    reports_near = len(store.reports_near((slat + dlat) / 2, (slng + dlng) / 2, city_id, 1.2))
    out: list[dict] = []

    for route_type, legs in variants:
        if not legs:
            continue
        if night_mode and not gtfs_service.is_night_safe_route(legs):
            continue

        use_women = women_mode or route_type == "women_friendly"
        safety = score_route(legs, city_id, reports_near, women_mode=use_women)
        km, mins = _totals(legs)
        car_co2 = _car_co2(km)
        transit_co2 = _transit_co2(km)
        saved = round(car_co2 - transit_co2, 2)
        tokens = max(5, int(saved * 8))
        metrics = _route_metrics(legs, safety["score"])

        recs = []
        if safety["score"] < 60:
            recs.append("Prefer metro over long walks after 10 PM")
        if any(l.get("women_only_coach") for l in legs):
            recs.append("Board women-only coach (first/last metro car)")
        if safety.get("cctv_nearby", 0) < 2:
            recs.append("Share live trip with emergency contacts")
        if route_type == "cheapest":
            recs.append("Lowest fare via bus and shared mobility")
        if route_type == "women_friendly":
            recs.append("Active roads with higher public visibility")

        out.append({
            "route_type": route_type,
            "source": src_name,
            "destination": dst_name,
            "source_lat": slat,
            "source_lng": slng,
            "dest_lat": dlat,
            "dest_lng": dlng,
            "legs": legs,
            "safety_score": safety["score"],
            "safety_label": safety["label"],
            "safety_breakdown": safety["breakdown"],
            "distance_km": km,
            "eta_minutes": mins,
            "car_co2_kg": car_co2,
            "transit_co2_kg": transit_co2,
            "carbon_saved_kg": saved,
            "reward_tokens": tokens,
            "recommendations": recs,
            "city": city_id,
            "night_safe": gtfs_service.is_night_safe_route(legs),
            "data_sources": ["gtfs_static", "osm_cctv", "community_reports"],
            **metrics,
        })

    return out
