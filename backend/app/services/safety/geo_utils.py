import math


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distance in meters between two WGS84 points."""
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def count_within_radius(
    points: list[tuple[float, float]],
    lat: float,
    lng: float,
    radius_m: float,
) -> int:
    return sum(1 for plat, plng in points if haversine_m(lat, lng, plat, plng) <= radius_m)
