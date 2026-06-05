from fastapi import APIRouter

from app.repositories import store
from app.schemas.schemas import UserPreferences

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
def me():
    user = store.get_current_user()
    return {
        "user": user,
        "authenticated": not user.get("demo", False),
        "demo": user.get("demo", False),
    }


@router.post("/sync")
def sync_profile():
    """Upsert the signed-in Supabase/Google user and return profile."""
    user = store.get_current_user()
    return {"user": user, "synced": not user.get("demo", False)}


@router.patch("/me")
def update_me(body: UserPreferences):
    prefs = body.model_dump(exclude_none=True)
    return {"user": store.update_user_prefs(prefs)}
