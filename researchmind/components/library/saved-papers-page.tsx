"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  ExternalLink,
  Grid2x2,
  List,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportCitationsDialog } from "@/components/citations/export-citations-dialog";
import {
  loadSavedPapers,
  persistSavedPapers,
  subscribeSavedPapers,
} from "@/lib/saved-papers";
import type { SearchResultItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const SOURCE_COLORS: Record<string, string> = {
  arxiv: "border-red-300/20 bg-red-400/10 text-red-200",
  semantic_scholar: "border-sky-300/20 bg-sky-400/10 text-sky-200",
  pubmed: "border-violet-300/20 bg-violet-400/10 text-violet-200",
};

const PER_PAGE = 12;

type SortKey = "saved" | "title" | "year" | "score";

export function SavedPapersPage() {
  const [papers, setPapers] = useState<SearchResultItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("saved");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setMounted(true);
    setPapers(loadSavedPapers());
    return subscribeSavedPapers(() => setPapers(loadSavedPapers()));
  }, []);

  const remove = useCallback((id: string) => {
    setPapers((curr) => {
      const next = curr.filter((p) => p.paper_id !== id);
      persistSavedPapers(next);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const base = q
      ? papers.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.authors.some((a) => a.toLowerCase().includes(q)) ||
            p.tags.some((t) => t.toLowerCase().includes(q)),
        )
      : [...papers];

    return base.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "year") return (b.year ?? 0) - (a.year ?? 0);
      if (sortBy === "score") return (b.score ?? 0) - (a.score ?? 0);
      return 0; // "saved" = insertion order (already newest first)
    });
  }, [papers, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pagePapers = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (!mounted) {
    return <SavedPageSkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="eyebrow">Library</div>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Saved papers
              <span className="rounded-full border border-teal-300/20 bg-teal-400/10 px-3 py-0.5 text-base font-medium text-teal-200">
                {papers.length}
              </span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              All papers you&apos;ve saved from search results.
            </p>
          </div>
          <div className="flex gap-2">
            {papers.length > 0 && (
              <ExportCitationsDialog papers={papers} />
            )}
            <Button
              asChild
              className="rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110"
            >
              <Link href="/search">
                <Plus className="size-4" />
                Add papers
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {papers.length > 0 && (
        <div className="panel p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search your saved papers..."
                className="rounded-xl border-white/10 bg-white/[0.04] pl-9 text-slate-100"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/40"
            >
              <option value="saved">Recently saved</option>
              <option value="year">Newest first</option>
              <option value="title">Title A–Z</option>
              <option value="score">Relevance score</option>
            </select>
            <div className="flex rounded-xl border border-white/10 overflow-hidden">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={cn("p-2 text-slate-400 hover:text-white", view === "grid" && "bg-white/[0.08] text-white")}
              >
                <Grid2x2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn("p-2 text-slate-400 hover:text-white", view === "list" && "bg-white/[0.08] text-white")}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {papers.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="panel p-12 text-center">
          <p className="text-lg font-semibold text-white">No results for &ldquo;{query}&rdquo;</p>
          <p className="mt-2 text-sm text-slate-400">Try a different search term.</p>
        </div>
      ) : (
        <>
          <div
            className={cn(
              view === "grid"
                ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "space-y-3",
            )}
          >
            {pagePapers.map((paper) =>
              view === "grid" ? (
                <GridCard key={paper.paper_id} paper={paper} onRemove={remove} />
              ) : (
                <ListRow key={paper.paper_id} paper={paper} onRemove={remove} />
              ),
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-slate-500">
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} papers
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl border-white/10 bg-white/[0.04] text-slate-200"
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const n = i + 1;
                  return (
                    <Button
                      key={n}
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(n)}
                      className={cn(
                        "rounded-xl border-white/10 bg-white/[0.04] text-slate-200",
                        page === n && "bg-teal-400/15 text-teal-200",
                      )}
                    >
                      {n}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl border-white/10 bg-white/[0.04] text-slate-200"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GridCard({ paper, onRemove }: { paper: SearchResultItem; onRemove: (id: string) => void }) {
  const sourceColor = SOURCE_COLORS[paper.source.toLowerCase()] ?? "border-white/10 bg-white/[0.04] text-slate-200";

  return (
    <article className="panel flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {paper.score != null && (
            <div className="rounded-xl bg-teal-400/12 px-2.5 py-1 text-center">
              <div className="text-sm font-semibold text-teal-200">{(paper.score * 10).toFixed(1)}</div>
              <div className="text-[0.6rem] uppercase tracking-[0.18em] text-slate-500">score</div>
            </div>
          )}
          <Badge variant="outline" className={cn("rounded-full text-xs", sourceColor)}>
            {paper.source}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Bookmark className="size-4 text-teal-300" />
          <button
            type="button"
            onClick={() => onRemove(paper.paper_id)}
            className="rounded-lg p-1 text-slate-500 hover:bg-white/6 hover:text-rose-300"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/paper/${encodeURIComponent(paper.paper_id)}`}
          className="block text-base font-semibold leading-6 text-white hover:text-teal-100"
        >
          {paper.title}
        </Link>
        <p className="mt-1 text-xs text-slate-400">
          {paper.authors.slice(0, 2).join(", ")}{paper.authors.length > 2 ? " et al." : ""} · {paper.year ?? "n.d."}
          {paper.venue ? ` · ${paper.venue}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {paper.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-xs text-slate-400">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        {paper.pdf_url && (
          <a href={paper.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
            View PDF <ExternalLink className="size-3" />
          </a>
        )}
        {paper.url && (
          <a href={paper.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
            Open paper <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </article>
  );
}

function ListRow({ paper, onRemove }: { paper: SearchResultItem; onRemove: (id: string) => void }) {
  const sourceColor = SOURCE_COLORS[paper.source.toLowerCase()] ?? "border-white/10 bg-white/[0.04] text-slate-200";

  return (
    <div className="panel flex items-center gap-4 px-5 py-4">
      <div className="hidden min-w-0 flex-1 sm:block">
        <Link
          href={`/paper/${encodeURIComponent(paper.paper_id)}`}
          className="block font-medium leading-6 text-white hover:text-teal-100"
        >
          {paper.title}
        </Link>
        <p className="mt-0.5 text-xs text-slate-400">
          {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm text-slate-500">{paper.year ?? "—"}</span>
        <Badge variant="outline" className={cn("rounded-full text-xs", sourceColor)}>{paper.source}</Badge>
        {paper.url && (
          <a href={paper.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white">
            <ExternalLink className="size-4" />
          </a>
        )}
        <button
          type="button"
          onClick={() => onRemove(paper.paper_id)}
          className="rounded-lg p-1 text-slate-500 hover:bg-white/6 hover:text-rose-300"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="panel p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-400/10 text-teal-200">
        <Bookmark className="size-7" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-white">No saved papers yet</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-400">
        Save papers from search results to build your personal research library. Organize them into collections and export citations.
      </p>
      <Button
        asChild
        className="mt-8 rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110"
      >
        <Link href="/search">
          <Search className="size-4" />
          Save papers from search
        </Link>
      </Button>
    </div>
  );
}

function SavedPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="panel p-5 sm:p-6">
        <Skeleton className="h-10 w-56 bg-white/10" />
        <Skeleton className="mt-3 h-5 w-72 bg-white/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="panel p-5 space-y-3">
            <Skeleton className="h-5 w-24 bg-white/10" />
            <Skeleton className="h-8 w-full bg-white/10" />
            <Skeleton className="h-4 w-3/4 bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
