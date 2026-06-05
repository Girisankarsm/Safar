from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_database
from app.services.data import repository as repo
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    connected = init_database()
    repo.set_db_ready(connected)
    if connected:
        print("[SafarAI] Connected to Supabase PostgreSQL")
    else:
        print("[SafarAI] Running in demo mode (in-memory store)")
    yield


app = FastAPI(
    title=settings.app_name,
    description="India's AI-Powered Safe Mobility Platform API",
    version="1.0.0",
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
        "app": "SafarAI",
        "demo_mode": settings.demo_mode,
        "database": "connected" if repo.is_db_active() else "demo",
        "supabase_url": settings.supabase_url or None,
    }
