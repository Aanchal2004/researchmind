import type { SearchMeta } from "@/lib/api/types";

const STORAGE_KEY = "researchmind.lastSearchMeta";

export function persistLastSearchMeta(meta: SearchMeta) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Best-effort session persistence.
  }
}

export function loadLastSearchMeta(): SearchMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SearchMeta;
  } catch {
    return null;
  }
}
