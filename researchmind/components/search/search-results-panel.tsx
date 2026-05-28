import { ArrowUpRight, Bookmark, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchResponse, SearchResultItem } from "@/lib/api/types";

type SearchResultsPanelProps = {
  data: SearchResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
};

export function SearchResultsPanel({
  data,
  isLoading,
  errorMessage,
  onRetry,
}: SearchResultsPanelProps) {
  const results = data?.results ?? [];
  const meta = data?.meta;

  return (
    <div className="border-b border-white/10 xl:border-r xl:border-b-0">
      <div className="flex items-center justify-between px-5 py-4 text-sm text-slate-400 sm:px-6">
        <span>
          {isLoading
            ? "Searching arXiv..."
            : meta
              ? `${meta.result_count} results from ${meta.provider_count} source${meta.provider_count === 1 ? "" : "s"}`
              : "Use the search bar above to start"}
        </span>
        <span>Sorted by relevance</span>
      </div>

      <div className="space-y-3 px-3 pb-3 sm:px-4 sm:pb-4">
        {isLoading ? <SearchResultsSkeleton /> : null}
        {!isLoading && errorMessage ? (
          <SearchMessageCard
            title="Couldn’t load search results"
            body={errorMessage}
            actionLabel="Try again"
            onAction={onRetry}
          />
        ) : null}
        {!isLoading && !errorMessage && !data ? (
          <SearchMessageCard
            title="Start a live literature search"
            body="Use the search bar in the workspace header to query the backend and populate this results list."
          />
        ) : null}
        {!isLoading && !errorMessage && data && results.length === 0 ? (
          <SearchMessageCard
            title="No papers matched this query"
            body="Try a broader phrase, remove constraints, or search a related topic."
          />
        ) : null}
        {!isLoading && !errorMessage
          ? results.map((paper, index) => (
              <SearchResultCard key={paper.paper_id} paper={paper} index={index} />
            ))
          : null}
      </div>
    </div>
  );
}

function SearchResultCard({
  paper,
  index,
}: {
  paper: SearchResultItem;
  index: number;
}) {
  const metadata = [paper.year, paper.venue].filter(Boolean).join(" · ");

  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(6,18,28,0.92)_0%,rgba(9,24,35,0.96)_100%)] p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex gap-3 sm:w-20 sm:flex-col">
          <span className="text-sm text-slate-400">{index + 1}</span>
          <div className="rounded-xl bg-teal-400/12 px-3 py-2 text-center">
            <div className="text-lg font-semibold text-teal-200">
              {formatScore(paper.score)}
            </div>
            <div className="text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">
              score
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-white/10 bg-white/[0.04] text-slate-200"
                >
                  {paper.source}
                </Badge>
                {metadata ? (
                  <span className="text-sm text-slate-500">{metadata}</span>
                ) : null}
              </div>
              <h2 className="text-2xl font-semibold leading-tight text-white">
                {paper.title}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-slate-400 hover:bg-white/6 hover:text-white"
            >
              <Bookmark className="size-4" />
              <span className="sr-only">Save paper</span>
            </Button>
          </div>

          <p className="mt-3 text-sm leading-7 text-slate-300/74">
            {paper.authors.join(", ")}
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-300/78">
            {paper.abstract ?? "Abstract unavailable."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {paper.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="rounded-full border-white/10 bg-white/[0.04] text-slate-300"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
            {paper.pdf_url ? (
              <a
                href={paper.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-white"
              >
                View PDF
                <ExternalLink className="size-4" />
              </a>
            ) : null}
            {paper.url ? (
              <a
                href={paper.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-white"
              >
                Open paper
                <ArrowUpRight className="size-4" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function SearchResultsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(6,18,28,0.92)_0%,rgba(9,24,35,0.96)_100%)] p-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex gap-3 sm:w-20 sm:flex-col">
              <Skeleton className="h-4 w-6 bg-white/10" />
              <Skeleton className="h-16 w-16 rounded-xl bg-teal-400/10" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-5 w-40 bg-white/10" />
              <Skeleton className="h-10 w-full bg-white/10" />
              <Skeleton className="h-4 w-2/3 bg-white/10" />
              <Skeleton className="h-20 w-full bg-white/10" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-20 rounded-full bg-white/10" />
                <Skeleton className="h-7 w-24 rounded-full bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function SearchMessageCard({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-5 py-8 text-center">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-300/74">
        {body}
      </p>
      {actionLabel && onAction ? (
        <Button
          onClick={onAction}
          className="mt-5 rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110"
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function formatScore(score?: number | null) {
  if (typeof score !== "number") {
    return "N/A";
  }

  return (score * 10).toFixed(1);
}
