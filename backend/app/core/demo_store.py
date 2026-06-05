"""In-memory store for hackathon demo mode (no PostgreSQL required)."""

import secrets
import uuid
from copy import deepcopy
from datetime import datetime, timezone

DEMO_USER_ID = "a0000000-0000-0000-0000-000000000001"

DEMO_USER = {
    "id": DEMO_USER_ID,
    "clerk_id": "demo_user_priya",
    "email": "priya@cbit.ac.in",
    "name": "Priya Sharma",
    "college": "CBIT Hyderabad",
    "company": None,
    "women_safety_mode": True,
    "night_safe_preference": True,
    "trust_score": 85,
    "city": "hyderabad",
}

DEMO_WALLET = {
    "balance": 340,
    "lifetime_tokens": 520,
    "lifetime_co2_kg": 12.4,
    "green_trips_count": 28,
}

DEMO_REPORTS = [
    {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "report_type": "broken_light",
        "description": "Street light not working near bus stop",
        "latitude": 17.4434,
        "longitude": 78.3772,
        "upvotes": 12,
        "verifications": 3,
        "is_verified": True,
        "city": "hyderabad",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "report_type": "harassment",
        "description": "Harassment hotspot near interchange",
        "latitude": 17.4350,
        "longitude": 78.3910,
        "upvotes": 28,
        "verifications": 5,
        "is_verified": True,
        "city": "hyderabad",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "report_type": "pothole",
        "description": "Large pothole on service road",
        "latitude": 17.4480,
        "longitude": 78.3650,
        "upvotes": 8,
        "verifications": 2,
        "is_verified": False,
        "city": "hyderabad",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "report_type": "unsafe_area",
        "description": "Poorly lit alley near metro exit",
        "latitude": 17.4200,
        "longitude": 78.3400,
        "upvotes": 15,
        "verifications": 4,
        "is_verified": True,
        "city": "hyderabad",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "report_type": "dangerous_crossing",
        "description": "No zebra crossing, fast traffic",
        "latitude": 17.4600,
        "longitude": 78.3800,
        "upvotes": 6,
        "verifications": 1,
        "is_verified": False,
        "city": "hyderabad",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
]

DEMO_ROAD_RATINGS = [
    {"id": "seg_1", "segment_id": "hitec_main", "latitude": 17.4434, "longitude": 78.3772, "rating": 88, "condition": "good", "color": "green"},
    {"id": "seg_2", "segment_id": "necklace", "latitude": 17.4200, "longitude": 78.4600, "rating": 72, "condition": "moderate", "color": "yellow"},
    {"id": "seg_3", "segment_id": "secunderabad", "latitude": 17.4340, "longitude": 78.5010, "rating": 85, "condition": "good", "color": "green"},
    {"id": "seg_4", "segment_id": "old_city", "latitude": 17.3700, "longitude": 78.4800, "rating": 45, "condition": "poor", "color": "red"},
]

DEMO_LEADERBOARD = {
    "individual": [
        {"rank": 1, "entity_name": "Priya Sharma", "tokens_earned": 340, "carbon_saved_kg": 12.4, "green_trips": 28},
        {"rank": 2, "entity_name": "Rahul Kumar", "tokens_earned": 298, "carbon_saved_kg": 10.1, "green_trips": 24},
        {"rank": 3, "entity_name": "Anitha Menon", "tokens_earned": 276, "carbon_saved_kg": 9.8, "green_trips": 22},
        {"rank": 4, "entity_name": "Dev Team Alpha", "tokens_earned": 245, "carbon_saved_kg": 8.2, "green_trips": 19},
    ],
    "college": [
        {"rank": 1, "entity_name": "CBIT Hyderabad", "tokens_earned": 1240, "carbon_saved_kg": 45.2, "green_trips": 98},
        {"rank": 2, "entity_name": "IIIT Hyderabad", "tokens_earned": 1080, "carbon_saved_kg": 38.5, "green_trips": 85},
        {"rank": 3, "entity_name": "JNTU Hyderabad", "tokens_earned": 920, "carbon_saved_kg": 32.1, "green_trips": 72},
    ],
    "company": [
        {"rank": 1, "entity_name": "TechMahindra HYD", "tokens_earned": 3400, "carbon_saved_kg": 120.5, "green_trips": 280},
        {"rank": 2, "entity_name": "Microsoft IDC", "tokens_earned": 2890, "carbon_saved_kg": 98.3, "green_trips": 245},
    ],
}

DEMO_CONTACTS = [
    {"id": str(uuid.uuid4()), "name": "Mom", "phone": "+919876543210", "relationship": "Mother"},
    {"id": str(uuid.uuid4()), "name": "Sneha", "phone": "+919876543211", "relationship": "Friend"},
]


class DemoStore:
    def __init__(self) -> None:
        self.user = deepcopy(DEMO_USER)
        self.wallet = deepcopy(DEMO_WALLET)
        self.reports = deepcopy(DEMO_REPORTS)
        self.routes: dict[str, dict] = {}
        self.trips: dict[str, dict] = {}
        self.transactions: list[dict] = []
        self.contacts = deepcopy(DEMO_CONTACTS)
        self.votes: set[tuple[str, str, str]] = set()

    def cache_routes(self, routes: list[dict]) -> None:
        for r in routes:
            self.routes[r["id"]] = r

    def get_route(self, route_id: str) -> dict | None:
        return self.routes.get(route_id)


store = DemoStore()
