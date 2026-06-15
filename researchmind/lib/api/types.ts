export type SearchFilters = {
  sources: string[];
  year_from?: number | null;
  year_to?: number | null;
  open_access_only: boolean;
};

export type SearchRequest = {
  query: string;
  page?: number;
  limit: number;
  filters: SearchFilters;
};

export type SearchResultItem = {
  paper_id: string;
  title: string;
  authors: string[];
  year?: number | null;
  venue?: string | null;
  source: string;
  abstract?: string | null;
  score?: number | null;
  doi?: string | null;
  url?: string | null;
  pdf_url?: string | null;
  open_access: boolean;
  tags: string[];
  provider_sources: string[];
  provider_ids: string[];
};

export type SearchSynthesis = {
  status: "pending" | "completed" | "disabled" | "failed";
  summary: string;
  highlights: string[];
  sources: string[];
  model?: string | null;
};

export type SearchMeta = {
  provider_reports: ProviderReport[];
  page: number;
  limit: number;
  total_results?: number | null;
  next_page?: number | null;
  query_id: string;
  mode: "scaffold" | "live";
  result_count: number;
  provider_count: number;
  sources_queried: string[];
  duration_ms: number;
  generated_at: string;
};

export type SearchResponse = {
  query: string;
  results: SearchResultItem[];
  synthesis: SearchSynthesis;
  meta: SearchMeta;
};

export type ProviderError = {
  code: string;
  message: string;
  retryable: boolean;
  attempt?: number | null;
};

export type ProviderReport = {
  source: string;
  status: "ok" | "partial" | "error";
  query_strategy: string;
  page: number;
  requested_limit: number;
  served_count: number;
  total_results?: number | null;
  next_page?: number | null;
  latency_ms: number;
  errors: ProviderError[];
};
