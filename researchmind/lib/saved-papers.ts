import type { SearchResultItem } from "@/lib/api/types";

const STORAGE_KEY = "researchmind.savedPapers";

export const SAVED_PAPERS_CHANGED_EVENT = "researchmind:saved-papers-changed";

export function loadSavedPapers(): SearchResultItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as SearchResultItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function persistSavedPapers(papers: SearchResultItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(papers));
    window.dispatchEvent(new CustomEvent(SAVED_PAPERS_CHANGED_EVENT));
  } catch {
    // Ignore storage failures; local persistence is best-effort.
  }
}

export function subscribeSavedPapers(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener(SAVED_PAPERS_CHANGED_EVENT, listener);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(SAVED_PAPERS_CHANGED_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function isPaperSaved(paperId: string, savedPapers: SearchResultItem[]) {
  return savedPapers.some((paper) => paper.paper_id === paperId);
}
