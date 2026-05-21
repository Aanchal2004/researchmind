"use client";

import { Search, SlidersHorizontal, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ResearchSearchBarProps = {
  placeholder?: string;
  buttonLabel?: string;
  compact?: boolean;
  showFilters?: boolean;
  className?: string;
};

export function ResearchSearchBar({
  placeholder = "Search papers, authors, topics...",
  buttonLabel = "Search",
  compact = false,
  showFilters = false,
  className,
}: ResearchSearchBarProps) {
  return (
    <form
      role="search"
      className={cn(
        "flex w-full items-center gap-2 rounded-[1.35rem] border border-white/12 bg-slate-950/70 p-2 shadow-[0_12px_40px_rgba(2,8,20,0.18)] backdrop-blur-sm",
        compact ? "rounded-xl p-1.5" : "p-2.5",
        className,
      )}
      onSubmit={(event) => event.preventDefault()}
    >
      <label htmlFor="research-search" className="sr-only">
        Search academic literature
      </label>
      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[calc(var(--radius)-0.15rem)] px-3">
        <Search className="size-5 text-slate-400" />
        <Input
          id="research-search"
          type="search"
          placeholder={placeholder}
          className={cn(
            "h-12 border-0 bg-transparent px-0 text-sm text-slate-50 shadow-none ring-0 placeholder:text-slate-500 focus-visible:ring-0 md:text-sm",
            compact && "h-10 text-[0.95rem]",
          )}
        />
      </div>
      {showFilters ? (
        <Button
          type="button"
          variant="ghost"
          size={compact ? "icon-sm" : "icon"}
          className="text-slate-300 hover:bg-white/6 hover:text-white"
          aria-label="Open filters"
        >
          <SlidersHorizontal className="size-4" />
        </Button>
      ) : null}
      <div className="hidden rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-400 md:block">
        ⌘K
      </div>
      <Button
        type="submit"
        size={compact ? "sm" : "lg"}
        className={cn(
          "rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] px-4 text-sm font-semibold text-slate-950 hover:brightness-110",
          compact && "h-10 px-3",
        )}
      >
        {compact ? <Sparkles className="size-4" /> : null}
        {buttonLabel}
      </Button>
    </form>
  );
}
