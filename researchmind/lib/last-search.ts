const STORAGE_KEY = "researchmind.lastSearch";

export function persistLastSearchQuery(query: string) {
  if (typeof window === "undefined" || !query.trim()) {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, query.trim());
  } catch {
    // Best-effort session persistence.
  }
}

export function loadLastSearchQuery(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
