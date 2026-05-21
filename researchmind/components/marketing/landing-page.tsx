import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Database,
  FileText,
  SearchCheck,
} from "lucide-react";

import { SiteLogo } from "@/components/branding/site-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { landingFeatures, featuredSources, workflowSteps } from "@/lib/mock-data";
import { ResearchSearchBar } from "@/components/search/research-search-bar";

const featureIcons = [SearchCheck, Bot, FileText];

export function LandingPage() {
  return (
    <div className="pb-12">
      <header className="page-shell pt-5">
        <div className="panel flex items-center justify-between px-5 py-4">
          <SiteLogo />
          <nav
            aria-label="Marketing"
            className="hidden items-center gap-8 text-sm text-slate-300 lg:flex"
          >
            <Link href="#features" className="hover:text-white">
              Features
            </Link>
            <Link href="#databases" className="hover:text-white">
              Databases
            </Link>
            <Link href="#pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="#about" className="hover:text-white">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="hidden text-slate-200 hover:bg-white/6 hover:text-white sm:inline-flex"
            >
              <Link href="/dashboard">Sign in</Link>
            </Button>
            <Button
              asChild
              className="rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] px-4 text-slate-950 hover:brightness-110"
            >
              <Link href="/search">Try free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="page-shell space-y-16 pt-10 sm:space-y-20 sm:pt-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(2,8,20,0.94)_0%,rgba(5,18,28,0.94)_100%)] px-6 py-12 shadow-[0_32px_90px_rgba(2,8,20,0.26)] sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
          <div className="mx-auto max-w-5xl text-center">
            <Badge
              variant="outline"
              className="mb-6 rounded-full border-teal-400/20 bg-teal-400/8 px-4 py-1 text-teal-200"
            >
              Modern research workflow for academic teams
            </Badge>
            <h1 className="section-title mx-auto max-w-4xl">
              Research at the speed of thought.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300/78 sm:text-lg">
              Find, understand, and organize the world&apos;s research with a
              dark-first workspace built for synthesis, citations, and calm
              information density.
            </p>

            <div className="mx-auto mt-10 max-w-4xl">
              <ResearchSearchBar
                placeholder="Ask anything or search the literature..."
                buttonLabel="Start searching"
                className="bg-white/[0.03]"
              />
            </div>

            <div id="databases" className="mt-10">
              <div className="mb-5 flex items-center justify-center gap-4">
                <span className="h-px flex-1 max-w-28 bg-white/10" />
                <span className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  Search across 5 databases
                </span>
                <span className="h-px flex-1 max-w-28 bg-white/10" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-200">
                {featuredSources.map((source) => (
                  <div
                    key={source}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2"
                  >
                    {source}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="eyebrow">Foundation</div>
              <h2 className="mt-3 font-heading text-3xl tracking-[-0.04em] text-white sm:text-4xl">
                Reusable surfaces for discovery, synthesis, and citation work.
              </h2>
            </div>
            <p className="max-w-xl body-muted">
              The interface borrows the editorial calm of Notion, the density of
              Perplexity, and the precision of Linear without losing an academic
              reading rhythm.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {landingFeatures.map((feature, index) => {
              const Icon = featureIcons[index];

              return (
                <article key={feature.title} className="panel p-6">
                  <div className="mb-6 flex size-14 items-center justify-center rounded-[1.4rem] bg-teal-400/10 text-teal-200">
                    <Icon className="size-7" />
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-medium tracking-[0.24em] text-slate-500">
                      0{index + 1}
                    </div>
                    <h3 className="font-heading text-3xl tracking-[-0.04em] text-white">
                      {feature.title}
                    </h3>
                    <p className="body-muted">{feature.description}</p>
                    <Link
                      href="/search"
                      className="inline-flex items-center gap-2 text-sm font-medium text-teal-200"
                    >
                      {feature.cta}
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="panel p-6 sm:p-8">
            <div className="eyebrow">Workflow</div>
            <h2 className="mt-3 font-heading text-3xl tracking-[-0.04em] text-white sm:text-4xl">
              Structured around how literature review actually happens.
            </h2>
            <div className="mt-8 grid gap-4">
              {workflowSteps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-5"
                >
                  <div className="text-sm font-medium tracking-[0.18em] text-teal-200">
                    {item.step}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 body-muted">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel flex flex-col justify-between p-6 sm:p-8" id="about">
            <div>
              <div className="eyebrow">Why it works</div>
              <h2 className="mt-3 font-heading text-3xl tracking-[-0.04em] text-white">
                Built for high-signal reading, not generic AI chat.
              </h2>
              <p className="mt-4 body-muted">
                The foundation supports dense metadata, grounded synthesis, and
                export-ready workflows without overwhelming the reader. Every
                surface is intended to be reusable as the product grows.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3 text-white">
                  <Database className="size-5 text-teal-200" />
                  Unified research sources
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300/72">
                  Normalize metadata, source confidence, and citation context in
                  one place.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3 text-white">
                  <Bot className="size-5 text-teal-200" />
                  Grounded synthesis panes
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300/72">
                  Summary surfaces keep claims linked to sources so the UI stays
                  useful for actual academic decision-making.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="panel flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="max-w-2xl">
            <div className="eyebrow">Ready to explore</div>
            <h2 className="mt-3 font-heading text-3xl tracking-[-0.04em] text-white sm:text-4xl">
              Start with the search workspace, then grow into collections and alerts.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] px-5 text-slate-950 hover:brightness-110"
            >
              <Link href="/search">Open search shell</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08]"
            >
              <Link href="/dashboard">View dashboard</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
