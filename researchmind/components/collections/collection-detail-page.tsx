"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookMarked, FolderKanban, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExportCitationsDialog } from "@/components/citations/export-citations-dialog";
import {
  getCollectionPapers,
  loadCollections,
  subscribeCollections,
  type Collection,
} from "@/lib/collections";
import { loadSavedPapers, subscribeSavedPapers } from "@/lib/saved-papers";
import type { SearchResultItem } from "@/lib/api/types";

type Props = { collectionId: string };

export function CollectionDetailPage({ collectionId }: Props) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [papers, setPapers] = useState<SearchResultItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const cols = loadCollections();
      const col = cols.find((c) => c.id === collectionId) ?? null;
      setCollection(col);
      if (col) {
        setPapers(getCollectionPapers(col, loadSavedPapers()));
      }
    };
    setMounted(true);
    refresh();
    const u1 = subscribeCollections(refresh);
    const u2 = subscribeSavedPapers(refresh);
    return () => { u1(); u2(); };
  }, [collectionId]);

  if (!mounted) return null;

  if (!collection) {
    return (
      <div className="panel p-12 text-center">
        <h1 className="text-xl font-semibold text-white">Collection not found</h1>
        <Button asChild variant="outline" className="mt-6 rounded-xl border-white/10 bg-white/[0.04] text-slate-200">
          <Link href="/collections">
            <ArrowLeft className="size-4" /> Back to collections
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="panel p-5 sm:p-6">
        <div className="mb-3">
          <Link href="/collections" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="size-4" /> Collections
          </Link>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${collection.accent}`}>
              <FolderKanban className="size-5 text-slate-950/70" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
                {collection.name}
              </h1>
              {collection.description && (
                <p className="mt-1 text-sm text-slate-400">{collection.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {papers.length > 0 && <ExportCitationsDialog papers={papers} />}
            <Button asChild variant="outline" className="rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]">
              <Link href="/search">
                <Plus className="size-4" /> Add papers
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {papers.length === 0 ? (
        <div className="panel p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-400/10 text-teal-200">
            <BookMarked className="size-7" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-white">No papers in this collection</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-400">
            Save papers from search and add them to <strong className="text-white">{collection.name}</strong>.
          </p>
          <Button asChild className="mt-8 rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110">
            <Link href="/search">
              <Search className="size-4" /> Search for papers
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {papers.map((paper) => (
            <article key={paper.paper_id} className="panel p-5 space-y-3">
              <Link
                href={`/paper/${encodeURIComponent(paper.paper_id)}`}
                className="block font-semibold leading-6 text-white hover:text-teal-100"
              >
                {paper.title}
              </Link>
              <p className="text-xs text-slate-400">
                {paper.authors.slice(0, 2).join(", ")}{paper.authors.length > 2 ? " et al." : ""} · {paper.year ?? "n.d."}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
