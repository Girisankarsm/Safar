from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal


SafetyLabel = Literal["Safe", "Moderate", "Risky"]


@dataclass
class SafetyFactor:
    factor: str
    impact: int
    description: str


@dataclass
class SafetyScore:
    total: int
    label: SafetyLabel
    factors: list[SafetyFactor] = field(default_factory=list)


ROAD_TYPE_SCORES = {
    "main_road": 20,
    "arterial": 10,
    "residential": 5,
    "service_road": 0,
    "narrow": -15,
    "alley": -20,
}

LIGHTING_SCORES = {
    "good": 15,
    "moderate": 0,
    "poor": -20,
}

CROWD_SCORES = {
    "low": 10,
    "moderate": 0,
    "high": -10,
    "very_high": -15,
}


def get_time_penalty(hour: int) -> tuple[int, str]:
    if 22 <= hour or hour < 5:
        return -10, "Night travel (10PM–5AM)"
    if 5 <= hour < 7:
        return -5, "Early morning low visibility"
    if 18 <= hour < 22:
        return -5, "Evening peak with reduced visibility"
    return 5, "Daylight travel"


def get_walking_penalty(meters: float) -> tuple[int, str]:
    if meters > 1200:
        return -15, f"Long walking distance ({int(meters)}m)"
    if meters > 800:
        return -10, f"Moderate walking distance ({int(meters)}m)"
    if meters > 400:
        return -5, f"Short walk required ({int(meters)}m)"
    return 5, f"Minimal walking ({int(meters)}m)"


def score_label(total: int) -> SafetyLabel:
    if total >= 75:
        return "Safe"
    if total >= 50:
        return "Moderate"
    return "Risky"


class SafetyScoringEngine:
    BASE_SCORE = 70

    def score_route(
        self,
        *,
        road_type: str = "main_road",
        lighting: str = "moderate",
        crowd: str = "moderate",
        walking_meters: float = 500,
        community_safe: bool = False,
        community_unsafe: bool = False,
        verified_reports_nearby: int = 0,
        harassment_reports_nearby: int = 0,
        cctv_nearby: int = 0,
        women_safety_mode: bool = False,
        hour: int | None = None,
    ) -> SafetyScore:
        hour = hour if hour is not None else datetime.now().hour
        factors: list[SafetyFactor] = []
        total = self.BASE_SCORE

        road_impact = ROAD_TYPE_SCORES.get(road_type, 0)
        total += road_impact
        factors.append(SafetyFactor("Road type", road_impact, f"{road_type.replace('_', ' ').title()} segment"))

        lighting_impact = LIGHTING_SCORES.get(lighting, 0)
        total += lighting_impact
        factors.append(SafetyFactor("Lighting", lighting_impact, f"{lighting.title()} lighting estimate"))

        crowd_impact = CROWD_SCORES.get(crowd, 0)
        total += crowd_impact
        factors.append(SafetyFactor("Crowd density", crowd_impact, f"{crowd.replace('_', ' ').title()} crowd expected"))

        walk_impact, walk_desc = get_walking_penalty(walking_meters)
        total += walk_impact
        factors.append(SafetyFactor("Walking distance", walk_impact, walk_desc))

        time_impact, time_desc = get_time_penalty(hour)
        total += time_impact
        factors.append(SafetyFactor("Time of day", time_impact, time_desc))

        if community_safe:
            total += 25
            factors.append(SafetyFactor("Community verified safe", 25, "Area marked safe by community"))
        if community_unsafe:
            total -= 25
            factors.append(SafetyFactor("Community unsafe report", -25, "Unsafe area reported nearby"))

        if verified_reports_nearby > 0:
            bonus = min(verified_reports_nearby * 3, 15)
            total += bonus
            factors.append(SafetyFactor("Verified safe reports", bonus, f"{verified_reports_nearby} verified reports nearby"))

        if harassment_reports_nearby > 0:
            penalty = min(harassment_reports_nearby * 8, 30)
            total -= penalty
            factors.append(SafetyFactor("Harassment reports", -penalty, f"{harassment_reports_nearby} harassment reports nearby"))

        cctv_impact, cctv_desc = self._cctv_impact(cctv_nearby, hour)
        total += cctv_impact
        factors.append(SafetyFactor("CCTV coverage (OSM)", cctv_impact, cctv_desc))

        if women_safety_mode:
            total += 5
            factors.append(SafetyFactor("Women safety mode", 5, "Route optimized for women commuters"))

        total = max(0, min(100, total))
        return SafetyScore(total=total, label=score_label(total), factors=factors)

    @staticmethod
    def _cctv_impact(count: int, hour: int) -> tuple[int, str]:
        night = hour >= 22 or hour < 5
        if count >= 6:
            bonus = 18 if night else 15
            return bonus, f"{count} real OSM CCTV cameras within 400m (high coverage)"
        if count >= 3:
            bonus = 14 if night else 10
            return bonus, f"{count} real OSM CCTV cameras within 400m (moderate coverage)"
        if count >= 1:
            bonus = 10 if night else 5
            return bonus, f"{count} real OSM CCTV camera(s) within 400m"
        penalty = -8 if night else -5
        return penalty, "No OSM CCTV coverage within 400m of route endpoints"
