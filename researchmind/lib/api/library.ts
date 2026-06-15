/**
 * Library API client — abstracts over backend (authed) vs localStorage (anon).
 *
 * When a valid Supabase session exists, all reads/writes go to the FastAPI
 * backend which stores data in Supabase.  When not authenticated, the
 * existing localStorage helpers are used as-is so the app stays fully
 * functional without an account.
 */

import { createClient } from "@/lib/supabase/client";
import type { SearchResultItem } from "@/lib/api/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

// ── Auth header helper ──────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string> | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  return { Authorization: `Bearer ${data.session.access_token}` };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  if (!headers) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...headers, ...init?.headers },
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(err.detail ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ── Saved Papers ─────────────────────────────────────────────────────────────

export async function apiSavePaper(paper: SearchResultItem): Promise<void> {
  await apiFetch("/api/papers/saved", {
    method: "POST",
    body: JSON.stringify({ paper_id: paper.paper_id, raw_json: paper }),
  });
}

export async function apiUnsavePaper(paperId: string): Promise<void> {
  await apiFetch(`/api/papers/saved/${encodeURIComponent(paperId)}`, { method: "DELETE" });
}

export async function apiListSavedPapers(): Promise<SearchResultItem[]> {
  const rows = await apiFetch<{ raw_json: SearchResultItem }[]>("/api/papers/saved");
  return rows.map((r) => r.raw_json);
}

// ── Collections ──────────────────────────────────────────────────────────────

export async function apiListCollections() {
  return apiFetch<CollectionRow[]>("/api/collections");
}

export async function apiCreateCollection(name: string, description?: string, accent?: string) {
  return apiFetch<CollectionRow>("/api/collections", {
    method: "POST",
    body: JSON.stringify({ name, description, accent: accent ?? "teal" }),
  });
}

export async function apiUpdateCollection(id: string, updates: Partial<CollectionRow>) {
  return apiFetch<CollectionRow>(`/api/collections/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function apiDeleteCollection(id: string): Promise<void> {
  await apiFetch(`/api/collections/${id}`, { method: "DELETE" });
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export async function apiListAlerts() {
  return apiFetch<AlertRow[]>("/api/alerts");
}

export async function apiCreateAlert(topic: string, sources: string[], frequency: string) {
  return apiFetch<AlertRow>("/api/alerts", {
    method: "POST",
    body: JSON.stringify({ topic, sources, frequency }),
  });
}

export async function apiUpdateAlert(id: string, updates: Partial<AlertRow>) {
  return apiFetch<AlertRow>(`/api/alerts/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function apiDeleteAlert(id: string): Promise<void> {
  await apiFetch(`/api/alerts/${id}`, { method: "DELETE" });
}

// ── Search History ────────────────────────────────────────────────────────────

export async function apiAddHistory(query: string, resultCount: number, sources: string[]) {
  return apiFetch<HistoryRow>("/api/history", {
    method: "POST",
    body: JSON.stringify({ query, result_count: resultCount, sources }),
  });
}

export async function apiListHistory() {
  return apiFetch<HistoryRow[]>("/api/history");
}

export async function apiDeleteHistoryEntry(id: string): Promise<void> {
  await apiFetch(`/api/history/${id}`, { method: "DELETE" });
}

export async function apiClearHistory(): Promise<void> {
  await apiFetch("/api/history", { method: "DELETE" });
}

// ── Paper Notes ──────────────────────────────────────────────────────────────

export async function apiGetNote(paperId: string) {
  return apiFetch<{ paper_id: string; content: string }>(`/api/notes/${encodeURIComponent(paperId)}`);
}

export async function apiUpsertNote(paperId: string, content: string) {
  return apiFetch(`/api/notes/${encodeURIComponent(paperId)}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type CollectionRow = {
  id: string;
  name: string;
  description?: string | null;
  accent: string;
  paper_ids: string[];
  created_at: string;
  updated_at: string;
};

export type AlertRow = {
  id: string;
  topic: string;
  sources: string[];
  frequency: string;
  status: "active" | "paused";
  new_count: number;
  last_run_at?: string | null;
  created_at: string;
};

export type HistoryRow = {
  id: string;
  query: string;
  result_count: number;
  sources: string[];
  searched_at: string;
};
