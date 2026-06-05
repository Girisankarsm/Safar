from fastapi import APIRouter
from app.services.data import repository as repo

router = APIRouter()


@router.get("")
def get_leaderboard(type: str = "individual", period: str = "weekly"):
    return {"type": type, "period": period, "entries": repo.get_leaderboard(type, period)}
