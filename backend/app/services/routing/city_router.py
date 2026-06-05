import json
import uuid

from app.services.carbon.token_service import CarbonTokenService
from app.services.cities.city_registry import CityConfig, get_city
from app.services.data import repository as repo
from app.services.recommendations.nudge_engine import generate_recommendations
from app.services.safety.location_context import analyze_route_endpoints
from app.services.safety.scoring_engine import SafetyScoringEngine

ROUTE_TEMPLATES: dict[str, dict[str, list[dict]]] = {
    "chennai": {
        "fastest": [
            {"mode": "walk", "from": "Origin", "to": "Teynampet Metro", "duration_min": 7, "distance_km": 0.6},
            {"mode": "metro", "from": "Teynampet", "to": "Chennai Central", "duration_min": 18, "distance_km": 6.2},
            {"mode": "walk", "from": "Chennai Central", "to": "Destination", "duration_min": 5, "distance_km": 0.4},
        ],
        "safest": [
            {"mode": "walk", "from": "Origin", "to": "Nungambakkam Metro", "duration_min": 10, "distance_km": 0.7},
            {"mode": "metro", "from": "Nungambakkam", "to": "Egmore", "duration_min": 8, "distance_km": 2.5},
            {"mode": "metro", "from": "Egmore", "to": "Chennai Central", "duration_min": 4, "distance_km": 1.2},
            {"mode": "walk", "from": "Chennai Central", "to": "Destination", "duration_min": 4, "distance_km": 0.3},
        ],
        "greenest": [
            {"mode": "walk", "from": "Origin", "to": "T Nagar Bus Stop", "duration_min": 4, "distance_km": 0.3},
            {"mode": "bus", "from": "T Nagar", "to": "Egmore", "duration_min": 28, "distance_km": 5.8},
            {"mode": "walk", "from": "Egmore", "to": "Destination", "duration_min": 8, "distance_km": 0.6},
        ],
    },
    "hyderabad": {
        "fastest": [
            {"mode": "walk", "from": "Origin", "to": "Raidurg Metro", "duration_min": 6, "distance_km": 0.5},
            {"mode": "metro", "from": "Raidurg", "to": "Secunderabad East", "duration_min": 28, "distance_km": 14.5},
            {"mode": "walk", "from": "Secunderabad East", "to": "Destination", "duration_min": 8, "distance_km": 0.7},
        ],
        "safest": [
            {"mode": "walk", "from": "Origin", "to": "Raidurg Metro", "duration_min": 8, "distance_km": 0.6},
            {"mode": "metro", "from": "Raidurg", "to": "Paradise", "duration_min": 22, "distance_km": 11.0},
            {"mode": "metro", "from": "Paradise", "to": "Secunderabad East", "duration_min": 8, "distance_km": 3.5},
            {"mode": "walk", "from": "Secunderabad East", "to": "Destination", "duration_min": 6, "distance_km": 0.5},
        ],
        "greenest": [
            {"mode": "walk", "from": "Origin", "to": "Bus Stop", "duration_min": 5, "distance_km": 0.4},
            {"mode": "bus", "from": "Bus Stop", "to": "Secunderabad", "duration_min": 38, "distance_km": 12.0},
            {"mode": "walk", "from": "Secunderabad", "to": "Destination", "duration_min": 9, "distance_km": 0.7},
        ],
    },
}

VARIANT_PARAMS = {
    "fastest": dict(road_type="arterial", lighting="moderate", crowd="high", walking_meters=1200),
    "safest": dict(road_type="main_road", lighting="good", crowd="low", walking_meters=600),
    "greenest": dict(road_type="main_road", lighting="good", crowd="moderate", walking_meters=1100),
}


class CityRouter:
    def __init__(self) -> None:
        self.safety_engine = SafetyScoringEngine()
        self.carbon_service = CarbonTokenService()
        self._landmarks: dict[str, dict[str, dict]] = {}

    def _load_landmarks(self, city: CityConfig) -> dict[str, dict]:
        if city.id not in self._landmarks:
            with open(city.landmarks_path) as f:
                self._landmarks[city.id] = {k.lower(): v for k, v in json.load(f).items()}
        return self._landmarks[city.id]

    def _resolve(self, place: str, city: CityConfig) -> dict:
        landmarks = self._load_landmarks(city)
        key = place.strip().lower()
        if key in landmarks:
            return landmarks[key]
        for name, data in landmarks.items():
            if key in name or name in key:
                return data
        lat, lng = city.default_center
        return {"lat": lat, "lng": lng, "name": place}

    def _build_legs(self, city_id: str, variant: str) -> list[dict]:
        return ROUTE_TEMPLATES.get(city_id, ROUTE_TEMPLATES["chennai"]).get(
            variant, ROUTE_TEMPLATES["chennai"]["fastest"]
        )

    def _safety_params(self, variant: str, women_safety_mode: bool, location_ctx: dict) -> dict:
        p = VARIANT_PARAMS.get(variant, VARIANT_PARAMS["fastest"]).copy()
        p["women_safety_mode"] = women_safety_mode
        p["cctv_nearby"] = location_ctx["cctv_nearby"]
        p["verified_reports_nearby"] = location_ctx["verified_reports_nearby"]
        p["harassment_reports_nearby"] = location_ctx["harassment_reports_nearby"]
        p["community_unsafe"] = location_ctx["community_unsafe"]
        if location_ctx["broken_lights_nearby"] > 0:
            p["lighting"] = "poor"
        if location_ctx["verified_reports_nearby"] > 0 and not location_ctx["community_unsafe"]:
            p["community_safe"] = True
        return p

    def search(
        self,
        source: str,
        destination: str,
        city_id: str = "chennai",
        women_safety_mode: bool = False,
        prefer_night_safe: bool = False,
    ) -> list[dict]:
        city = get_city(city_id)
        src = self._resolve(source, city)
        dst = self._resolve(destination, city)
        reports = repo.get_safety_reports(city.id)
        location_ctx = analyze_route_endpoints(
            src["lat"], src["lng"], dst["lat"], dst["lng"], reports, city_id=city.id
        )
        routes = []

        for variant, eta_offset in [("fastest", 0), ("safest", 4), ("greenest", 8)]:
            legs = self._build_legs(city.id, variant)
            safety_params = self._safety_params(variant, women_safety_mode, location_ctx)
            safety = self.safety_engine.score_route(**safety_params)
            tokens, co2 = self.carbon_service.estimate_route_reward(legs)
            distance = round(sum(l["distance_km"] for l in legs), 1)
            eta = sum(l["duration_min"] for l in legs) + eta_offset

            if prefer_night_safe and variant != "safest":
                safety = self.safety_engine.score_route(
                    **{**safety_params, "road_type": "narrow"}
                )

            routes.append({
                "id": str(uuid.uuid4()),
                "route_type": variant,
                "source": src["name"],
                "destination": dst["name"],
                "source_lat": src["lat"],
                "source_lng": src["lng"],
                "dest_lat": dst["lat"],
                "dest_lng": dst["lng"],
                "eta_minutes": eta,
                "distance_km": distance,
                "safety_score": safety.total,
                "safety_label": safety.label,
                "safety_breakdown": [
                    {"factor": f.factor, "impact": f.impact, "description": f.description}
                    for f in safety.factors
                ],
                "cctv_nearby": location_ctx["cctv_nearby"],
                "community_reports_nearby": location_ctx["community_reports_nearby"],
                "carbon_saved_kg": co2,
                "reward_tokens": tokens,
                "legs": legs,
                "recommendations": [],
                "city": city.id,
            })

        generate_recommendations(routes)
        return routes
