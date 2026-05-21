import {
  ArrowUpRight,
  BellRing,
  Bookmark,
  CalendarRange,
  FolderOpenDot,
  MoreHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  collections,
  dashboardMetrics,
  recentPapers,
  topicAlerts,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const metricAccent = {
  teal: "from-teal-300/20 to-cyan-400/5 text-teal-200",
  violet: "from-violet-300/20 to-fuchsia-400/5 text-violet-200",
  amber: "from-amber-300/20 to-orange-400/5 text-amber-200",
} as const;

export function DashboardHome() {
  return (
    <div className="space-y-4">
      <section className="panel p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="eyebrow">Dashboard</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Good morning, Alex.
            </h1>
            <p className="mt-2 body-muted">
              Here&apos;s what&apos;s moving across your research workspace today.
            </p>
          </div>
          <div className="w-full max-w-xl">
            <div className="grid gap-3 sm:grid-cols-3">
              {dashboardMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className={cn(
                    "rounded-[1.5rem] border border-white/10 bg-gradient-to-br p-4",
                    metricAccent[metric.tone],
                  )}
                >
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {metric.label}
                  </div>
                  <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">
                    {metric.value}
                  </div>
                  <div className="mt-2 text-sm text-slate-300/78">{metric.change}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="library" className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent papers</h2>
            <p className="mt-1 text-sm text-slate-400">
              The latest additions across your reading flow.
            </p>
          </div>
          <Button variant="ghost" className="text-slate-300 hover:bg-white/6 hover:text-white">
            View all
            <ArrowUpRight className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          {recentPapers.map((paper) => (
            <article
              key={paper.title}
              className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <Badge
                  variant="outline"
                  className="rounded-full border-white/10 bg-white/[0.04] text-slate-200"
                >
                  {paper.source}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-slate-400 hover:bg-white/6 hover:text-white"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Paper options</span>
                </Button>
              </div>
              <h3 className="mt-5 text-lg font-semibold leading-7 text-white">
                {paper.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-300/74">
                {paper.authors}
              </p>
              <div className="mt-3 text-sm text-slate-500">
                {paper.year} · {paper.venue}
              </div>
              <div className="mt-5 flex items-center gap-4 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Bookmark className="size-4" />
                  View
                </span>
                <span className="inline-flex items-center gap-2">
                  <FolderOpenDot className="size-4" />
                  Add to collection
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="collections" className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Collections</h2>
            <p className="mt-1 text-sm text-slate-400">
              Organize literature into reusable thematic stacks.
            </p>
          </div>
          <Button variant="ghost" className="text-slate-300 hover:bg-white/6 hover:text-white">
            View all collections
            <ArrowUpRight className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4 xl:grid-cols-5 md:grid-cols-3 sm:grid-cols-2">
          {collections.map((collection) => (
            <article
              key={collection.name}
              className="rounded-[1.45rem] border border-white/8 bg-white/[0.03] p-4"
            >
              <div
                className={cn(
                  "mb-5 h-16 rounded-[1.1rem] bg-gradient-to-br",
                  collection.accent,
                )}
              />
              <h3 className="text-base font-semibold text-white">
                {collection.name}
              </h3>
              <p className="mt-1 text-sm text-slate-400">{collection.count}</p>
              <div className="mt-4 h-1.5 rounded-full bg-white/6">
                <div
                  className={cn(
                    "h-full w-[38%] rounded-full bg-gradient-to-r",
                    collection.accent,
                  )}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="alerts" className="panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Active topic alerts</h2>
            <p className="mt-1 text-sm text-slate-400">
              Keep an eye on fast-moving areas without refreshing five databases.
            </p>
          </div>
          <Button variant="ghost" className="text-slate-300 hover:bg-white/6 hover:text-white">
            Manage alerts
            <ArrowUpRight className="size-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {topicAlerts.map((alert) => (
            <article
              key={alert.topic}
              className="flex flex-col gap-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 items-start gap-4">
                <div className={cn("rounded-2xl p-3", alert.accent)}>
                  <BellRing className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{alert.topic}</h3>
                  <p className="mt-1 text-sm text-slate-400">{alert.description}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-sm text-slate-300 md:flex-row md:items-center">
                <span className="inline-flex items-center gap-2">
                  <CalendarRange className="size-4 text-slate-500" />
                  {alert.frequency}
                </span>
                <Badge
                  variant="outline"
                  className="w-fit rounded-full border-white/10 bg-white/[0.04] text-slate-200"
                >
                  {alert.updates}
                </Badge>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
