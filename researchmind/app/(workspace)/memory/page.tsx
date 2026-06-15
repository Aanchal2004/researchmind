import Link from "next/link";
import { BrainCircuit, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Research Memory — ResearchMind" };

export default function MemoryPage() {
  return (
    <div className="space-y-5">
      <div className="panel p-5 sm:p-6">
        <div className="eyebrow">AI Features</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          Research Memory
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          An intelligent layer that tracks your research patterns and surfaces relevant context.
        </p>
      </div>

      <div className="panel p-8 sm:p-12 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-400/10 text-violet-200">
          <BrainCircuit className="size-9" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-white">Coming in Phase 4</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-400">
          Research Memory will remember what you&apos;ve read, surface relevant saved papers when you start a new search, and help you avoid re-reading papers you&apos;ve already assessed.
        </p>
        <div className="mx-auto mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-2">
          {[
            "Reading history timeline",
            "Context-aware search hints",
            "Cross-session continuity",
            "Semantic similarity matching",
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-2.5 rounded-xl border border-violet-400/15 bg-violet-400/[0.06] px-3 py-2.5">
              <Sparkles className="size-3.5 shrink-0 text-violet-300" />
              <span className="text-sm text-slate-300">{feat}</span>
            </div>
          ))}
        </div>
        <Button asChild variant="outline" className="mt-8 rounded-xl border-white/10 bg-white/[0.04] text-slate-200">
          <Link href="/search">Go to search →</Link>
        </Button>
      </div>
    </div>
  );
}
