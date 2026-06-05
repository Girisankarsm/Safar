from fastapi import APIRouter, HTTPException
from app.schemas.schemas import RedeemRequest
from app.services.data import repository as repo

router = APIRouter()

REWARDS = {
    "auto_discount": {"tokens": 250, "label": "₹30 off auto ride"},
    "metro_bonus": {"tokens": 150, "label": "Metro top-up bonus"},
    "safety_priority": {"tokens": 150, "label": "Priority night-safe routing (7 days)"},
}


@router.get("")
def get_wallet():
    return repo.get_wallet()


@router.get("/transactions")
def get_transactions():
    return {"transactions": repo.get_transactions()}


@router.post("/redeem")
def redeem(req: RedeemRequest):
    reward = REWARDS.get(req.reward_type)
    if not reward:
        raise HTTPException(400, "Invalid reward type")

    cost = req.tokens if req.tokens else reward["tokens"]
    try:
        result = repo.redeem_wallet(cost, f"Redeemed: {reward['label']}")
    except ValueError as e:
        raise HTTPException(400, str(e))

    return {
        "success": True,
        "tokens_spent": cost,
        "reward": reward["label"],
        "balance": result["balance"],
    }
