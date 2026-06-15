import type { SearchResultItem } from "@/lib/api/types";

export type Collection = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  paperIds: string[];
  accent: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "researchmind.collections";
const CHANGED_EVENT = "researchmind:collections-changed";

const ACCENT_PALETTE = [
  "from-sky-400 to-cyan-300",
  "from-emerald-400 to-lime-300",
  "from-violet-400 to-fuchsia-300",
  "from-amber-400 to-orange-300",
  "from-rose-400 to-pink-300",
  "from-indigo-400 to-blue-300",
  "from-teal-400 to-green-300",
  "from-orange-400 to-red-300",
];

export function loadCollections(): Collection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultCollections();
    const parsed = JSON.parse(raw) as Collection[];
    return Array.isArray(parsed) ? parsed : getDefaultCollections();
  } catch {
    return getDefaultCollections();
  }
}

export function persistCollections(collections: Collection[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
    window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
  } catch {
    // Best-effort
  }
}

export function subscribeCollections(listener: () => void) {
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

export function createCollection(name: string, description = ""): Collection {
  const collections = loadCollections();
  const usedAccents = new Set(collections.map((c) => c.accent));
  const accent =
    ACCENT_PALETTE.find((a) => !usedAccents.has(a)) ?? ACCENT_PALETTE[collections.length % ACCENT_PALETTE.length];

  const newCollection: Collection = {
    id: crypto.randomUUID(),
    name,
    description,
    tags: [],
    paperIds: [],
    accent,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  persistCollections([...collections, newCollection]);
  return newCollection;
}

export function updateCollection(id: string, patch: Partial<Omit<Collection, "id" | "createdAt">>) {
  const collections = loadCollections();
  const next = collections.map((c) =>
    c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
  );
  persistCollections(next);
}

export function deleteCollection(id: string) {
  persistCollections(loadCollections().filter((c) => c.id !== id));
}

export function addPaperToCollection(collectionId: string, paperId: string) {
  const collections = loadCollections();
  const next = collections.map((c) => {
    if (c.id !== collectionId) return c;
    if (c.paperIds.includes(paperId)) return c;
    return { ...c, paperIds: [...c.paperIds, paperId], updatedAt: new Date().toISOString() };
  });
  persistCollections(next);
}

export function removePaperFromCollection(collectionId: string, paperId: string) {
  const collections = loadCollections();
  const next = collections.map((c) =>
    c.id === collectionId
      ? { ...c, paperIds: c.paperIds.filter((id) => id !== paperId), updatedAt: new Date().toISOString() }
      : c,
  );
  persistCollections(next);
}

export function getCollectionPapers(collection: Collection, savedPapers: SearchResultItem[]): SearchResultItem[] {
  const savedMap = new Map(savedPapers.map((p) => [p.paper_id, p]));
  return collection.paperIds.map((id) => savedMap.get(id)).filter((p): p is SearchResultItem => p !== undefined);
}

function getDefaultCollections(): Collection[] {
  return [
    {
      id: "default-diffusion",
      name: "Diffusion Models",
      description: "Training, scaling, and evaluation of diffusion-based generative models.",
      tags: ["diffusion-models", "generative-ai"],
      paperIds: [],
      accent: "from-sky-400 to-cyan-300",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: "default-protein",
      name: "Protein Folding",
      description: "AlphaFold, RoseTTAFold, ESMFold, and structure prediction.",
      tags: ["protein-folding", "biology"],
      paperIds: [],
      accent: "from-emerald-400 to-lime-300",
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "default-llm",
      name: "LLM Alignment",
      description: "RLHF, DPO, constitutional AI, and preference learning.",
      tags: ["llm", "alignment"],
      paperIds: [],
      accent: "from-violet-400 to-fuchsia-300",
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ];
}
