"""Resolve and suggest place names via local landmarks + OSM Nominatim."""

import json
import time
from pathlib import Path

import httpx

from app.services.routing.gtfs_transit import gtfs_service

DATA_ROOT = Path(__file__).resolve().parent.parent.parent / "data"

CITY_VIEWBOX = {
    # left, top, right, bottom (min_lon, max_lat, max_lon, min_lat)
    "chennai": (80.05, 13.25, 80.35, 12.85),
    "hyderabad": (78.30, 17.55, 78.65, 17.25),
    "bangalore": (77.40, 13.20, 77.85, 12.75),
}

CITY_LABEL = {
    "chennai": "Chennai, Tamil Nadu, India",
    "hyderabad": "Hyderabad, Telangana, India",
    "bangalore": "Bengaluru, Karnataka, India",
}

NOMINATIM_HEADERS = {"User-Agent": "SafarAI/2.0 (urban mobility hackathon)"}
_SUGGEST_CACHE: dict[tuple[str, str], tuple[float, list[dict]]] = {}
_SUGGEST_TTL = 120


def _match_score(query: str, candidate: str) -> int:
    q = query.strip().lower()
    c = candidate.strip().lower()
    if not q or not c:
        return 0
    if c == q:
        return 100
    if c.startswith(q):
        return 92
    if q in c:
        return 75
    for word in c.replace("-", " ").split():
        if word.startswith(q):
            return 62
    return 0


def _in_viewbox(lat: float, lng: float, city_id: str) -> bool:
    box = CITY_VIEWBOX.get(city_id)
    if not box:
        return False
    left, top, right, bottom = box
    return bottom <= lat <= top and left <= lng <= right


def _load_landmarks(city_id: str) -> dict:
    path = DATA_ROOT / city_id / "landmarks.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text())


def _short_label(display_name: str, city_id: str) -> tuple[str, str]:
    parts = [p.strip() for p in display_name.split(",") if p.strip()]
    name = parts[0] if parts else display_name
    city_hint = CITY_LABEL.get(city_id, "").split(",")[0]
    subtitle_parts = [p for p in parts[1:4] if city_hint.lower() not in p.lower()]
    subtitle = ", ".join(subtitle_parts) if subtitle_parts else city_hint
    return name, subtitle


def _dedupe_suggestions(items: list[dict], limit: int) -> list[dict]:
    seen: list[tuple[str, float, float]] = []
    out: list[dict] = []
    for item in items:
        key = item["name"].strip().lower()
        lat, lng = item["lat"], item["lng"]
        duplicate = False
        for name_key, slat, slng in seen:
            if key == name_key or (abs(slat - lat) < 0.002 and abs(slng - lng) < 0.002):
                duplicate = True
                break
        if duplicate:
            continue
        seen.append((key, lat, lng))
        out.append(item)
        if len(out) >= limit:
            break
    return out


def _local_suggestions(query: str, city_id: str) -> list[dict]:
    q = query.strip()
    if len(q) < 1:
        return []

    scored: list[tuple[int, dict]] = []

    for key, place in _load_landmarks(city_id).items():
        score = max(_match_score(q, key), _match_score(q, place.get("name", key)))
        if score > 0:
            scored.append(
                (
                    score,
                    {
                        "name": place["name"],
                        "subtitle": "Popular place",
                        "lat": place["lat"],
                        "lng": place["lng"],
                        "source": "landmark",
                    },
                )
            )

    for stop in gtfs_service.get_metro_stops(city_id):
        score = _match_score(q, stop.get("name", ""))
        if score > 0:
            scored.append(
                (
                    score - 2,
                    {
                        "name": stop["name"],
                        "subtitle": f"{stop.get('line', 'metro').title()} Metro · {CITY_LABEL[city_id].split(',')[0]}",
                        "lat": stop["lat"],
                        "lng": stop["lng"],
                        "source": "metro",
                    },
                )
            )

    for stop in gtfs_service.get_bus_stops(city_id):
        score = _match_score(q, stop.get("name", ""))
        if score > 0:
            scored.append(
                (
                    score - 4,
                    {
                        "name": stop["name"],
                        "subtitle": f"Bus stop · {CITY_LABEL[city_id].split(',')[0]}",
                        "lat": stop["lat"],
                        "lng": stop["lng"],
                        "source": "bus",
                    },
                )
            )

    scored.sort(key=lambda x: (-x[0], x[1]["name"]))
    return [item for _, item in scored]


def _nominatim_suggestions(query: str, city_id: str, limit: int = 6) -> list[dict]:
    q = query.strip()
    if len(q) < 2:
        return []

    cache_key = (city_id, q.lower())
    cached = _SUGGEST_CACHE.get(cache_key)
    if cached and time.time() - cached[0] < _SUGGEST_TTL:
        return cached[1]

    viewbox = CITY_VIEWBOX.get(city_id)
    if not viewbox:
        return []

    params = {
        "q": f"{q}, {CITY_LABEL[city_id]}",
        "format": "json",
        "addressdetails": 1,
        "limit": limit,
        "viewbox": ",".join(str(v) for v in viewbox),
        "bounded": 1,
    }

    try:
        with httpx.Client(timeout=10, headers=NOMINATIM_HEADERS) as client:
            resp = client.get("https://nominatim.openstreetmap.org/search", params=params)
            resp.raise_for_status()
            results = resp.json()
    except Exception as exc:
        print(f"[Geocode] suggest failed for {q!r}: {exc}")
        return []

    out: list[dict] = []
    for hit in results:
        lat = float(hit["lat"])
        lng = float(hit["lon"])
        if not _in_viewbox(lat, lng, city_id):
            continue
        name, subtitle = _short_label(hit.get("display_name", q), city_id)
        out.append(
            {
                "name": name,
                "subtitle": subtitle,
                "lat": lat,
                "lng": lng,
                "source": "osm",
            }
        )

    _SUGGEST_CACHE[cache_key] = (time.time(), out)
    return out


def suggest_places(query: str, city_id: str, limit: int = 8) -> list[dict]:
    local = _local_suggestions(query, city_id)
    remote = _nominatim_suggestions(query, city_id, limit=6) if len(query.strip()) >= 2 else []
    merged = local + remote
    return _dedupe_suggestions(merged, limit)


def geocode_place(name: str, city_id: str) -> dict | None:
    viewbox = CITY_VIEWBOX.get(city_id)
    if not viewbox or not name.strip():
        return None

    # Prefer an exact local landmark hit first.
    key = name.strip().lower()
    landmarks = _load_landmarks(city_id)
    if key in landmarks:
        return landmarks[key]

    for k, v in landmarks.items():
        if key == v.get("name", "").lower() or key in k or k in key:
            return v

    query = f"{name.strip()}, {CITY_LABEL[city_id]}"
    params = {
        "q": query,
        "format": "json",
        "limit": 3,
        "viewbox": ",".join(str(v) for v in viewbox),
        "bounded": 1,
    }

    try:
        with httpx.Client(timeout=12, headers=NOMINATIM_HEADERS) as client:
            resp = client.get("https://nominatim.openstreetmap.org/search", params=params)
            resp.raise_for_status()
            results = resp.json()
    except Exception as exc:
        print(f"[Geocode] Nominatim failed for {name!r}: {exc}")
        return None

    for hit in results:
        lat = float(hit["lat"])
        lng = float(hit["lon"])
        if not _in_viewbox(lat, lng, city_id):
            continue
        label, _ = _short_label(hit.get("display_name", name), city_id)
        return {"lat": lat, "lng": lng, "name": label}

    return None
