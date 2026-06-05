from fastapi import APIRouter

from app.repositories import store

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("")
def get_wallet():
    return store.get_wallet()
