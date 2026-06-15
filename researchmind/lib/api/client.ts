import type { SearchRequest, SearchResponse, SearchResultItem, SearchSynthesis } from "@/lib/api/types";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    DEFAULT_API_BASE_URL
  );
}

export async function searchPapers(
  payload: SearchRequest,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let message = "Search request failed.";
    try {
      const errorPayload = (await response.json()) as { detail?: string };
      if (typeof errorPayload.detail === "string") {
        message = errorPayload.detail;
      }
    } catch {
      message = `Search request failed with status ${response.status}.`;
    }
    throw new Error(message);
  }

  return (await response.json()) as SearchResponse;
}

export interface PaperChatRequest {
  question: string;
  paper_title: string;
  paper_abstract?: string | null;
  paper_authors?: string[];
  paper_year?: number | null;
}

export async function paperChat(
  payload: PaperChatRequest,
  signal?: AbortSignal,
): Promise<{ answer: string; model: string }> {
  const response = await fetch(`${getApiBaseUrl()}/api/paper-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let message = `Chat request failed (${response.status}).`;
    try {
      const err = (await response.json()) as { detail?: string };
      if (typeof err.detail === "string") message = err.detail;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await response.json()) as { answer: string; model: string };
}

/**
 * Poll for async synthesis. Returns null while still pending (HTTP 202),
 * returns the synthesis object when complete/failed.
 */
export async function fetchSynthesis(
  queryId: string,
  signal?: AbortSignal,
): Promise<SearchSynthesis | null> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/synthesis/${encodeURIComponent(queryId)}`,
    { signal },
  );

  if (response.status === 202) return null; // still pending
  if (!response.ok) return null;            // expired / unknown
  return (await response.json()) as SearchSynthesis;
}

export async function fetchPaper(
  paperId: string,
  signal?: AbortSignal,
): Promise<SearchResultItem> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/paper/${encodeURIComponent(paperId)}`,
    { signal },
  );

  if (!response.ok) {
    let message = `Paper not found (${response.status}).`;
    try {
      const err = (await response.json()) as { detail?: string };
      if (typeof err.detail === "string") message = err.detail;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await response.json()) as SearchResultItem;
}
