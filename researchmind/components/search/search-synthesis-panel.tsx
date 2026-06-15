import { AlertCircle, Check, Copy, Download, Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SearchResponse } from "@/lib/api/types";

type SearchSynthesisPanelProps = {
  data: SearchResponse | null;
  isLoading: boolean;
  /** True while the background synthesis task is still running. */
  synthesisPending?: boolean;
  errorMessage: string | null;
};

export function SearchSynthesisPanel({
  data,
  isLoading,
  synthesisPending = false,
  errorMessage,
}: SearchSynthesisPanelProps) {
  // Treat synthesis as pending if the flag is set OR if backend says so.
  const synthesis = data?.synthesis;
  const isPendingSynthesis = synthesisPending || synthesis?.status === "pending";

  return (
    <div className="reading-panel min-h-full p-4 sm:p-6">
      <Tabs defaultValue="synthesis" className="gap-5">
        <TabsList
          variant="line"
          className="w-full justify-start gap-3 overflow-x-auto rounded-none p-0"
        >
          <TabsTrigger value="synthesis" className="px-0 text-slate-900">
            AI synthesis
          </TabsTrigger>
          <TabsTrigger value="takeaways" className="px-0 text-slate-900">
            Key takeaways
          </TabsTrigger>
          <TabsTrigger value="table" className="px-0 text-slate-900">
            Table
          </TabsTrigger>
          <TabsTrigger value="mindmap" className="px-0 text-slate-900">
            Mind map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="synthesis" className="space-y-6">
          {isLoading ? (
            <SynthesisSkeleton />
          ) : errorMessage ? (
            <SynthesisErrorState />
          ) : !data ? (
            <PanelMessage body="Run a search to populate the synthesis panel with live backend data." />
          ) : isPendingSynthesis ? (
            <SynthesisGeneratingState />
          ) : (
            <>
              <SynthesisSummary synthesis={synthesis} />
              <SynthesisSourcesPanel synthesis={synthesis} data={data} />
            </>
          )}
        </TabsContent>

        <TabsContent value="takeaways" className="space-y-4">
          {isLoading ? (
            <TakeawaysSkeleton />
          ) : !data ? (
            <PanelMessage body="Key takeaways will appear here after a live search completes." />
          ) : !synthesis?.highlights?.length ? (
            <PanelMessage body="No grounded takeaways available for this search. Review the synthesis above or papers below." />
          ) : (
            <>
              <div className="text-xs uppercase tracking-[0.15em] text-slate-500 font-semibold">
                Grounded highlights ({synthesis.highlights.length})
              </div>
              <div className="space-y-3">
                {(synthesis?.highlights ?? []).map((item: string, idx: number) => (
                  <HighlightCard key={idx} text={item} index={idx} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="table" className="space-y-3">
          {isLoading ? (
            <TakeawaysSkeleton />
          ) : !data ? (
            <PanelMessage body="Run a search to compare papers side by side." />
          ) : (
            <ComparisonTable data={data} />
          )}
        </TabsContent>

        <TabsContent value="mindmap" className="space-y-3">
          <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
            Mind map placeholder for concept clustering and paper lineage.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PanelMessage({ body }: { body: string }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-900/10 bg-white/70 p-6 text-sm leading-7 text-slate-700">
      {body}
    </div>
  );
}

function SynthesisErrorState() {
  return (
    <div className="rounded-[1.4rem] border border-rose-200/40 bg-rose-50/50 p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600" />
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-rose-900">Synthesis unavailable</h4>
          <p className="mt-1 text-sm text-rose-800/80">
            The retrieval request failed, but search results remain available above for manual review.
          </p>
        </div>
      </div>
    </div>
  );
}

function SynthesisSummary({
  synthesis,
}: {
  synthesis: SearchResponse["synthesis"] | undefined;
}) {
  const isPartial = synthesis?.status === "pending";
  const isFailed = synthesis?.status === "failed";
  const isCompleted = synthesis?.status === "completed";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
            Grounded synthesis
          </h3>
          {isCompleted && (
            <Badge variant="outline" className="rounded-full border-teal-200/40 bg-teal-50/50 px-2 py-0.5 text-xs text-teal-700">
              <Sparkles className="mr-1 size-3" />
              {synthesis?.model ? `${synthesis.model} · local` : "Extractive"}
            </Badge>
          )}
          {isPartial && (
            <Badge variant="outline" className="rounded-full border-amber-200/40 bg-amber-50/50 px-2 py-0.5 text-xs text-amber-700">
              <Loader2 className="mr-1 size-3 animate-spin" />
              Processing
            </Badge>
          )}
          {isFailed && (
            <Badge variant="outline" className="rounded-full border-rose-200/40 bg-rose-50/50 px-2 py-0.5 text-xs text-rose-700">
              <AlertCircle className="mr-1 size-3" />
              Degraded
            </Badge>
          )}
        </div>
      </div>

      <div className="rounded-[1.4rem] border border-slate-900/10 bg-white/70 p-5">
        <p className="text-[0.95rem] leading-[1.75] text-slate-800">
          {synthesis?.summary}
        </p>
        {isPartial && (
          <p className="mt-3 text-xs text-slate-500">
            Synthesis is being prepared. Review papers below while waiting.
          </p>
        )}
      </div>
    </div>
  );
}

function SynthesisSourcesPanel({
  synthesis,
  data,
}: {
  synthesis: SearchResponse["synthesis"] | undefined;
  data: SearchResponse | null;
}) {
  const sourceIds = synthesis?.sources.length
    ? synthesis.sources
    : (data?.results.slice(0, 5).map((r) => r.paper_id) ?? []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
            Cited sources
          </h3>
          <p className="mt-1 text-xs text-slate-500">{sourceIds.length} paper{sourceIds.length === 1 ? "" : "s"} referenced</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <Copy className="size-3.5" />
            <span className="ml-1.5 text-xs">Copy</span>
          </Button>
          <Button
            size="sm"
            className="bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110"
          >
            <Download className="size-3.5" />
            <span className="ml-1.5 text-xs">Export</span>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {sourceIds.map((sourceId, index) => {
          const paper = data?.results.find((r) => r.paper_id === sourceId);

          return (
            <div
              key={sourceId}
              className="group rounded-[1.2rem] border border-slate-200/60 bg-gradient-to-r from-white/80 to-white/60 p-4 transition-all hover:border-slate-300/80 hover:bg-white/80"
            >
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100/60 text-sm font-semibold text-teal-700">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium leading-tight text-slate-900">
                    {paper?.title || sourceId}
                  </h4>
                  {paper && (
                    <>
                      <p className="mt-1.5 text-xs text-slate-600">
                        {paper.authors.slice(0, 2).join(", ")}
                        {paper.authors.length > 2 ? " et al." : ""}
                        {paper.year && ` • ${paper.year}`}
                      </p>
                      {paper.venue && (
                        <p className="mt-1 text-xs text-slate-500">{paper.venue}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HighlightCard({ text, index }: { text: string; index: number }) {
  // Extract citation indices from text like "[1]" or "[1] [2]"
  const citationPattern = /\[(\d+)\]/g;
  const citations = Array.from(text.matchAll(citationPattern), (m) => m[1]);

  return (
    <div className="rounded-[1.2rem] border border-slate-200/60 bg-gradient-to-r from-white/80 to-white/60 p-4">
      <div className="flex gap-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-[1.65] text-slate-800">{text}</p>
          {citations.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {citations.map((citation) => (
                <Badge
                  key={citation}
                  variant="outline"
                  className="rounded-full border-teal-200/40 bg-teal-50/60 px-2 py-0.5 text-xs text-teal-700"
                >
                  Source [{citation}]
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonTable({ data }: { data: SearchResponse }) {
  const papers = data.results.slice(0, 8);
  if (!papers.length) {
    return <PanelMessage body="No results to compare." />;
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
        Paper comparison — top {papers.length} results
      </div>
      <div className="overflow-x-auto rounded-[1.2rem] border border-slate-200/60">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-slate-200/60 bg-slate-50/80">
              <th className="p-3 text-left text-xs font-semibold text-slate-500">#</th>
              <th className="p-3 text-left text-xs font-semibold text-slate-500">Title</th>
              <th className="p-3 text-left text-xs font-semibold text-slate-500">Authors</th>
              <th className="p-3 text-center text-xs font-semibold text-slate-500">Year</th>
              <th className="p-3 text-left text-xs font-semibold text-slate-500">Source</th>
              <th className="p-3 text-center text-xs font-semibold text-slate-500">OA</th>
              <th className="p-3 text-center text-xs font-semibold text-slate-500">Score</th>
            </tr>
          </thead>
          <tbody>
            {papers.map((paper, idx) => (
              <tr
                key={paper.paper_id}
                className="border-b border-slate-200/40 bg-white/70 last:border-0 hover:bg-slate-50/60"
              >
                <td className="p-3 text-slate-400">{idx + 1}</td>
                <td className="max-w-[220px] p-3">
                  <p className="line-clamp-2 text-xs font-medium text-slate-800">{paper.title}</p>
                  {paper.venue && (
                    <p className="mt-0.5 line-clamp-1 text-[0.68rem] text-slate-500">{paper.venue}</p>
                  )}
                </td>
                <td className="max-w-[120px] p-3 text-xs text-slate-600">
                  {paper.authors.slice(0, 2).join(", ")}
                  {paper.authors.length > 2 ? " et al." : ""}
                </td>
                <td className="p-3 text-center text-xs text-slate-600">{paper.year ?? "—"}</td>
                <td className="p-3">
                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-200 bg-white px-2 text-[0.65rem] text-slate-600"
                  >
                    {paper.source}
                  </Badge>
                </td>
                <td className="p-3 text-center">
                  {paper.open_access ? (
                    <Check className="mx-auto size-3.5 text-emerald-500" />
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="p-3 text-center text-xs text-slate-600">
                  {paper.score != null ? (paper.score * 100).toFixed(0) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SynthesisGeneratingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
            Grounded synthesis
          </h3>
          <Badge variant="outline" className="rounded-full border-teal-200/40 bg-teal-50/50 px-2 py-0.5 text-xs text-teal-700">
            <Loader2 className="mr-1 size-3 animate-spin" />
            Generating…
          </Badge>
        </div>
        <div className="rounded-[1.4rem] border border-slate-900/10 bg-white/70 p-5 space-y-3">
          <Skeleton className="h-5 w-full bg-slate-300/40" />
          <Skeleton className="h-5 w-11/12 bg-slate-300/40" />
          <Skeleton className="h-5 w-4/5 bg-slate-300/40" />
          <p className="pt-1 text-xs text-slate-400">
            AI is reading the papers… results appear below while synthesis loads.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-4 w-32 bg-slate-300/40" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-[1.2rem] border border-slate-200/60 bg-white/70 p-4">
              <Skeleton className="h-8 w-8 rounded-lg bg-slate-300/40 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full bg-slate-300/40" />
                <Skeleton className="h-3 w-2/3 bg-slate-300/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SynthesisSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-40 bg-slate-300/40" />
          <Skeleton className="h-5 w-24 rounded-full bg-slate-300/40" />
        </div>
        <div className="rounded-[1.4rem] border border-slate-900/10 bg-white/70 p-5 space-y-3">
          <Skeleton className="h-5 w-full bg-slate-300/40" />
          <Skeleton className="h-5 w-full bg-slate-300/40" />
          <Skeleton className="h-5 w-4/5 bg-slate-300/40" />
        </div>
      </div>

      {/* Sources skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-32 bg-slate-300/40" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-[1.2rem] border border-slate-200/60 bg-white/70 p-4">
              <Skeleton className="h-8 w-8 rounded-lg bg-slate-300/40 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full bg-slate-300/40" />
                <Skeleton className="h-3 w-2/3 bg-slate-300/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TakeawaysSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex gap-3 rounded-[1.2rem] border border-slate-200/60 bg-white/70 p-4"
        >
          <Skeleton className="h-6 w-6 rounded-md bg-slate-300/40 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full bg-slate-300/40" />
            <Skeleton className="h-4 w-4/5 bg-slate-300/40" />
          </div>
        </div>
      ))}
    </div>
  );
}
