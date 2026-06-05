"""Real OSM surveillance nodes via Overpass API with on-disk cache."""

import json
import time
from pathlib import Path

import httpx

from app.services.safety.geo import haversine_m

DATA_ROOT = Path(__file__).resolve().parent.parent.parent / "data"
OVERPASS = "https://overpass-api.de/api/interpreter"
CACHE_TTL_SEC = 86_400

CITY_BOUNDS = {
    "chennai": (12.85, 80.05, 13.25, 80.35),
    "hyderabad": (17.25, 78.30, 17.55, 78.65),
}


class OSMCCTVService:
    def __init__(self) -> None:
        self._memory: dict[str, tuple[float, list[dict]]] = {}

    def _cache_path(self, city_id: str) -> Path:
        return DATA_ROOT / city_id / "osm_cctv_cache.json"

    def _load_disk(self, city_id: str) -> list[dict] | None:
        path = self._cache_path(city_id)
        if not path.exists():
            return None
        try:
            payload = json.loads(path.read_text())
            if time.time() - payload.get("fetched_at", 0) > CACHE_TTL_SEC:
                return None
            return payload.get("nodes", [])
        except (json.JSONDecodeError, OSError):
            return None

    def _save_disk(self, city_id: str, nodes: list[dict]) -> None:
        path = self._cache_path(city_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"fetched_at": time.time(), "nodes": nodes}, indent=2))

    def _fetch_overpass(self, city_id: str) -> list[dict]:
        bounds = CITY_BOUNDS.get(city_id)
        if not bounds:
            return []
        south, west, north, east = bounds
        query = f"""
        [out:json][timeout:25];
        (
          node["man_made"="surveillance"]({south},{west},{north},{east});
          node["surveillance"]({south},{west},{north},{east});
        );
        out body;
        """
        try:
            with httpx.Client(timeout=30) as client:
                resp = client.post(OVERPASS, data={"data": query})
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            print(f"[OSM CCTV] fetch failed for {city_id}: {exc}")
            return self._load_disk(city_id) or []

        nodes = [
            {"id": n["id"], "lat": n["lat"], "lng": n["lon"], "tags": n.get("tags", {})}
            for n in data.get("elements", [])
            if n.get("type") == "node"
        ]
        self._save_disk(city_id, nodes)
        return nodes

    def get_nodes(self, city_id: str, force_refresh: bool = False) -> list[dict]:
        if not force_refresh:
            cached = self._memory.get(city_id)
            if cached and time.time() - cached[0] < CACHE_TTL_SEC:
                return cached[1]
            disk = self._load_disk(city_id)
            if disk is not None:
                self._memory[city_id] = (time.time(), disk)
                return disk

        nodes = self._fetch_overpass(city_id)
        self._memory[city_id] = (time.time(), nodes)
        return nodes

    def count_near(self, lat: float, lng: float, city_id: str, radius_m: float = 400) -> int:
        return sum(1 for n in self.get_nodes(city_id) if haversine_m(lat, lng, n["lat"], n["lng"]) <= radius_m)

    def nearby(self, lat: float, lng: float, city_id: str, radius_m: float = 500, limit: int = 20) -> list[dict]:
        ranked = []
        for n in self.get_nodes(city_id):
            d = haversine_m(lat, lng, n["lat"], n["lng"])
            if d <= radius_m:
                ranked.append({**n, "distance_m": round(d)})
        ranked.sort(key=lambda x: x["distance_m"])
        return ranked[:limit]


osm_cctv = OSMCCTVService()
