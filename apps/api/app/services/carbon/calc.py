CAR_KG_PER_KM = 0.21
BIKE_KG_PER_KM = 0.08
TRANSIT_KG_PER_KM = 0.035


def trip_impact(distance_km: float, mode: str = "transit") -> dict:
    car = round(distance_km * CAR_KG_PER_KM, 2)
    bike = round(distance_km * BIKE_KG_PER_KM, 2)
    transit = round(distance_km * TRANSIT_KG_PER_KM, 2)
    saved_vs_car = round(car - transit, 2)
    saved_vs_bike = round(bike - transit, 2)
    tokens = max(3, int(saved_vs_car * 8))
    return {
        "distance_km": distance_km,
        "car_co2_kg": car,
        "bike_co2_kg": bike,
        "transit_co2_kg": transit,
        "saved_vs_car_kg": saved_vs_car,
        "saved_vs_bike_kg": saved_vs_bike,
        "green_miles_tokens": tokens,
        "nudge": f"You saved {saved_vs_car} kg CO₂ vs driving — that's {tokens} GreenMiles!",
    }
