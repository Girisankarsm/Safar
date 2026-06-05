from fastapi import APIRouter

from app.repositories import store

router = APIRouter(prefix="/esg", tags=["esg"])


@router.get("/dashboard")
def esg_dashboard():
    return store.esg_summary()
