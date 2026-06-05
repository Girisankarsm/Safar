"""In-memory store for hackathon demo mode (no PostgreSQL required)."""

import secrets
import uuid
from copy import deepcopy
from datetime import datetime, timezone

DEMO_USER_ID = "a0000000-0000-0000-0000-000000000001"

DEMO_USER = {
    "id": DEMO_USER_ID,
    "clerk_id": "demo_user_ananya",
    "email": "ananya@annauniv.edu",
    "name": "Ananya Krishnan",
    "college": "Anna University Chennai",
    "company": None,
    "women_safety_mode": True,
    "night_safe_preference": True,
    "trust_score": 88,
    "city": "chennai",
}

DEMO_WALLET = {
    "balance": 340,
    "lifetime_tokens": 520,
    "lifetime_co2_kg": 12.4,
    "green_trips_count": 28,
}

CHENNAI_REPORTS = [
    {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "report_type": "broken_light",
        "description": "Dim street lighting near T Nagar bus terminus",
        "latitude": 13.0418,
        "longitude": 80.2341,
        "upvotes": 18,
        "verifications": 4,
        "is_verified": True,
        "city": "chennai",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "report_type": "harassment",
        "description": "Harassment reported near Guindy evening hours",
        "latitude": 13.0067,
        "longitude": 80.2206,
        "upvotes": 32,
        "verifications": 6,
        "is_verified": True,
        "city": "chennai",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "report_type": "unsafe_area",
        "description": "Poorly lit lane behind Egmore station",
        "latitude": 13.0732,
        "longitude": 80.2609,
        "upvotes": 21,
        "verifications": 5,
        "is_verified": True,
        "city": "chennai",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "report_type": "pothole",
        "description": "Large pothole on Anna Salai service road",
        "latitude": 13.0604,
        "longitude": 80.2426,
        "upvotes": 11,
        "verifications": 2,
        "is_verified": False,
        "city": "chennai",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "report_type": "dangerous_crossing",
        "description": "No pedestrian signal at OMR junction",
        "latitude": 12.9010,
        "longitude": 80.2279,
        "upvotes": 9,
        "verifications": 3,
        "is_verified": True,
        "city": "chennai",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "user_id": DEMO_USER_ID,
        "report_type": "flooded_road",
        "description": "Water logging near Marina loop road after rains",
        "latitude": 13.0500,
        "longitude": 80.2824,
        "upvotes": 7,
        "verifications": 2,
        "is_verified": False,
        "city": "chennai",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
]

HYDERABAD_REPORTS = [
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

DEMO_REPORTS = CHENNAI_REPORTS + HYDERABAD_REPORTS

CHENNAI_ROAD_RATINGS = [
    {"id": "chn_1", "segment_id": "t_nagar", "latitude": 13.0418, "longitude": 80.2341, "rating": 82, "condition": "good", "color": "green", "city": "chennai"},
    {"id": "chn_2", "segment_id": "anna_salai", "latitude": 13.0604, "longitude": 80.2426, "rating": 78, "condition": "moderate", "color": "yellow", "city": "chennai"},
    {"id": "chn_3", "segment_id": "central", "latitude": 13.0827, "longitude": 80.2750, "rating": 90, "condition": "good", "color": "green", "city": "chennai"},
    {"id": "chn_4", "segment_id": "marina", "latitude": 13.0500, "longitude": 80.2824, "rating": 86, "condition": "good", "color": "green", "city": "chennai"},
    {"id": "chn_5", "segment_id": "guindy", "latitude": 13.0067, "longitude": 80.2206, "rating": 58, "condition": "moderate", "color": "yellow", "city": "chennai"},
]

HYDERABAD_ROAD_RATINGS = [
    {"id": "seg_1", "segment_id": "hitec_main", "latitude": 17.4434, "longitude": 78.3772, "rating": 88, "condition": "good", "color": "green", "city": "hyderabad"},
    {"id": "seg_2", "segment_id": "necklace", "latitude": 17.4200, "longitude": 78.4600, "rating": 72, "condition": "moderate", "color": "yellow", "city": "hyderabad"},
    {"id": "seg_3", "segment_id": "secunderabad", "latitude": 17.4340, "longitude": 78.5010, "rating": 85, "condition": "good", "color": "green", "city": "hyderabad"},
    {"id": "seg_4", "segment_id": "old_city", "latitude": 17.3700, "longitude": 78.4800, "rating": 45, "condition": "poor", "color": "red", "city": "hyderabad"},
]

DEMO_ROAD_RATINGS = CHENNAI_ROAD_RATINGS + HYDERABAD_ROAD_RATINGS

DEMO_LEADERBOARD = {
    "individual": [
        {"rank": 1, "entity_name": "Ananya Krishnan", "tokens_earned": 340, "carbon_saved_kg": 12.4, "green_trips": 28},
        {"rank": 2, "entity_name": "Rahul Kumar", "tokens_earned": 298, "carbon_saved_kg": 10.1, "green_trips": 24},
        {"rank": 3, "entity_name": "Anitha Menon", "tokens_earned": 276, "carbon_saved_kg": 9.8, "green_trips": 22},
        {"rank": 4, "entity_name": "Dev Team Alpha", "tokens_earned": 245, "carbon_saved_kg": 8.2, "green_trips": 19},
    ],
    "college": [
        {"rank": 1, "entity_name": "Anna University Chennai", "tokens_earned": 1240, "carbon_saved_kg": 45.2, "green_trips": 98},
        {"rank": 2, "entity_name": "CBIT Hyderabad", "tokens_earned": 1080, "carbon_saved_kg": 38.5, "green_trips": 85},
        {"rank": 3, "entity_name": "IIIT Hyderabad", "tokens_earned": 920, "carbon_saved_kg": 32.1, "green_trips": 72},
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
