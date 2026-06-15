"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, ExternalLink, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadSavedPapers, persistSavedPapers, subscribeSavedPapers } from "@/lib/saved-papers";
import type { SearchResultItem } from "@/lib/api/types";

export function SavedLibraryPanel() {
  const [savedPapers, setSavedPapers] = useState<SearchResultItem[]>([]);

  useEffect(() => {
    setSavedPapers(loadSavedPapers());
    return subscribeSavedPapers(() => {
      setSavedPapers(loadSavedPapers());
    });
  }, []);

  const removePaper = (paperId: string) => {
    const next = savedPapers.filter((paper) => paper.paper_id !== paperId);
    setSavedPapers(next);
    persistSavedPapers(next);
  };

  const footerLabel = useMemo(
    () =>
      savedPapers.length > 0
        ? `${savedPapers.length} paper${savedPapers.length === 1 ? "" : "s"} saved locally in this browser.`
        : "Your saved papers are persisted in localStorage so you can return to them later.",
    [savedPapers.length],
  );

  return (
    <section id="library" className="panel p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Saved papers</h2>
          <p className="mt-1 text-sm text-slate-400">
            Keep key papers in your workspace with lightweight browser persistence.
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          className="text-slate-300 hover:bg-white/6 hover:text-white"
        >
          <a href="/search">Browse search</a>
        </Button>
      </div>

      {savedPapers.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-teal-400/10 text-teal-200">
            <Bookmark className="size-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-white">No saved papers yet</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Save papers from search results to build continuity across sessions.
          </p>
          <Button
            asChild
            variant="outline"
            className="mt-6 rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
          >
            <a href="/search">Go to search</a>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {savedPapers.map((paper) => (
            <article
              key={paper.paper_id}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/[0.04] text-slate-200"
                  >
                    {paper.source}
                  </Badge>
                  <div className="mt-4 text-sm text-slate-400">
                    {paper.authors.join(", ")} {paper.year ? `· ${paper.year}` : ""}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-slate-400 hover:bg-white/6 hover:text-white"
                  onClick={() => removePaper(paper.paper_id)}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Remove saved paper</span>
                </Button>
              </div>
              <h3 className="mt-5 text-lg font-semibold leading-7 text-white">
                <a
                  href={`/search?q=${encodeURIComponent(paper.title)}`}
                  className="hover:text-teal-100"
                >
                  {paper.title}
                </a>
              </h3>
              <p className="mt-4 text-sm leading-6 text-slate-300/74">
                {paper.abstract ?? "Abstract unavailable."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-white/10 bg-white/[0.04] text-slate-300"
                >
                  {paper.provider_sources.join(" • ")}
                </Badge>
                {paper.doi ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/[0.04] text-slate-300"
                  >
                    DOI
                  </Badge>
                ) : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-300">
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
                    <ExternalLink className="size-4" />
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-5 text-sm text-slate-500">{footerLabel}</p>
    </section>
  );
}
