"""Demo safety zone data for heatmap visualization."""

from __future__ import annotations

# lat, lng, weight (0-1 risk intensity), zone_type
ZONES: dict[str, list[dict]] = {
    "chennai": [
        {"lat": 13.0827, "lng": 80.2707, "weight": 0.2, "zone_type": "safe", "label": "Marina corridor"},
        {"lat": 13.0478, "lng": 80.2422, "weight": 0.7, "zone_type": "moderate", "label": "T Nagar market"},
        {"lat": 13.0604, "lng": 80.2496, "weight": 0.85, "zone_type": "high_risk", "label": "Egmore underpass"},
        {"lat": 13.0732, "lng": 80.2609, "weight": 0.15, "zone_type": "safe", "label": "Central metro hub"},
        {"lat": 13.0067, "lng": 80.2206, "weight": 0.55, "zone_type": "moderate", "label": "Guindy industrial"},
        {"lat": 13.0358, "lng": 80.2337, "weight": 0.9, "zone_type": "high_risk", "label": "Dark service lane"},
        {"lat": 13.0896, "lng": 80.2209, "weight": 0.25, "zone_type": "safe", "label": "Anna Nagar main"},
        {"lat": 12.9941, "lng": 80.1709, "weight": 0.4, "zone_type": "moderate", "label": "Airport approach"},
    ],
    "trivandrum": [
        {"lat": 8.5241, "lng": 76.9366, "weight": 0.2, "zone_type": "safe", "label": "Technopark zone"},
        {"lat": 8.4875, "lng": 76.9525, "weight": 0.65, "zone_type": "moderate", "label": "East Fort"},
        {"lat": 8.5099, "lng": 76.9655, "weight": 0.8, "zone_type": "high_risk", "label": "Palayam junction"},
        {"lat": 8.4821, "lng": 76.9081, "weight": 0.3, "zone_type": "moderate", "label": "Kazhakoottam"},
        {"lat": 8.5036, "lng": 76.9498, "weight": 0.15, "zone_type": "safe", "label": "Central station"},
    ],
    "bangalore": [
        {"lat": 12.9716, "lng": 77.5946, "weight": 0.25, "zone_type": "safe", "label": "MG Road metro"},
        {"lat": 12.9352, "lng": 77.6245, "weight": 0.7, "zone_type": "moderate", "label": "Koramangala 5th block"},
        {"lat": 12.9698, "lng": 77.7499, "weight": 0.5, "zone_type": "moderate", "label": "Whitefield stretch"},
        {"lat": 12.9279, "lng": 77.6271, "weight": 0.85, "zone_type": "high_risk", "label": "HSR underpass"},
        {"lat": 12.9784, "lng": 77.6408, "weight": 0.2, "zone_type": "safe", "label": "Indiranagar 100ft"},
        {"lat": 12.9591, "lng": 77.6974, "weight": 0.75, "zone_type": "high_risk", "label": "Bellandur flyover"},
    ],
    "hyderabad": [
        {"lat": 17.4483, "lng": 78.3915, "weight": 0.2, "zone_type": "safe", "label": "HITEC City metro"},
        {"lat": 17.4399, "lng": 78.4983, "weight": 0.6, "zone_type": "moderate", "label": "Secunderabad"},
        {"lat": 17.3616, "lng": 78.4747, "weight": 0.8, "zone_type": "high_risk", "label": "Charminar lanes"},
        {"lat": 17.4947, "lng": 78.3996, "weight": 0.35, "zone_type": "moderate", "label": "Madhapur"},
    ],
}

SAFE_WAITING_SPOTS: dict[str, list[dict]] = {
    "chennai": [
        {"name": "Indian Oil — Anna Salai", "type": "petrol_pump", "lat": 13.0604, "lng": 80.2642},
        {"name": "Apollo Pharmacy — T Nagar", "type": "pharmacy", "lat": 13.0418, "lng": 80.2341},
        {"name": "AG-DMS Metro", "type": "metro", "lat": 13.0689, "lng": 80.2501},
        {"name": "Chennai Central Railway", "type": "railway", "lat": 13.0827, "lng": 80.2751},
        {"name": "Egmore Police Booth", "type": "police", "lat": 13.0732, "lng": 80.2609},
        {"name": "Apollo Hospital — Greams Rd", "type": "hospital", "lat": 13.0569, "lng": 80.2587},
        {"name": "Spencer Plaza", "type": "store", "lat": 13.0615, "lng": 80.2645},
    ],
    "trivandrum": [
        {"name": "BPCL — Technopark", "type": "petrol_pump", "lat": 8.5589, "lng": 76.8820},
        {"name": "MedPlus — Palayam", "type": "pharmacy", "lat": 8.5099, "lng": 76.9655},
        {"name": "Technopark Metro (planned hub)", "type": "metro", "lat": 8.5241, "lng": 76.9366},
        {"name": "Trivandrum Central", "type": "railway", "lat": 8.5036, "lng": 76.9498},
        {"name": "Museum Police Station", "type": "police", "lat": 8.5089, "lng": 76.9550},
        {"name": "KIMS Hospital", "type": "hospital", "lat": 8.5195, "lng": 76.9360},
    ],
    "bangalore": [
        {"name": "HP Petrol — MG Road", "type": "petrol_pump", "lat": 12.9756, "lng": 77.6063},
        {"name": "PharmEasy Store — Indiranagar", "type": "pharmacy", "lat": 12.9784, "lng": 77.6408},
        {"name": "MG Road Metro", "type": "metro", "lat": 12.9755, "lng": 77.6066},
        {"name": "KSR Bengaluru Station", "type": "railway", "lat": 12.9770, "lng": 77.5686},
        {"name": "Cubbon Park Police", "type": "police", "lat": 12.9763, "lng": 77.5929},
        {"name": "Manipal Hospital — Old Airport Rd", "type": "hospital", "lat": 12.9584, "lng": 77.6482},
        {"name": "Forum Mall — Koramangala", "type": "store", "lat": 12.9349, "lng": 77.6090},
    ],
    "hyderabad": [
        {"name": "IOCL — HITEC City", "type": "petrol_pump", "lat": 17.4483, "lng": 78.3915},
        {"name": "MedPlus — Madhapur", "type": "pharmacy", "lat": 17.4485, "lng": 78.3908},
        {"name": "Raidurg Metro", "type": "metro", "lat": 17.4412, "lng": 78.3822},
        {"name": "Secunderabad Railway", "type": "railway", "lat": 17.4399, "lng": 78.4983},
        {"name": "Jubilee Hills Police", "type": "police", "lat": 17.4326, "lng": 78.4071},
        {"name": "Apollo Jubilee Hills", "type": "hospital", "lat": 17.4319, "lng": 78.4075},
    ],
}


def get_zones(city_id: str) -> list[dict]:
    return ZONES.get(city_id, ZONES.get("chennai", []))


def get_safe_spots(city_id: str, lat: float | None = None, lng: float | None = None) -> list[dict]:
    from app.services.safety.geo import haversine_m

    spots = list(SAFE_WAITING_SPOTS.get(city_id, SAFE_WAITING_SPOTS.get("chennai", [])))
    if lat is not None and lng is not None:
        for s in spots:
            s["distance_m"] = round(haversine_m(lat, lng, s["lat"], s["lng"]))
        spots.sort(key=lambda x: x.get("distance_m", 99999))
    return spots
