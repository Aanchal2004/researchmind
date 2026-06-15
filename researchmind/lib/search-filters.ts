import type { SearchFilters } from "@/lib/api/types";

export const SEARCH_SOURCE_OPTIONS = [
  { id: "arxiv", label: "arXiv" },
  { id: "semantic_scholar", label: "Semantic Scholar" },
  { id: "pubmed", label: "PubMed" },
  { id: "crossref", label: "Crossref" },
] as const;

export type SearchSourceId = (typeof SEARCH_SOURCE_OPTIONS)[number]["id"];

export const DEFAULT_SEARCH_SOURCES: SearchSourceId[] = ["arxiv", "semantic_scholar"];

export type ParsedSearchFilters = SearchFilters;

export function parseSearchFilters(searchParams: URLSearchParams): ParsedSearchFilters {
  const sourcesParam = searchParams.get("sources");
  const parsedSources = sourcesParam
    ? sourcesParam
        .split(",")
        .map((source) => source.trim().toLowerCase())
        .filter((source): source is SearchSourceId =>
          SEARCH_SOURCE_OPTIONS.some((option) => option.id === source),
        )
    : [...DEFAULT_SEARCH_SOURCES];

  const sources = parsedSources.length > 0 ? parsedSources : [...DEFAULT_SEARCH_SOURCES];
  const openAccessParam = searchParams.get("oa");
  const open_access_only = openAccessParam === null ? true : openAccessParam === "1";

  const yearFromParam = searchParams.get("year_from");
  const yearToParam = searchParams.get("year_to");
  const year_from = parseYear(yearFromParam);
  const year_to = parseYear(yearToParam);

  return {
    sources,
    year_from,
    year_to,
    open_access_only,
  };
}

export function buildFilterBadges(filters: ParsedSearchFilters, limit: number) {
  const allSources = SEARCH_SOURCE_OPTIONS.map((s) => s.id);
  const allSelected = allSources.every((id) => filters.sources.includes(id));
  const sourceLabel = allSelected
    ? `Sources: all (${allSources.length})`
    : `Source${filters.sources.length > 1 ? "s" : ""}: ${filters.sources.map(formatSourceLabel).join(", ")}`;

  const badges = [
    sourceLabel,
    filters.open_access_only ? "Open access only" : "All access types",
    `Limit: ${limit}`,
  ];

  if (filters.year_from !== null && filters.year_from !== undefined) {
    badges.push(`From ${filters.year_from}`);
  }
  if (filters.year_to !== null && filters.year_to !== undefined) {
    badges.push(`To ${filters.year_to}`);
  }

  return badges;
}

export function formatSourceLabel(source: string) {
  const map: Record<string, string> = {
    arxiv: "arXiv",
    semantic_scholar: "Semantic Scholar",
    pubmed: "PubMed",
    crossref: "Crossref",
  };
  return map[source] ?? source;
}

function parseYear(value: string | null): number | null | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1900 || parsed > 2100) {
    return undefined;
  }

  return Math.trunc(parsed);
}
