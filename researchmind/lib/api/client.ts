import type { SearchRequest, SearchResponse } from "@/lib/api/types";

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
