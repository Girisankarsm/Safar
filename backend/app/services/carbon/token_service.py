from dataclasses import dataclass

TOKEN_RATES = {
    "metro": 5,
    "bus": 8,
    "walk": 10,
    "cycle": 12,
    "auto": 0,
    "car": 0,
}

CO2_KG_PER_KM = {
    "metro": 0.03,
    "bus": 0.05,
    "walk": 0.0,
    "cycle": 0.0,
    "auto": 0.12,
    "car": 0.21,
}

CAR_BASELINE = 0.21


@dataclass
class CarbonReward:
    tokens_earned: int
    co2_saved_kg: float
    breakdown: list[dict]


class CarbonTokenService:
    def calculate_trip_reward(self, legs: list[dict]) -> CarbonReward:
        total_tokens = 0
        total_co2_saved = 0.0
        breakdown = []

        for leg in legs:
            mode = leg.get("mode", "walk")
            distance = float(leg.get("distance_km", 0))
            mode_co2 = CO2_KG_PER_KM.get(mode, 0.05)
            car_co2 = distance * CAR_BASELINE
            leg_co2_saved = max(0, car_co2 - (distance * mode_co2))
            leg_tokens = int(distance * TOKEN_RATES.get(mode, 0))

            total_tokens += leg_tokens
            total_co2_saved += leg_co2_saved
            breakdown.append({
                "mode": mode,
                "distance_km": distance,
                "tokens": leg_tokens,
                "co2_saved_kg": round(leg_co2_saved, 2),
            })

        streak_bonus = 0
        total_tokens += streak_bonus

        return CarbonReward(
            tokens_earned=total_tokens,
            co2_saved_kg=round(total_co2_saved, 2),
            breakdown=breakdown,
        )

    def estimate_route_reward(self, legs: list[dict]) -> tuple[int, float]:
        reward = self.calculate_trip_reward(legs)
        return reward.tokens_earned, reward.co2_saved_kg
