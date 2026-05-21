import {
  ArrowUpRight,
  Bookmark,
  Copy,
  Download,
  ExternalLink,
  ListFilter,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  searchFilters,
  searchResults,
  synthesisHighlights,
  synthesisSources,
} from "@/lib/mock-data";

export function SearchPageShell() {
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
                Search five academic sources, compare findings, and move from
                retrieval to synthesis without leaving the page.
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
            {searchFilters.map((filter) => (
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
          <div className="border-b border-white/10 xl:border-r xl:border-b-0">
            <div className="flex items-center justify-between px-5 py-4 text-sm text-slate-400 sm:px-6">
              <span>847 results from 5 databases</span>
              <span>Sorted by relevance</span>
            </div>
            <div className="space-y-3 px-3 pb-3 sm:px-4 sm:pb-4">
              {searchResults.map((paper, index) => (
                <article
                  key={paper.title}
                  className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(6,18,28,0.92)_0%,rgba(9,24,35,0.96)_100%)] p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex gap-3 sm:w-20 sm:flex-col">
                      <span className="text-sm text-slate-400">{index + 1}</span>
                      <div className="rounded-xl bg-teal-400/12 px-3 py-2 text-center">
                        <div className="text-lg font-semibold text-teal-200">
                          {paper.score}
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
                            <span className="text-sm text-slate-500">
                              {paper.year} · {paper.venue}
                            </span>
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
                        {paper.authors}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-300/78">
                        {paper.summary}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {paper.tags?.map((tag) => (
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
                        <span className="inline-flex items-center gap-2">
                          View PDF
                          <ExternalLink className="size-4" />
                        </span>
                        <span className="inline-flex items-center gap-2">
                          Open synthesis
                          <ArrowUpRight className="size-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

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
                <div className="space-y-5 font-mono text-[1rem] leading-9 text-slate-800">
                  <p>
                    Diffusion models have emerged as a powerful paradigm for 3D
                    molecular generation, particularly in structure-based settings.
                    These models iteratively denoise simple priors into valid
                    structures while preserving geometric constraints [1][2].
                  </p>
                  <p>
                    Recent advances incorporate SE(3)-equivariance to improve
                    rotational and translational consistency, leading to better
                    generalization and more physically plausible samples [2][3].
                    Conditioning on protein pockets further increases the
                    likelihood of functionally relevant molecules [1][4][5].
                  </p>
                  <p>
                    Across QM9, GEOM-drugs, and CrossDocked benchmarks,
                    diffusion-based approaches outperform older generative methods
                    on validity, uniqueness, and binding affinity, although
                    sampling efficiency remains an open challenge.
                  </p>
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
                    {synthesisSources.map((source) => (
                      <div
                        key={source}
                        className="rounded-[1rem] border border-slate-200/80 bg-white/70 px-4 py-3"
                      >
                        {source}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="takeaways" className="space-y-3">
                {synthesisHighlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.3rem] border border-slate-900/10 bg-white/70 px-4 py-4 text-sm leading-7 text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="table" className="space-y-3">
                <div className="rounded-[1.4rem] border border-slate-900/10 bg-white/70 p-4 text-sm text-slate-700">
                  Comparison view is scaffolded here for benchmark, dataset, and
                  conditioning-method tables.
                </div>
              </TabsContent>

              <TabsContent value="mindmap" className="space-y-3">
                <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
                  Mind map placeholder for concept clustering and paper lineage.
                </div>
              </TabsContent>
            </Tabs>
          </div>
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
