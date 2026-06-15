"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportCitationsDialog } from "@/components/citations/export-citations-dialog";
import { fetchPaper, paperChat } from "@/lib/api/client";
import { formatCitation } from "@/lib/citations/formatters";
import {
  loadSavedPapers,
  persistSavedPapers,
  subscribeSavedPapers,
} from "@/lib/saved-papers";
import { loadLastSearchQuery } from "@/lib/last-search";
import type { SearchResultItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type Props = {
  paperId: string;
};

const SOURCE_COLORS: Record<string, string> = {
  arxiv: "border-red-300/20 bg-red-400/12 text-red-200",
  semantic_scholar: "border-sky-300/20 bg-sky-400/12 text-sky-200",
  pubmed: "border-violet-300/20 bg-violet-400/12 text-violet-200",
};

export function PaperDetailShell({ paperId }: Props) {
  const [paper, setPaper] = useState<SearchResultItem | null>(null);
  const [savedPapers, setSavedPapers] = useState<SearchResultItem[]>([]);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "error">("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadSavedPapers();
    setSavedPapers(saved);
    const decoded = decodeURIComponent(paperId);
    setLastQuery(loadLastSearchQuery());

    // 1. Try localStorage first (instant, no network)
    const found = saved.find((p) => p.paper_id === decoded || p.paper_id === paperId);
    if (found) {
      setPaper(found);
    } else {
      // 2. Fall back to live backend fetch
      const controller = new AbortController();
      setFetchState("loading");
      fetchPaper(decoded || paperId, controller.signal)
        .then((result) => {
          setPaper(result);
          setFetchState("idle");
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setFetchState("error");
          setFetchError(err instanceof Error ? err.message : "Could not load paper.");
        });
      return () => controller.abort();
    }

    return subscribeSavedPapers(() => {
      const next = loadSavedPapers();
      setSavedPapers(next);
      const r = next.find((p) => p.paper_id === decoded || p.paper_id === paperId);
      if (r) setPaper(r);
    });
  }, [paperId]);

  const isSaved = savedPapers.some((p) => p.paper_id === paper?.paper_id);

  const toggleSave = () => {
    if (!paper) return;
    const next = isSaved
      ? savedPapers.filter((p) => p.paper_id !== paper.paper_id)
      : [paper, ...savedPapers];
    persistSavedPapers(next);
    setSavedPapers(next);
  };

  if (fetchState === "loading") {
    return <PaperLoadingSkeleton />;
  }

  if (!paper) {
    return <PaperNotFound lastQuery={lastQuery} errorMessage={fetchState === "error" ? fetchError : null} />;
  }

  const sourceColor = SOURCE_COLORS[paper.source.toLowerCase()] ?? "border-white/10 bg-white/[0.04] text-slate-200";

  return (
    <div className="grid gap-4 xl:grid-cols-[18rem_1fr_20rem]">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="hidden xl:block">
        <div className="panel sticky top-24 space-y-6 overflow-y-auto p-5" style={{ maxHeight: "calc(100vh - 7rem)" }}>
          <div>
            <Link
              href={lastQuery ? `/search?q=${encodeURIComponent(lastQuery)}` : "/search"}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Back to results
            </Link>
          </div>

          {paper.tags.length > 0 && (
            <div>
              <div className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-slate-500">Tags</div>
              <div className="flex flex-wrap gap-1.5">
                {paper.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-xs text-slate-300">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-slate-500">Paper Metadata</div>
            <dl className="space-y-2.5 text-sm">
              <MetaRow label="Source">
                <Badge variant="outline" className={cn("rounded-full text-xs", sourceColor)}>
                  {paper.source}
                </Badge>
              </MetaRow>
              {paper.doi && (
                <MetaRow label="DOI">
                  <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer" className="text-teal-300 hover:text-teal-200 flex items-center gap-1">
                    {paper.doi} <ExternalLink className="size-3" />
                  </a>
                </MetaRow>
              )}
              {paper.year && <MetaRow label="Year">{paper.year}</MetaRow>}
              {paper.venue && <MetaRow label="Venue">{paper.venue}</MetaRow>}
              {paper.open_access && (
                <MetaRow label="Access">
                  <span className="text-emerald-300">Open access</span>
                </MetaRow>
              )}
              {paper.provider_sources.length > 1 && (
                <MetaRow label="Sources">{paper.provider_sources.join(", ")}</MetaRow>
              )}
            </dl>
          </div>

          <div>
            <div className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-slate-500">Related</div>
            <Link
              href={`/search?q=${encodeURIComponent(paper.title)}`}
              className="block rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white"
            >
              Find similar papers →
            </Link>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="min-w-0 space-y-5">
        {/* Paper header */}
        <div className="panel p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-2 xl:hidden">
            <Link
              href={lastQuery ? `/search?q=${encodeURIComponent(lastQuery)}` : "/search"}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft className="size-4" /> Back
            </Link>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("rounded-full text-xs", sourceColor)}>
                {paper.source}
              </Badge>
              {paper.year && (
                <span className="text-sm text-slate-500">{paper.year}</span>
              )}
            </div>
            <div className="flex gap-2">
              {paper.pdf_url && (
                <Button asChild variant="outline" size="sm" className="rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]">
                  <a href={paper.pdf_url} target="_blank" rel="noreferrer">
                    <FileText className="size-4" /> PDF
                  </a>
                </Button>
              )}
              {paper.url && (
                <Button asChild variant="outline" size="sm" className="rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]">
                  <a href={paper.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" /> Open paper
                  </a>
                </Button>
              )}
            </div>
          </div>

          <h1 className="mt-5 font-heading text-2xl leading-tight tracking-[-0.03em] text-white sm:text-3xl">
            {paper.title}
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            {paper.authors.join(", ")}
            {paper.year ? ` · ${paper.year}` : ""}
          </p>
        </div>

        {/* Abstract */}
        {paper.abstract && (
          <div className="panel p-6">
            <div className="eyebrow mb-3">Abstract</div>
            <p className="leading-8 text-slate-300/88">{paper.abstract}</p>
          </div>
        )}

        {/* AI Synthesis placeholder */}
        <div className="panel p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-teal-300" />
            <div className="eyebrow">AI summary</div>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            AI-powered key claim extraction is available when this paper was retrieved as part of a live search. Run a search for this paper title to generate grounded highlights.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]">
            <Link href={`/search?q=${encodeURIComponent(paper.title)}`}>
              <MessageSquare className="size-4" />
              Search for this paper
            </Link>
          </Button>
        </div>
      </main>

      {/* ── RIGHT SIDEBAR ── */}
      <aside className="space-y-4">
        {/* Actions */}
        <div className="panel p-5 space-y-3">
          <div className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-slate-500">Actions</div>
          <Button
            onClick={toggleSave}
            variant="outline"
            className={cn(
              "w-full justify-start rounded-xl border-white/10 text-slate-200 hover:bg-white/[0.08]",
              isSaved ? "border-teal-300/20 bg-teal-400/10 text-teal-200" : "bg-white/[0.04]",
            )}
          >
            {isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
            {isSaved ? "Saved to library" : "Save to library"}
          </Button>
          <ExportCitationsDialog papers={[paper]} />
          <Button asChild variant="outline" className="w-full justify-start rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]">
            <Link href={`/search?q=${encodeURIComponent(paper.title)}`}>
              <MessageSquare className="size-4" />
              Find related papers
            </Link>
          </Button>
        </div>

        {/* Quick citation */}
        <div className="panel p-5 space-y-3">
          <div className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-slate-500">Quick citation</div>
          <Tabs defaultValue="apa">
            <TabsList variant="line" className="w-full justify-start gap-0 rounded-none border-b border-white/10 p-0">
              {["apa", "bibtex", "mla"].map((f) => (
                <TabsTrigger key={f} value={f} className="rounded-none px-3 py-2 text-[0.7rem] uppercase text-slate-900">
                  {f.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
            {(["apa", "bibtex", "mla"] as const).map((f) => (
              <TabsContent key={f} value={f}>
                <pre className="max-h-32 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-[0.7rem] leading-5 text-slate-300 whitespace-pre-wrap break-words">
                  {formatCitation(paper, f)}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(formatCitation(paper, f));
                  }}
                  className="mt-2 w-full rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                >
                  <Copy className="size-3.5" /> Copy {f.toUpperCase()}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Ask about paper — live AI chat */}
        <PaperChatPanel paper={paper} />
      </aside>
    </div>
  );
}

type ChatMessage = { role: "user" | "assistant"; text: string };

const QUICK_QUESTIONS = [
  "What datasets were used?",
  "What are the key claims?",
  "How does this compare to prior work?",
];

function PaperChatPanel({ paper }: { paper: SearchResultItem }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (question: string) => {
    if (!question.trim() || busy) return;
    const q = question.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await paperChat({
        question: q,
        paper_title: paper.title,
        paper_abstract: paper.abstract,
        paper_authors: paper.authors,
        paper_year: paper.year,
      });
      setMessages((prev) => [...prev, { role: "assistant", text: res.answer }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed.";
      setError(msg);
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${msg}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-slate-500">Ask about this paper</div>
        <Badge variant="outline" className="rounded-full border-teal-300/20 bg-teal-400/10 px-2 text-[0.6rem] text-teal-300">
          <Sparkles className="mr-1 size-2.5" />Gemini
        </Badge>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              disabled={busy}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl px-3 py-2 text-xs leading-relaxed",
                msg.role === "user"
                  ? "ml-6 bg-teal-400/10 text-teal-100"
                  : "mr-6 bg-white/[0.05] text-slate-300",
              )}
            >
              {msg.text}
            </div>
          ))}
          {busy && (
            <div className="mr-6 flex items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-2">
              <Loader2 className="size-3 animate-spin text-teal-400" />
              <span className="text-xs text-slate-400">Thinking…</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
          placeholder="What would you like to know?"
          disabled={busy}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={busy || !input.trim()}
          className="rounded-lg bg-teal-400/15 p-1.5 text-teal-300 hover:bg-teal-400/25 disabled:opacity-40"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
        </button>
      </div>
      {error && <p className="text-[0.68rem] text-rose-400">{error}</p>}
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right text-slate-300">{children}</dd>
    </div>
  );
}

function PaperLoadingSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[18rem_1fr_20rem]">
      <div className="hidden xl:block">
        <div className="panel sticky top-24 space-y-4 p-5">
          <Skeleton className="h-4 w-24 bg-white/10" />
          <Skeleton className="h-20 w-full bg-white/10" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="panel p-8 space-y-4">
          <Skeleton className="h-6 w-32 bg-white/10" />
          <Skeleton className="h-8 w-full bg-white/10" />
          <Skeleton className="h-8 w-3/4 bg-white/10" />
          <Skeleton className="h-4 w-48 bg-white/10" />
        </div>
        <div className="panel p-6 space-y-3">
          <Skeleton className="h-4 w-20 bg-white/10" />
          <Skeleton className="h-24 w-full bg-white/10" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="panel p-5 space-y-3">
          <Skeleton className="h-10 w-full bg-white/10" />
          <Skeleton className="h-10 w-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function PaperNotFound({ lastQuery, errorMessage }: { lastQuery: string | null; errorMessage: string | null }) {
  const searchHref = lastQuery ? `/search?q=${encodeURIComponent(lastQuery)}` : "/search";
  return (
    <div className="panel p-12 text-center">
      <h1 className="text-xl font-semibold text-white">Paper not found</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-400">
        {errorMessage ?? "This paper isn't in your saved library. Search for it to retrieve the full metadata."}
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline" className="rounded-xl border-white/10 bg-white/[0.04] text-slate-200">
          <Link href={searchHref}>Search papers</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl border-white/10 bg-white/[0.04] text-slate-200">
          <Link href="/saved">Back to library</Link>
        </Button>
      </div>
    </div>
  );
}
