"""GTFS-derived static transit data: real metro stops, schedules, night service."""

import json
from datetime import datetime
from pathlib import Path

from app.services.safety.geo import haversine_m

DATA_ROOT = Path(__file__).resolve().parent.parent.parent / "data"

WALK_SPEED_KMH = 4.5
METRO_SPEED_KMH = 35
BUS_SPEED_KMH = 18
METRO_DWELL_MIN = 2


class GTFSTransitService:
    def __init__(self) -> None:
        self._cache: dict[str, dict] = {}

    def _load(self, city_id: str) -> dict:
        if city_id not in self._cache:
            path = DATA_ROOT / city_id / "metro_stops.json"
            if path.exists():
                self._cache[city_id] = json.loads(path.read_text())
            else:
                self._cache[city_id] = {"stops": [], "bus_stops": []}
        return self._cache[city_id]

    def get_metro_stops(self, city_id: str) -> list[dict]:
        return self._load(city_id).get("stops", [])

    def get_bus_stops(self, city_id: str) -> list[dict]:
        return self._load(city_id).get("bus_stops", [])

    def get_all_transit_points(self, city_id: str) -> list[dict]:
        metro = [{**s, "mode": "metro"} for s in self.get_metro_stops(city_id)]
        bus = [{**s, "mode": "bus"} for s in self.get_bus_stops(city_id)]
        return metro + bus

    def nearest_metro(self, lat: float, lng: float, city_id: str, prefer_lit: bool = False) -> dict | None:
        stops = self.get_metro_stops(city_id)
        if not stops:
            return None
        ranked = sorted(stops, key=lambda s: haversine_m(lat, lng, s["lat"], s["lng"]))
        if prefer_lit:
            lit = [s for s in ranked if s.get("well_lit")]
            if lit:
                return {**lit[0], "distance_m": round(haversine_m(lat, lng, lit[0]["lat"], lit[0]["lng"]))}
        best = ranked[0]
        return {**best, "distance_m": round(haversine_m(lat, lng, best["lat"], best["lng"]))}

    def nearest_bus(self, lat: float, lng: float, city_id: str, night_only: bool = False) -> dict | None:
        stops = self.get_bus_stops(city_id)
        if night_only:
            stops = [s for s in stops if s.get("night_service")]
        if not stops:
            return None
        best = min(stops, key=lambda s: haversine_m(lat, lng, s["lat"], s["lng"]))
        return {**best, "distance_m": round(haversine_m(lat, lng, best["lat"], best["lng"]))}

    def metro_path(self, origin_id: str, dest_id: str, city_id: str) -> list[dict]:
        stops = {s["id"]: s for s in self.get_metro_stops(city_id)}
        origin, dest = stops.get(origin_id), stops.get(dest_id)
        if not origin or not dest:
            return []
        if origin["line"] != dest["line"]:
            return self._transfer_path(origin, dest, stops, city_id)
        line_stops = sorted(
            [s for s in stops.values() if s["line"] == origin["line"]],
            key=lambda s: s["seq"],
        )
        o_idx = next(i for i, s in enumerate(line_stops) if s["id"] == origin_id)
        d_idx = next(i for i, s in enumerate(line_stops) if s["id"] == dest_id)
        if o_idx <= d_idx:
            segment = line_stops[o_idx : d_idx + 1]
        else:
            segment = list(reversed(line_stops[d_idx : o_idx + 1]))
        return segment

    def _transfer_path(self, origin: dict, dest: dict, stops: dict, city_id: str) -> list[dict]:
        """Simple interchange via Ameerpet (HYD) or AG DMS (CHN) when lines differ."""
        hubs = {"ameerpet", "ag_dms", "nungambakkam"}
        hub = next((stops[h] for h in hubs if h in stops), None)
        if not hub:
            return [origin, dest]
        path1 = self.metro_path(origin["id"], hub["id"], city_id)
        path2 = self.metro_path(hub["id"], dest["id"], city_id)
        if not path1 or not path2:
            return [origin, dest]
        return path1 + path2[1:]

    @staticmethod
    def _walk_leg(from_name: str, to_name: str, distance_m: float) -> dict:
        km = distance_m / 1000
        mins = max(3, int((km / WALK_SPEED_KMH) * 60))
        return {
            "mode": "walk",
            "from": from_name,
            "to": to_name,
            "duration_min": mins,
            "distance_km": round(km, 2),
        }

    def _metro_leg(self, from_stop: dict, to_stop: dict) -> dict:
        dist_m = haversine_m(from_stop["lat"], from_stop["lng"], to_stop["lat"], to_stop["lng"])
        km = dist_m / 1000
        mins = max(METRO_DWELL_MIN, int((km / METRO_SPEED_KMH) * 60) + METRO_DWELL_MIN)
        return {
            "mode": "metro",
            "from": from_stop["name"],
            "to": to_stop["name"],
            "duration_min": mins,
            "distance_km": round(km, 2),
            "women_only_coach": from_stop.get("women_only_coach", False),
            "well_lit_stop": from_stop.get("well_lit", True),
            "service_end": from_stop.get("service_end", "23:00"),
            "from_lat": from_stop["lat"],
            "from_lng": from_stop["lng"],
            "to_lat": to_stop["lat"],
            "to_lng": to_stop["lng"],
        }

    def _bus_leg(self, from_stop: dict, to_stop: dict) -> dict:
        dist_m = haversine_m(from_stop["lat"], from_stop["lng"], to_stop["lat"], to_stop["lng"])
        km = dist_m / 1000
        mins = max(8, int((km / BUS_SPEED_KMH) * 60))
        return {
            "mode": "bus",
            "from": from_stop["name"],
            "to": to_stop["name"],
            "duration_min": mins,
            "distance_km": round(km, 2),
            "well_lit_stop": from_stop.get("well_lit", True),
            "night_service": from_stop.get("night_service", False),
            "service_end": from_stop.get("service_end", "22:00"),
        }

    def build_metro_route(
        self,
        src_lat: float,
        src_lng: float,
        dst_lat: float,
        dst_lng: float,
        city_id: str,
        src_name: str,
        dst_name: str,
        prefer_lit: bool = False,
        extra_stops: bool = False,
    ) -> list[dict]:
        origin_stop = self.nearest_metro(src_lat, src_lng, city_id, prefer_lit=prefer_lit)
        dest_stop = self.nearest_metro(dst_lat, dst_lng, city_id, prefer_lit=True)
        if not origin_stop or not dest_stop:
            return []

        if extra_stops and origin_stop["id"] != dest_stop["id"]:
            path = self.metro_path(origin_stop["id"], dest_stop["id"], city_id)
        else:
            path = [origin_stop, dest_stop] if origin_stop["id"] != dest_stop["id"] else [origin_stop]

        legs: list[dict] = []
        legs.append(self._walk_leg(src_name, origin_stop["name"], origin_stop["distance_m"]))

        for i in range(len(path) - 1):
            legs.append(self._metro_leg(path[i], path[i + 1]))

        dest_dist = haversine_m(dst_lat, dst_lng, dest_stop["lat"], dest_stop["lng"])
        legs.append(self._walk_leg(dest_stop["name"], dst_name, dest_dist))
        return legs

    def build_bus_route(
        self,
        src_lat: float,
        src_lng: float,
        dst_lat: float,
        dst_lng: float,
        city_id: str,
        src_name: str,
        dst_name: str,
        night_only: bool = False,
    ) -> list[dict]:
        bus_origin = self.nearest_bus(src_lat, src_lng, city_id, night_only=False)
        bus_dest = self.nearest_bus(dst_lat, dst_lng, city_id, night_only=night_only)
        if not bus_origin or not bus_dest:
            return []
        legs = [
            self._walk_leg(src_name, bus_origin["name"], bus_origin["distance_m"]),
            self._bus_leg(bus_origin, bus_dest),
            self._walk_leg(bus_dest["name"], dst_name, haversine_m(dst_lat, dst_lng, bus_dest["lat"], bus_dest["lng"])),
        ]
        return legs

    @staticmethod
    def is_night_safe_route(legs: list[dict], hour: int | None = None) -> bool:
        hour = hour if hour is not None else datetime.now().hour
        if not (hour >= 22 or hour < 5):
            return True
        for leg in legs:
            if leg["mode"] == "walk" and leg["distance_km"] > 0.8:
                return False
            if leg["mode"] in ("metro", "bus"):
                end = leg.get("service_end", "23:00")
                h, m = map(int, end.split(":"))
                if hour >= 22 and h < 23:
                    return False
                if leg["mode"] == "bus" and not leg.get("night_service") and hour >= 22:
                    return False
        return True

    def car_trip_co2(self, legs: list[dict]) -> float:
        total_km = sum(l["distance_km"] for l in legs)
        return round(total_km * 0.21, 2)


gtfs_service = GTFSTransitService()
