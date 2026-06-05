"""Real GTFS-static route builder — fastest, safest, greenest variants."""

import json
from pathlib import Path

from app.services.routing.geocode import geocode_place
from app.services.routing.gtfs_transit import gtfs_service
from app.services.safety.scoring import score_route
from app.repositories import store

DATA_ROOT = Path(__file__).resolve().parent.parent.parent / "data"
DEMO_USER_ID = "a0000000-0000-0000-0000-000000000001"


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

    fastest_legs = gtfs_service.build_metro_route(
        slat, slng, dlat, dlng, city_id, src_name, dst_name, prefer_lit=False
    )
    safest_legs = gtfs_service.build_metro_route(
        slat, slng, dlat, dlng, city_id, src_name, dst_name, prefer_lit=True, extra_stops=True
    )
    green_legs = gtfs_service.build_bus_route(
        slat, slng, dlat, dlng, city_id, src_name, dst_name, night_only=night_mode
    )
    if not green_legs:
        green_legs = safest_legs

    variants = [
        ("fastest", fastest_legs),
        ("safest", safest_legs),
        ("greenest", green_legs),
    ]

    reports_near = len(store.reports_near((slat + dlat) / 2, (slng + dlng) / 2, city_id, 1.2))
    out: list[dict] = []

    for route_type, legs in variants:
        if not legs:
            continue
        if night_mode and not gtfs_service.is_night_safe_route(legs):
            continue

        safety = score_route(legs, city_id, reports_near, women_mode=women_mode)
        km, mins = _totals(legs)
        car_co2 = _car_co2(km)
        transit_co2 = _transit_co2(km)
        saved = round(car_co2 - transit_co2, 2)
        tokens = max(5, int(saved * 8))

        recs = []
        if safety["score"] < 60:
            recs.append("Prefer metro over long walks after 10 PM")
        if any(l.get("women_only_coach") for l in legs):
            recs.append("Board women-only coach (first/last metro car)")
        if safety["cctv_nearby"] < 2:
            recs.append("Share live trip with emergency contacts")

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
        })

    return out
