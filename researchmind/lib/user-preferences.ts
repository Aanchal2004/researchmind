const STORAGE_KEY = "researchmind.preferences";

export type UserPreferences = {
  openAccessOnly: boolean;
  emailAlerts: boolean;
  autoSave: boolean;
  aiSummaryByDefault: boolean;
  semanticScholarApiKey: string;
  defaultSources: string[];
  defaultLimit: number;
};

const DEFAULTS: UserPreferences = {
  openAccessOnly: true,
  emailAlerts: true,
  autoSave: false,
  aiSummaryByDefault: true,
  semanticScholarApiKey: "",
  defaultSources: ["arxiv", "semantic_scholar"],
  defaultLimit: 8,
};

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<UserPreferences>) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function persistPreferences(prefs: UserPreferences) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Best-effort
  }
}

export function clearAllLocalData() {
  if (typeof window === "undefined") return;
  const keys = [
    "researchmind.savedPapers",
    "researchmind.collections",
    "researchmind.searchHistory",
    "researchmind.alerts",
    "researchmind.preferences",
    "researchmind.lastSearch",
  ];
  for (const key of keys) {
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
  }
}
