import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.schemas.schemas import RedeemRequest
from app.core.demo_store import store

router = APIRouter()

REWARDS = {
    "auto_discount": {"tokens": 250, "label": "₹30 off auto ride"},
    "metro_bonus": {"tokens": 150, "label": "Metro top-up bonus"},
    "safety_priority": {"tokens": 150, "label": "Priority night-safe routing (7 days)"},
}


@router.get("")
def get_wallet():
    return {**store.wallet, "user_id": store.user["id"]}


@router.get("/transactions")
def get_transactions():
    return {"transactions": store.transactions}


@router.post("/redeem")
def redeem(req: RedeemRequest):
    reward = REWARDS.get(req.reward_type)
    if not reward:
        raise HTTPException(400, "Invalid reward type")

    cost = req.tokens if req.tokens else reward["tokens"]
    if store.wallet["balance"] < cost:
        raise HTTPException(400, "Insufficient tokens")

    store.wallet["balance"] -= cost
    store.transactions.insert(0, {
        "id": str(uuid.uuid4()),
        "type": "redeem",
        "amount": -cost,
        "description": f"Redeemed: {reward['label']}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "success": True,
        "tokens_spent": cost,
        "reward": reward["label"],
        "balance": store.wallet["balance"],
    }
