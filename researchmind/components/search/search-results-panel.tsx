import {
  AlertTriangle,
  ArrowUpRight,
  Bookmark,
  Clock,
  ExternalLink,
  Gauge,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ProviderError,
  ProviderReport,
  SearchResponse,
  SearchResultItem,
} from "@/lib/api/types";
import { formatSourceLabel } from "@/lib/search-filters";

type SearchResultsPanelProps = {
  data: SearchResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  savedPaperIds?: Set<string>;
  onToggleSavedPaper?: (paper: SearchResultItem) => void;
};

type RetrievalDiagnostic = {
  severity: "ok" | "partial" | "error";
  title: string;
  body: string;
  label: string;
  retryable: boolean;
  icon: "health" | "timeout" | "rate_limit";
};

export function SearchResultsPanel({
  data,
  isLoading,
  errorMessage,
  onRetry,
  savedPaperIds,
  onToggleSavedPaper,
}: SearchResultsPanelProps) {
  const results = data?.results ?? [];
  const meta = data?.meta;
  const citationIndexById = new Map<string, number>();
  const synthesisSources = data?.synthesis?.sources ?? [];
  synthesisSources.forEach((id, idx) => citationIndexById.set(id, idx + 1));
  const diagnostic = data ? getRetrievalDiagnostic(data.meta.provider_reports) : null;
  const hasProviderIssue = diagnostic?.severity !== "ok";

  return (
    <div className="border-b border-white/10 xl:border-r xl:border-b-0">
      <div className="flex items-center justify-between px-5 py-4 text-sm text-slate-400 sm:px-6">
        <span>
          {isLoading
            ? "Searching live providers..."
            : meta
              ? `${meta.result_count} results from ${meta.provider_count} source${meta.provider_count === 1 ? "" : "s"}`
              : "Use the search bar above to start"}
        </span>
        <span>Sorted by relevance</span>
      </div>

      <div className="space-y-3 px-3 pb-3 sm:px-4 sm:pb-4">
        {isLoading ? <SearchResultsSkeleton /> : null}
        {!isLoading && !errorMessage && diagnostic ? (
          <RetrievalStatusBanner diagnostic={diagnostic} onRetry={onRetry} />
        ) : null}
        {!isLoading && errorMessage ? (
          <SearchMessageCard
            title="Could not load search results"
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
            title={hasProviderIssue ? "Retrieval degraded" : "No papers matched this query"}
            body={
              hasProviderIssue
                ? diagnostic?.body ?? "One or more providers could not return results."
                : "Try a broader phrase, remove constraints, or search a related topic."
            }
            actionLabel={hasProviderIssue ? "Try again" : undefined}
            onAction={hasProviderIssue ? onRetry : undefined}
          />
        ) : null}
        {!isLoading && !errorMessage
          ? results.map((paper, index) => (
              <SearchResultCard
                key={paper.paper_id}
                paper={paper}
                index={index}
                citationIndex={citationIndexById.get(paper.paper_id)}
                isSaved={savedPaperIds?.has(paper.paper_id) ?? false}
                onToggleSavedPaper={onToggleSavedPaper}
              />
            ))
          : null}
      </div>
    </div>
  );
}

function RetrievalStatusBanner({
  diagnostic,
  onRetry,
}: {
  diagnostic: RetrievalDiagnostic;
  onRetry: () => void;
}) {
  if (diagnostic.severity === "ok") {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs text-slate-400">
        <Gauge className="size-4 text-teal-200" />
        <span>{diagnostic.label}</span>
      </div>
    );
  }

  const tone =
    diagnostic.severity === "partial"
      ? "border-amber-300/20 bg-amber-300/8 text-amber-100"
      : "border-rose-300/20 bg-rose-300/8 text-rose-100";
  const Icon = diagnostic.icon === "timeout" ? Clock : AlertTriangle;

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tone}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Icon className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium">{diagnostic.title}</div>
            <p className="mt-1 text-xs leading-5 opacity-80">{diagnostic.body}</p>
          </div>
        </div>
        {diagnostic.retryable ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="w-fit shrink-0 rounded-xl border-white/15 bg-white/[0.04] text-current hover:bg-white/[0.08]"
          >
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function SearchResultCard({
  paper,
  index,
  citationIndex,
  isSaved,
  onToggleSavedPaper,
}: {
  paper: SearchResultItem;
  index: number;
  citationIndex?: number | null;
  isSaved?: boolean;
  onToggleSavedPaper?: (paper: SearchResultItem) => void;
}) {
  const metadata = [paper.year, paper.venue].filter(Boolean).join(" - ");

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
                {paper.provider_sources.length > 1 ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-teal-300/20 bg-teal-400/10 text-teal-100"
                  >
                    Merged: {paper.provider_sources.map(formatSourceLabel).join(" + ")}
                  </Badge>
                ) : paper.provider_sources.length === 1 &&
                  paper.provider_sources[0] !== paper.source ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/[0.04] text-slate-300"
                  >
                    {formatSourceLabel(paper.provider_sources[0])}
                  </Badge>
                ) : null}
                {metadata ? (
                  <span className="text-sm text-slate-500">{metadata}</span>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold leading-tight text-white">
                  {paper.title}
                </h2>
                {citationIndex ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 text-xs font-bold text-white shadow-sm">
                    {citationIndex}
                  </div>
                ) : null}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className={`${
                isSaved ? "text-teal-200 hover:bg-teal-400/10" : "text-slate-400 hover:bg-white/6 hover:text-white"
              }`}
              onClick={() => onToggleSavedPaper?.(paper)}
            >
              <Bookmark className="size-4" />
              <span className="sr-only">
                {isSaved ? "Unsave paper" : "Save paper"}
              </span>
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

function getRetrievalDiagnostic(reports: ProviderReport[]): RetrievalDiagnostic | null {
  if (reports.length === 0) {
    return null;
  }

  const failedReports = reports.filter((report) => report.status === "error");
  const partialReports = reports.filter((report) => report.status === "partial");
  const issueReports = [...partialReports, ...failedReports];

  if (issueReports.length === 0) {
    return {
      severity: "ok",
      title: "Retrieval healthy",
      body: "",
      label: buildHealthyLabel(reports),
      retryable: false,
      icon: "health",
    };
  }

  const errors = issueReports.flatMap((report) => report.errors);
  const providerNames = issueReports.map(formatProviderName);
  const hasRateLimit = errors.some(isRateLimitError);
  const hasTimeout = errors.some(
    (error) => error.code === "timeout" || error.code === "budget_exceeded",
  );
  const retryable = errors.some((error) => error.retryable) || hasRateLimit || hasTimeout;
  const severity = failedReports.length === reports.length ? "error" : "partial";

  if (hasRateLimit) {
    return {
      severity,
      title: `${providerNames.join(", ")} temporarily rate limited`,
      body: severity === "partial" ? "Partial results returned. Retry in a few seconds." : "Retry in a few seconds.",
      label: "Rate limited",
      retryable,
      icon: "rate_limit",
    };
  }

  if (hasTimeout) {
    return {
      severity,
      title: `${providerNames.join(", ")} timed out`,
      body: severity === "partial" ? "Partial results returned before the timeout." : "Try again or narrow the query.",
      label: "Timeout",
      retryable,
      icon: "timeout",
    };
  }

  return {
    severity,
    title: severity === "partial" ? "Partial results returned" : "Retrieval degraded",
    body: `${providerNames.join(", ")} could not complete retrieval.`,
    label: "Degraded",
    retryable,
    icon: "health",
  };
}

function buildHealthyLabel(reports: ProviderReport[]) {
  const providerLabel = reports.map(formatProviderName).join(", ");
  const slowestLatency = Math.max(...reports.map((report) => report.latency_ms));
  return `${providerLabel} healthy - ${Math.round(slowestLatency)}ms`;
}

function formatProviderName(report: ProviderReport) {
  if (report.source === "arxiv") {
    return "arXiv";
  }
  if (report.source === "semantic_scholar") {
    return "Semantic Scholar";
  }
  return report.source;
}

function isRateLimitError(error: ProviderError) {
  return error.code === "rate_limited" || error.message.includes("429");
}
