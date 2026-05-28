export type SearchFilters = {
  sources: string[];
  year_from?: number | null;
  year_to?: number | null;
  open_access_only: boolean;
};

export type SearchRequest = {
  query: string;
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
};

export type SearchSynthesis = {
  status: "pending" | "completed";
  summary: string;
  highlights: string[];
  sources: string[];
};

export type SearchMeta = {
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
