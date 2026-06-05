from fastapi import APIRouter

from app.repositories import store

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("")
def get_leaderboard(city: str = "chennai"):
    return {"entries": store.leaderboard(city), "period": "weekly"}
