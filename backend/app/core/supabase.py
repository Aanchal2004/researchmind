from __future__ import annotations

"""Supabase client factory and JWT auth helpers.

Two clients are created:
- ``anon_client``  — uses the anon key (same permissions as a logged-out browser)
- ``admin_client`` — uses the service_role key (bypasses RLS; server-side only)

JWT verification is done locally using the project JWT secret so we avoid an
extra network round-trip on every authenticated request.
"""

import logging
from functools import lru_cache

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from supabase import Client, create_client

from app.core.config import Settings, get_settings

logger = logging.getLogger("researchmind.core.supabase")

_bearer = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def get_supabase_admin(settings: Settings | None = None) -> Client:
    """Service-role client — server-side only, never sent to the browser."""
    s = settings or get_settings()
    if not s.supabase_url or not s.supabase_service_role_key:
        raise RuntimeError("Supabase service_role key not configured")
    return create_client(s.supabase_url, s.supabase_service_role_key)


@lru_cache(maxsize=1)
def get_supabase_anon(settings: Settings | None = None) -> Client:
    """Anon client — used for public/unauthenticated operations."""
    s = settings or get_settings()
    if not s.supabase_url or not s.supabase_anon_key:
        raise RuntimeError("Supabase anon key not configured")
    return create_client(s.supabase_url, s.supabase_anon_key)


def _verify_jwt(token: str, secret: str) -> dict:
    """Decode and verify a Supabase JWT. Raises HTTPException on failure."""
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


# ── FastAPI dependencies ────────────────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> dict:
    """Require a valid Supabase JWT. Returns the decoded payload (includes `sub` = user_id)."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _verify_jwt(credentials.credentials, settings.supabase_jwt_secret)


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> dict | None:
    """Return decoded JWT payload if a valid token is present, else None."""
    if credentials is None:
        return None
    try:
        return _verify_jwt(credentials.credentials, settings.supabase_jwt_secret)
    except HTTPException:
        return None


def current_user_id(user: dict = Depends(get_current_user)) -> str:
    """Shortcut dep — returns the `sub` claim (Supabase user UUID)."""
    uid = user.get("sub")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing user ID in token")
    return uid
