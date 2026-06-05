from fastapi import APIRouter
from app.core.demo_store import DEMO_LEADERBOARD

router = APIRouter()


@router.get("")
def get_leaderboard(type: str = "individual", period: str = "weekly"):
    entries = DEMO_LEADERBOARD.get(type, DEMO_LEADERBOARD["individual"])
    return {"type": type, "period": period, "entries": entries}
