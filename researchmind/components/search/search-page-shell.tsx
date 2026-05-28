"use client";

import { useEffect, useState } from "react";
import { ListFilter, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { SearchResultsPanel } from "@/components/search/search-results-panel";
import { SearchSynthesisPanel } from "@/components/search/search-synthesis-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { searchPapers } from "@/lib/api/client";
import type { SearchRequest, SearchResponse } from "@/lib/api/types";

const DEFAULT_LIMIT = 8;

export function SearchPageShell() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : DEFAULT_LIMIT;

  const [data, setData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
      filters: {
        sources: ["arxiv"],
        open_access_only: true,
      },
    };

    async function runSearch() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await searchPapers(payload, controller.signal);
        setData(response);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setData(null);
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
  }, [limit, query, reloadKey]);

  const filterBadges = [
    "Source: arXiv",
    "Open access only",
    `Limit: ${limit}`,
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
                variant="outline"
                className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
              >
                Save search
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
              >
                Alerts
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              className="rounded-full border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
            >
              <ListFilter className="size-4" />
              Filters
            </Button>
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
          />
          <SearchSynthesisPanel
            data={data}
            isLoading={isLoading}
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
