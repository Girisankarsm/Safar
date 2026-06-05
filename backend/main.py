from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import init_database
from app.repositories import store


@asynccontextmanager
async def lifespan(app: FastAPI):
    connected = init_database()
    store.set_db_ready(connected)
    if connected:
        print("[SafarAI v2] Supabase PostgreSQL connected")
    else:
        print("[SafarAI v2] Demo mode — in-memory store")
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
