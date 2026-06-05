"""Verify Supabase access tokens (Google OAuth via Supabase Auth)."""

from __future__ import annotations

import jwt
from jwt import PyJWTError

from app.core.config import settings

ALGORITHM = "HS256"


def verify_supabase_token(token: str) -> dict | None:
    secret = settings.supabase_jwt_secret
    if not secret or not token:
        return None
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=[ALGORITHM],
            audience="authenticated",
        )
        if not payload.get("sub"):
            return None
        return payload
    except PyJWTError:
        return None
