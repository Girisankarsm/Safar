from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import init_database
from app.core.security import verify_supabase_token
from app.repositories import store


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.config import _ENV_FILE

    print(f"[SafarAI v2] Env file: {_ENV_FILE}")
    print(f"[SafarAI v2] USE_DATABASE={settings.use_database}")

    connected = init_database()
    store.set_db_ready(connected)
    if connected:
        print("[SafarAI v2] ✓ Supabase PostgreSQL connected — trips & wallet persist")
    elif settings.database_enabled:
        print("[SafarAI v2] ✗ Database configured but connection failed — using in-memory demo store")
        print("[SafarAI v2]   Check DATABASE_URL in root .env and run database/migrations on Supabase")
    else:
        print("[SafarAI v2] Demo mode — set USE_DATABASE=true in root .env for real persistence")
    yield


app = FastAPI(
    title="SafarAI API",
    description="Real-time safe urban mobility — GTFS transit, OSM CCTV, live GPS",
    version="2.0.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        store.clear_request_user()
        auth = request.headers.get("authorization")
        if auth and auth.startswith("Bearer "):
            payload = verify_supabase_token(auth.removeprefix("Bearer ").strip())
            if payload:
                user = store.upsert_user_from_auth(payload)
                store.set_request_user(user["id"])
        try:
            return await call_next(request)
        finally:
            store.clear_request_user()


app.add_middleware(AuthMiddleware)
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "database": "connected" if store.is_db_active() else "demo",
        "features": [
            "gtfs_transit_routing",
            "osm_cctv_live",
            "live_gps_safety",
            "night_shift_filter",
            "sos_twilio",
            "green_miles_wallet",
            "esg_dashboard",
        ],
    }
