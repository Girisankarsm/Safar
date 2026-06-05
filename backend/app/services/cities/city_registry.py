from dataclasses import dataclass
from pathlib import Path

DATA_ROOT = Path(__file__).resolve().parent.parent.parent / "data"


@dataclass(frozen=True)
class CityConfig:
    id: str
    name: str
    display_name: str
    bbox: tuple[float, float, float, float]  # south, west, north, east
    default_center: tuple[float, float]
    default_source: str
    default_destination: str
    demo_corridor: str

    @property
    def data_dir(self) -> Path:
        return DATA_ROOT / self.id

    @property
    def landmarks_path(self) -> Path:
        return self.data_dir / "landmarks.json"

    @property
    def cctv_cache_path(self) -> Path:
        return self.data_dir / "osm_cctv_cache.json"


CITIES: dict[str, CityConfig] = {
    "chennai": CityConfig(
        id="chennai",
        name="Chennai",
        display_name="Chennai",
        bbox=(12.95, 80.10, 13.20, 80.32),
        default_center=(13.0827, 80.2707),
        default_source="T Nagar",
        default_destination="Chennai Central",
        demo_corridor="T Nagar → Chennai Central",
    ),
    "hyderabad": CityConfig(
        id="hyderabad",
        name="Hyderabad",
        display_name="Hyderabad",
        bbox=(17.35, 78.35, 17.55, 78.55),
        default_center=(17.44, 78.45),
        default_source="HITEC City",
        default_destination="Secunderabad Station",
        demo_corridor="HITEC City → Secunderabad",
    ),
}

DEFAULT_CITY = "chennai"


def get_city(city_id: str) -> CityConfig:
    key = city_id.strip().lower()
    if key not in CITIES:
        return CITIES[DEFAULT_CITY]
    return CITIES[key]


def list_cities() -> list[dict]:
    return [
        {
            "id": c.id,
            "name": c.name,
            "display_name": c.display_name,
            "default_source": c.default_source,
            "default_destination": c.default_destination,
            "demo_corridor": c.demo_corridor,
            "center": {"lat": c.default_center[0], "lng": c.default_center[1]},
        }
        for c in CITIES.values()
    ]
