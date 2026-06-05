"""Fetch real CCTV / surveillance camera positions from OpenStreetMap via Overpass."""

import json
import time
from typing import Optional

import httpx

from app.services.cities.city_registry import get_city
from app.services.safety.geo_utils import haversine_m

OVERPASS_QUERY = """
[out:json][timeout:40];
(
  node["man_made"="surveillance"]({south},{west},{north},{east});
  node["surveillance:type"="camera"]({south},{west},{north},{east});
);
out body;
"""

CACHE_TTL_SECONDS = 3600


class OSMCCTVService:
    def __init__(self) -> None:
        self._cache: dict[str, dict] = {}

    def _bbox_query(self, south: float, west: float, north: float, east: float) -> str:
        return OVERPASS_QUERY.format(south=south, west=west, north=north, east=east)

    def _parse_elements(self, elements: list) -> list[dict]:
        cameras = []
        for el in elements:
            if el.get("type") != "node":
                continue
            lat, lng = el.get("lat"), el.get("lon")
            if lat is None or lng is None:
                continue
            tags = el.get("tags") or {}
            cameras.append({
                "id": str(el.get("id")),
                "latitude": lat,
                "longitude": lng,
                "name": tags.get("name"),
                "surveillance_type": tags.get("surveillance:type") or tags.get("surveillance"),
                "operator": tags.get("operator"),
                "source": "openstreetmap",
            })
        return cameras

    def _get_city_cache(self, city_id: str) -> dict:
        city = get_city(city_id)
        if city.id not in self._cache:
            self._cache[city.id] = {"cameras": [], "loaded_at": 0}
        return self._cache[city.id]

    def _load_disk_cache(self, city_id: str) -> bool:
        city = get_city(city_id)
        path = city.cctv_cache_path
        if not path.exists():
            return False
        try:
            data = json.loads(path.read_text())
            entry = self._get_city_cache(city_id)
            entry["cameras"] = data.get("cameras", [])
            entry["loaded_at"] = data.get("fetched_at", 0)
            return bool(entry["cameras"])
        except (json.JSONDecodeError, OSError):
            return False

    def _save_disk_cache(self, city_id: str) -> None:
        city = get_city(city_id)
        entry = self._get_city_cache(city_id)
        city.cctv_cache_path.parent.mkdir(parents=True, exist_ok=True)
        city.cctv_cache_path.write_text(json.dumps({
            "fetched_at": entry["loaded_at"],
            "source": "openstreetmap",
            "city": city.id,
            "bbox": city.bbox,
            "cameras": entry["cameras"],
        }, indent=2))

    def _fetch_from_overpass(self, south: float, west: float, north: float, east: float) -> list[dict]:
        query = self._bbox_query(south, west, north, east)
        with httpx.Client(timeout=45.0) as client:
            resp = client.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": query},
                headers={"User-Agent": "SafarAI/1.0 (hackathon mobility safety)"},
            )
            resp.raise_for_status()
            payload = resp.json()
        return self._parse_elements(payload.get("elements", []))

    def ensure_loaded(self, city_id: str = "chennai") -> None:
        entry = self._get_city_cache(city_id)
        if entry["cameras"] and (time.time() - entry["loaded_at"]) < CACHE_TTL_SECONDS:
            return

        city = get_city(city_id)
        south, west, north, east = city.bbox
        try:
            cameras = self._fetch_from_overpass(south, west, north, east)
            if cameras:
                entry["cameras"] = cameras
                entry["loaded_at"] = time.time()
                self._save_disk_cache(city_id)
                return
        except Exception as exc:
            print(f"[OSMCCTV:{city_id}] Overpass fetch failed: {exc}")

        if self._load_disk_cache(city_id):
            return

        entry["cameras"] = []
        entry["loaded_at"] = time.time()

    def get_all_cameras(self, city_id: str = "chennai") -> list[dict]:
        self.ensure_loaded(city_id)
        return list(self._get_city_cache(city_id)["cameras"])

    def get_cameras_near(
        self,
        lat: float,
        lng: float,
        radius_m: float = 500,
        city_id: str = "chennai",
    ) -> list[dict]:
        self.ensure_loaded(city_id)
        cameras = self._get_city_cache(city_id)["cameras"]
        return [
            {**cam, "distance_m": round(haversine_m(lat, lng, cam["latitude"], cam["longitude"]))}
            for cam in cameras
            if haversine_m(lat, lng, cam["latitude"], cam["longitude"]) <= radius_m
        ]

    def count_cameras_near(
        self,
        lat: float,
        lng: float,
        radius_m: float = 400,
        city_id: str = "chennai",
    ) -> int:
        return len(self.get_cameras_near(lat, lng, radius_m, city_id))

    def meta(self, city_id: str = "chennai") -> dict:
        self.ensure_loaded(city_id)
        city = get_city(city_id)
        entry = self._get_city_cache(city_id)
        return {
            "city": city.id,
            "source": "openstreetmap",
            "total_cameras": len(entry["cameras"]),
            "bbox": {
                "south": city.bbox[0],
                "west": city.bbox[1],
                "north": city.bbox[2],
                "east": city.bbox[3],
            },
            "cached_at": entry["loaded_at"],
            "cache_file": str(city.cctv_cache_path),
        }


cctv_service = OSMCCTVService()
