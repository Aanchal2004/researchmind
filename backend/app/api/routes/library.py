from __future__ import annotations

"""Library CRUD routes — saved papers, collections, notes, alerts, search history.

All routes require a valid Supabase JWT. Data is stored in Supabase with RLS
ensuring users only see their own rows.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.config import Settings, get_settings
from app.core.supabase import current_user_id, get_supabase_admin

router = APIRouter(tags=["library"])


def _db(settings: Settings) -> Any:
    return get_supabase_admin(settings)


# ── Saved Papers ────────────────────────────────────────────────────────────

class SavePaperRequest(BaseModel):
    paper_id: str
    raw_json: dict


@router.get("/papers/saved")
def list_saved_papers(
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    res = (
        _db(settings)
        .table("saved_papers")
        .select("*")
        .eq("user_id", user_id)
        .order("saved_at", desc=True)
        .execute()
    )
    return res.data


@router.post("/papers/saved", status_code=status.HTTP_201_CREATED)
def save_paper(
    body: SavePaperRequest,
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    res = (
        _db(settings)
        .table("saved_papers")
        .upsert({"user_id": user_id, "paper_id": body.paper_id, "raw_json": body.raw_json})
        .execute()
    )
    return res.data[0] if res.data else {}


@router.delete("/papers/saved/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_paper(
    paper_id: str,
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    _db(settings).table("saved_papers").delete().eq("user_id", user_id).eq("paper_id", paper_id).execute()


# ── Collections ─────────────────────────────────────────────────────────────

class CreateCollectionRequest(BaseModel):
    name: str
    description: str | None = None
    accent: str = "teal"


class UpdateCollectionRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    accent: str | None = None
    paper_ids: list[str] | None = None


@router.get("/collections")
def list_collections(
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    res = (
        _db(settings)
        .table("collections")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


@router.post("/collections", status_code=status.HTTP_201_CREATED)
def create_collection(
    body: CreateCollectionRequest,
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    res = (
        _db(settings)
        .table("collections")
        .insert({"user_id": user_id, "name": body.name, "description": body.description, "accent": body.accent})
        .execute()
    )
    return res.data[0] if res.data else {}


@router.put("/collections/{collection_id}")
def update_collection(
    collection_id: str,
    body: UpdateCollectionRequest,
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    res = (
        _db(settings)
        .table("collections")
        .update(updates)
        .eq("id", collection_id)
        .eq("user_id", user_id)
        .execute()
    )
    return res.data[0] if res.data else {}


@router.delete("/collections/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
    collection_id: str,
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    _db(settings).table("collections").delete().eq("id", collection_id).eq("user_id", user_id).execute()


# ── Alerts ───────────────────────────────────────────────────────────────────

class CreateAlertRequest(BaseModel):
    topic: str
    sources: list[str] = []
    frequency: str = "weekly"


class UpdateAlertRequest(BaseModel):
    status: str | None = None   # 'active' | 'paused'
    frequency: str | None = None
    sources: list[str] | None = None


@router.get("/alerts")
def list_alerts(
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    res = (
        _db(settings)
        .table("alerts")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


@router.post("/alerts", status_code=status.HTTP_201_CREATED)
def create_alert(
    body: CreateAlertRequest,
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    res = (
        _db(settings)
        .table("alerts")
        .insert({"user_id": user_id, "topic": body.topic, "sources": body.sources, "frequency": body.frequency})
        .execute()
    )
    return res.data[0] if res.data else {}


@router.put("/alerts/{alert_id}")
def update_alert(
    alert_id: str,
    body: UpdateAlertRequest,
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    res = (
        _db(settings)
        .table("alerts")
        .update(updates)
        .eq("id", alert_id)
        .eq("user_id", user_id)
        .execute()
    )
    return res.data[0] if res.data else {}


@router.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: str,
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    _db(settings).table("alerts").delete().eq("id", alert_id).eq("user_id", user_id).execute()


# ── Search History ────────────────────────────────────────────────────────────

class AddHistoryRequest(BaseModel):
    query: str
    result_count: int = 0
    sources: list[str] = []


@router.get("/history")
def list_history(
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    res = (
        _db(settings)
        .table("search_history")
        .select("*")
        .eq("user_id", user_id)
        .order("searched_at", desc=True)
        .limit(200)
        .execute()
    )
    return res.data


@router.post("/history", status_code=status.HTTP_201_CREATED)
def add_history(
    body: AddHistoryRequest,
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    res = (
        _db(settings)
        .table("search_history")
        .insert({"user_id": user_id, "query": body.query, "result_count": body.result_count, "sources": body.sources})
        .execute()
    )
    return res.data[0] if res.data else {}


@router.delete("/history/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history_entry(
    entry_id: str,
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    _db(settings).table("search_history").delete().eq("id", entry_id).eq("user_id", user_id).execute()


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
def clear_history(
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    _db(settings).table("search_history").delete().eq("user_id", user_id).execute()


# ── Paper Notes ──────────────────────────────────────────────────────────────

class UpsertNoteRequest(BaseModel):
    content: str


@router.get("/notes/{paper_id}")
def get_note(
    paper_id: str,
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    res = (
        _db(settings)
        .table("paper_notes")
        .select("*")
        .eq("user_id", user_id)
        .eq("paper_id", paper_id)
        .maybe_single()
        .execute()
    )
    return res.data or {"paper_id": paper_id, "content": ""}


@router.put("/notes/{paper_id}", status_code=status.HTTP_200_OK)
def upsert_note(
    paper_id: str,
    body: UpsertNoteRequest,
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    res = (
        _db(settings)
        .table("paper_notes")
        .upsert({"user_id": user_id, "paper_id": paper_id, "content": body.content})
        .execute()
    )
    return res.data[0] if res.data else {}


@router.delete("/notes/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    paper_id: str,
    user_id: str = Depends(current_user_id),
    settings: Settings = Depends(get_settings),
):
    _db(settings).table("paper_notes").delete().eq("user_id", user_id).eq("paper_id", paper_id).execute()
