const STORAGE_KEY = "researchmind.alerts";
const CHANGED_EVENT = "researchmind:alerts-changed";

export type AlertFrequency = "Daily digest" | "Weekly digest";
export type AlertStatus = "active" | "paused";

export type ResearchAlert = {
  id: string;
  topic: string;
  description: string;
  tags: string[];
  frequency: AlertFrequency;
  sources: string[];
  status: AlertStatus;
  createdAt: string;
  lastChecked?: string;
  newCount: number;
};

export function loadAlerts(): ResearchAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultAlerts();
    const parsed = JSON.parse(raw) as ResearchAlert[];
    return Array.isArray(parsed) ? parsed : getDefaultAlerts();
  } catch {
    return getDefaultAlerts();
  }
}

export function persistAlerts(alerts: ResearchAlert[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
  } catch {
    // Best-effort
  }
}

export function subscribeAlerts(listener: () => void) {
  window.addEventListener(CHANGED_EVENT, listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGED_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function createAlert(
  topic: string,
  opts?: { description?: string; frequency?: AlertFrequency; sources?: string[] },
): ResearchAlert {
  const alert: ResearchAlert = {
    id: crypto.randomUUID(),
    topic,
    description: opts?.description ?? "",
    tags: [],
    frequency: opts?.frequency ?? "Daily digest",
    sources: opts?.sources ?? ["arxiv", "semantic_scholar"],
    status: "active",
    createdAt: new Date().toISOString(),
    newCount: 0,
  };
  persistAlerts([alert, ...loadAlerts()]);
  return alert;
}

export function updateAlert(id: string, patch: Partial<Omit<ResearchAlert, "id" | "createdAt">>) {
  persistAlerts(loadAlerts().map((a) => (a.id === id ? { ...a, ...patch } : a)));
}

export function deleteAlert(id: string) {
  persistAlerts(loadAlerts().filter((a) => a.id !== id));
}

export function toggleAlertStatus(id: string) {
  persistAlerts(
    loadAlerts().map((a) =>
      a.id === id ? { ...a, status: a.status === "active" ? "paused" : "active" } : a,
    ),
  );
}

function getDefaultAlerts(): ResearchAlert[] {
  return [
    {
      id: "default-diffusion",
      topic: "Diffusion Models",
      description: "New papers on training, scaling, and evaluation.",
      tags: ["diffusion-models", "generative-ai", "sampling"],
      frequency: "Daily digest",
      sources: ["arxiv", "semantic_scholar"],
      status: "active",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      newCount: 3,
    },
    {
      id: "default-protein",
      topic: "Protein Structure Prediction",
      description: "AlphaFold, RoseTTAFold, ESMFold, and more.",
      tags: ["protein-folding", "biology"],
      frequency: "Daily digest",
      sources: ["arxiv", "semantic_scholar"],
      status: "active",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      newCount: 1,
    },
    {
      id: "default-llm",
      topic: "LLM Reasoning & Agents",
      description: "Reasoning, tool use, planning, and agent frameworks.",
      tags: ["llm", "agents"],
      frequency: "Weekly digest",
      sources: ["arxiv"],
      status: "paused",
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      newCount: 0,
    },
  ];
}
