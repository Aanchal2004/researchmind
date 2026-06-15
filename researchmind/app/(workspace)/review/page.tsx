import Link from "next/link";
import { FileText, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Literature Review — ResearchMind" };

export default function ReviewPage() {
  return (
    <div className="space-y-5">
      <div className="panel p-5 sm:p-6">
        <div className="eyebrow">AI Features</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          Literature Review Builder
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Turn your saved papers into a structured, grounded literature review.
        </p>
      </div>

      <div className="panel p-8 sm:p-12 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-400/10 text-teal-200">
          <FileText className="size-9" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-white">Coming in Phase 4</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-400">
          The Literature Review Builder will let you select papers from your library, choose a structure (chronological, thematic, methodology), and generate a grounded review with citations.
        </p>
        <div className="mx-auto mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-2">
          {[
            "Select papers from library",
            "Thematic & chronological modes",
            "Extractive + generative summaries",
            "Export to Word / LaTeX / Markdown",
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-2.5 rounded-xl border border-teal-400/15 bg-teal-400/[0.06] px-3 py-2.5">
              <Sparkles className="size-3.5 shrink-0 text-teal-300" />
              <span className="text-sm text-slate-300">{feat}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110">
            <Link href="/saved">
              <Layers className="size-4" />
              View saved papers
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl border-white/10 bg-white/[0.04] text-slate-200">
            <Link href="/search">Search papers →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
