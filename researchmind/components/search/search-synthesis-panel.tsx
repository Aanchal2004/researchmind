import { Copy, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SearchResponse } from "@/lib/api/types";

type SearchSynthesisPanelProps = {
  data: SearchResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
};

export function SearchSynthesisPanel({
  data,
  isLoading,
  errorMessage,
}: SearchSynthesisPanelProps) {
  const synthesis = data?.synthesis;

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
            <PanelMessage
              body="The retrieval request failed, so synthesis content could not be refreshed."
            />
          ) : !data ? (
            <PanelMessage body="Run a search to populate the synthesis panel with live backend data." />
          ) : (
            <>
              <div className="space-y-5 font-mono text-[1rem] leading-9 text-slate-800">
                <p>{synthesis?.summary}</p>
              </div>

              <div className="rounded-[1.4rem] border border-slate-900/10 bg-white/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Sources
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 bg-white text-slate-700"
                    >
                      <Copy className="size-4" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110"
                    >
                      <Download className="size-4" />
                      Export
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 text-sm leading-7 text-slate-700">
                  {(synthesis?.sources.length ? synthesis.sources : data.results.map((result) => result.paper_id))
                    .map((sourceId, index) => {
                      const paper = data.results.find((result) => result.paper_id === sourceId);
                      const sourceLabel = paper
                        ? `[${index + 1}] ${paper.title} — ${paper.authors.join(", ")}${paper.year ? ` (${paper.year})` : ""}.`
                        : sourceId;

                      return (
                        <div
                          key={sourceId}
                          className="rounded-[1rem] border border-slate-200/80 bg-white/70 px-4 py-3"
                        >
                          {sourceLabel}
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="takeaways" className="space-y-3">
          {isLoading ? (
            <TakeawaysSkeleton />
          ) : !data ? (
            <PanelMessage body="Key takeaways will appear here after a live search completes." />
          ) : (
            (synthesis?.highlights ?? []).map((item) => (
              <div
                key={item}
                className="rounded-[1.3rem] border border-slate-900/10 bg-white/70 px-4 py-4 text-sm leading-7 text-slate-700"
              >
                {item}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="table" className="space-y-3">
          <div className="rounded-[1.4rem] border border-slate-900/10 bg-white/70 p-4 text-sm text-slate-700">
            Comparison view remains scaffolded for benchmark, dataset, and method tables.
          </div>
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

function SynthesisSkeleton() {
  return (
    <>
      <div className="space-y-4">
        <Skeleton className="h-5 w-full bg-slate-300/40" />
        <Skeleton className="h-5 w-full bg-slate-300/40" />
        <Skeleton className="h-5 w-5/6 bg-slate-300/40" />
      </div>
      <div className="rounded-[1.4rem] border border-slate-900/10 bg-white/70 p-4">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full bg-slate-300/40" />
          <Skeleton className="h-10 w-full bg-slate-300/40" />
          <Skeleton className="h-10 w-full bg-slate-300/40" />
        </div>
      </div>
    </>
  );
}

function TakeawaysSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-20 rounded-[1.3rem] bg-slate-300/40"
        />
      ))}
    </>
  );
}
