"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { SearchFiltersSheet } from "@/components/search/search-filters-sheet";
import { SearchResultsPanel } from "@/components/search/search-results-panel";
import { SearchSynthesisPanel } from "@/components/search/search-synthesis-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { searchPapers, fetchSynthesis } from "@/lib/api/client";
import { persistLastSearchQuery } from "@/lib/last-search";
import { persistLastSearchMeta } from "@/lib/last-search-meta";
import { buildFilterBadges, parseSearchFilters } from "@/lib/search-filters";
import { useSavedPapers } from "@/lib/hooks/use-saved-papers";
import { useSearchHistory } from "@/lib/hooks/use-search-history";
import type { SearchRequest, SearchResponse } from "@/lib/api/types";

const DEFAULT_LIMIT = 8;

export function SearchPageShell() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : DEFAULT_LIMIT;
  const filters = useMemo(() => parseSearchFilters(searchParams), [searchParams]);
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const [data, setData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Tracks whether we are still waiting on background synthesis.
  const [synthesisPending, setSynthesisPending] = useState(false);

  const { savedPaperIds, togglePaper: toggleSavedPaper } = useSavedPapers();
  const { addEntry: addHistoryEntry } = useSearchHistory();

  useEffect(() => {
    if (!query) {
      setData(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const payload: SearchRequest = {
      query,
      limit,
      filters,
    };

    async function runSearch() {
      setIsLoading(true);
      setSynthesisPending(false);
      setErrorMessage(null);

      try {
        const response = await searchPapers(payload, controller.signal);
        setData(response);
        persistLastSearchQuery(query);
        persistLastSearchMeta(response.meta);
        addHistoryEntry(query, {
          resultCount: response.results.length,
          sourcesQueried: response.meta.sources_queried,
        });

        // If synthesis is still being generated, poll until it arrives.
        if (response.synthesis.status === "pending" && response.meta.query_id) {
          setSynthesisPending(true);
          const queryId = response.meta.query_id;

          const pollInterval = setInterval(async () => {
            if (controller.signal.aborted) {
              clearInterval(pollInterval);
              return;
            }
            try {
              const synthesis = await fetchSynthesis(queryId, controller.signal);
              if (synthesis && synthesis.status !== "pending") {
                clearInterval(pollInterval);
                setSynthesisPending(false);
                setData((prev) =>
                  prev ? { ...prev, synthesis } : prev,
                );
              }
            } catch {
              // ignore transient poll errors — keep retrying
            }
          }, 1500);

          // Clean up polling if this effect reruns (new search).
          controller.signal.addEventListener("abort", () => {
            clearInterval(pollInterval);
            setSynthesisPending(false);
          });
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setData(null);
        setSynthesisPending(false);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong while contacting the search backend.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void runSearch();

    return () => controller.abort();
  }, [filters, filtersKey, limit, query, reloadKey]);

  const filterBadges = [
    ...buildFilterBadges(filters, limit),
    data ? `Mode: ${data.meta.mode}` : "Live backend",
  ];

  return (
    <div className="space-y-4">
      <section className="panel overflow-hidden">
        <div className="border-b border-white/10 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="eyebrow">Search</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                Multi-source literature search with grounded synthesis.
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300/74">
                Search live academic sources, compare findings, and move from retrieval
                to synthesis without leaving the page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
              >
                <Link href="/search/history">Search history</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
              >
                <Link href="/alerts">Alerts</Link>
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <SearchFiltersSheet />
            {filterBadges.map((filter) => (
              <Badge
                key={filter}
                variant="outline"
                className="rounded-full border-white/10 bg-white/[0.03] px-3 py-1 text-slate-300"
              >
                {filter}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[minmax(0,0.9fr)_minmax(24rem,0.85fr)]">
          <SearchResultsPanel
            data={data}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onRetry={() => setReloadKey((current) => current + 1)}
            savedPaperIds={savedPaperIds}
            onToggleSavedPaper={toggleSavedPaper}
          />
          <SearchSynthesisPanel
            data={data}
            isLoading={isLoading}
            synthesisPending={synthesisPending}
            errorMessage={errorMessage}
          />
        </div>
      </section>

      <div className="fixed inset-x-4 bottom-24 z-30 lg:hidden">
        <Button className="h-14 w-full rounded-full bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-base font-semibold text-slate-950 shadow-[0_16px_40px_rgba(20,184,200,0.28)] hover:brightness-110">
          <Sparkles className="size-5" />
          Synthesize results
        </Button>
      </div>
    </div>
  );
}
