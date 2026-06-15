from __future__ import annotations

"""Auth routes — thin proxy to Supabase Auth.

Supabase handles password hashing, token issuance, and refresh.
We expose these as `/api/auth/*` so the frontend only talks to our backend.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.core.config import Settings, get_settings
from app.core.supabase import get_current_user, get_supabase_anon

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthCredentials(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(body: AuthCredentials, settings: Settings = Depends(get_settings)):
    client = get_supabase_anon(settings)
    try:
        res = client.auth.sign_up({"email": body.email, "password": body.password})
        if res.session is None:
            # Email confirmation required
            return TokenResponse(
                access_token="",
                refresh_token="",
                user={"email": body.email, "confirmation_required": True},
            )
        return TokenResponse(
            access_token=res.session.access_token,
            refresh_token=res.session.refresh_token,
            user=res.user.model_dump() if hasattr(res.user, "model_dump") else {},
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/login", response_model=TokenResponse)
def login(body: AuthCredentials, settings: Settings = Depends(get_settings)):
    client = get_supabase_anon(settings)
    try:
        res = client.auth.sign_in_with_password({"email": body.email, "password": body.password})
        return TokenResponse(
            access_token=res.session.access_token,
            refresh_token=res.session.refresh_token,
            user=res.user.model_dump() if hasattr(res.user, "model_dump") else {},
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password") from exc


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, settings: Settings = Depends(get_settings)):
    client = get_supabase_anon(settings)
    try:
        res = client.auth.refresh_session(body.refresh_token)
        return TokenResponse(
            access_token=res.session.access_token,
            refresh_token=res.session.refresh_token,
            user=res.user.model_dump() if hasattr(res.user, "model_dump") else {},
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not refresh token") from exc


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(user: dict = Depends(get_current_user), settings: Settings = Depends(get_settings)):
    # Supabase handles token invalidation; we just confirm the request.
    return None


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return {"user_id": user.get("sub"), "email": user.get("email"), "role": user.get("role")}
