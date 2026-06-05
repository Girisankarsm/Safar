import json
import uuid
from pathlib import Path

from app.services.carbon.token_service import CarbonTokenService
from app.services.recommendations.nudge_engine import generate_recommendations
from app.services.safety.scoring_engine import SafetyScoringEngine

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "hyderabad"


class HyderabadRouter:
    def __init__(self) -> None:
        self.safety_engine = SafetyScoringEngine()
        self.carbon_service = CarbonTokenService()
        with open(DATA_DIR / "landmarks.json") as f:
            self.landmarks = {k.lower(): v for k, v in json.load(f).items()}

    def _resolve(self, place: str) -> dict:
        key = place.strip().lower()
        if key in self.landmarks:
            return self.landmarks[key]
        for name, data in self.landmarks.items():
            if key in name or name in key:
                return data
        return {"lat": 17.44, "lng": 78.45, "name": place}

    def _build_legs(self, variant: str) -> list[dict]:
        templates = {
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
        }
        return templates.get(variant, templates["fastest"])

    def _safety_params(self, variant: str, women_safety_mode: bool) -> dict:
        params = {
            "fastest": dict(road_type="arterial", lighting="moderate", crowd="high", walking_meters=1200),
            "safest": dict(road_type="main_road", lighting="good", crowd="low", walking_meters=600, community_safe=True),
            "greenest": dict(road_type="main_road", lighting="good", crowd="moderate", walking_meters=1100),
        }
        p = params.get(variant, params["fastest"])
        p["women_safety_mode"] = women_safety_mode
        if variant == "safest":
            p["verified_reports_nearby"] = 2
        if variant == "fastest":
            p["harassment_reports_nearby"] = 1
        return p

    def search(
        self,
        source: str,
        destination: str,
        women_safety_mode: bool = False,
        prefer_night_safe: bool = False,
    ) -> list[dict]:
        src = self._resolve(source)
        dst = self._resolve(destination)
        routes = []

        for variant, eta_offset in [("fastest", 0), ("safest", 5), ("greenest", 10)]:
            legs = self._build_legs(variant)
            safety = self.safety_engine.score_route(**self._safety_params(variant, women_safety_mode))
            tokens, co2 = self.carbon_service.estimate_route_reward(legs)
            distance = round(sum(l["distance_km"] for l in legs), 1)
            eta = sum(l["duration_min"] for l in legs) + eta_offset

            if prefer_night_safe and variant != "safest":
                safety = self.safety_engine.score_route(
                    **{**self._safety_params(variant, women_safety_mode), "road_type": "narrow"}
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
                "carbon_saved_kg": co2,
                "reward_tokens": tokens,
                "legs": legs,
                "recommendations": [],
                "city": "hyderabad",
            })

        generate_recommendations(routes)
        return routes
