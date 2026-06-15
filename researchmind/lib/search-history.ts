const STORAGE_KEY = "researchmind.searchHistory";
const MAX_ENTRIES = 100;

export type SearchHistoryEntry = {
  id: string;
  query: string;
  timestamp: string;
  resultCount?: number;
  sourcesQueried?: string[];
};

export function loadSearchHistory(): SearchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SearchHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addSearchHistoryEntry(
  query: string,
  opts?: { resultCount?: number; sourcesQueried?: string[] },
) {
  if (typeof window === "undefined") return;
  const history = loadSearchHistory();
  const existing = history.findIndex(
    (e) => e.query.toLowerCase() === query.toLowerCase(),
  );
  if (existing !== -1) history.splice(existing, 1);

  const entry: SearchHistoryEntry = {
    id: crypto.randomUUID(),
    query,
    timestamp: new Date().toISOString(),
    resultCount: opts?.resultCount,
    sourcesQueried: opts?.sourcesQueried,
  };

  const next = [entry, ...history].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort
  }
}

export function deleteSearchHistoryEntry(id: string) {
  if (typeof window === "undefined") return;
  const next = loadSearchHistory().filter((e) => e.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort
  }
}

export function clearSearchHistory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort
  }
}

export function groupEntriesByDate(entries: SearchHistoryEntry[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 6 * 86400000;
  const startOfMonth = startOfToday - 29 * 86400000;

  const groups: { label: string; entries: SearchHistoryEntry[] }[] = [
    { label: "Today", entries: [] },
    { label: "This week", entries: [] },
    { label: "This month", entries: [] },
    { label: "Older", entries: [] },
  ];

  for (const entry of entries) {
    const t = new Date(entry.timestamp).getTime();
    if (t >= startOfToday) groups[0].entries.push(entry);
    else if (t >= startOfWeek) groups[1].entries.push(entry);
    else if (t >= startOfMonth) groups[2].entries.push(entry);
    else groups[3].entries.push(entry);
  }

  return groups.filter((g) => g.entries.length > 0);
}
