"use client";

import { useEffect, useState } from "react";
import { ListFilter } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DEFAULT_SEARCH_SOURCES,
  parseSearchFilters,
  SEARCH_SOURCE_OPTIONS,
  type SearchSourceId,
} from "@/lib/search-filters";
import { cn } from "@/lib/utils";

type DraftFilters = {
  sources: SearchSourceId[];
  open_access_only: boolean;
  year_from: string;
  year_to: string;
};

function toDraft(searchParams: URLSearchParams): DraftFilters {
  const parsed = parseSearchFilters(searchParams);

  return {
    sources: parsed.sources as SearchSourceId[],
    open_access_only: parsed.open_access_only,
    year_from: parsed.year_from?.toString() ?? "",
    year_to: parsed.year_to?.toString() ?? "",
  };
}

export function SearchFiltersSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftFilters>(() => toDraft(searchParams));

  useEffect(() => {
    if (!open) {
      setDraft(toDraft(searchParams));
    }
  }, [open, searchParams]);

  const toggleSource = (sourceId: SearchSourceId) => {
    setDraft((current) => {
      const isSelected = current.sources.includes(sourceId);
      const nextSources = isSelected
        ? current.sources.filter((source) => source !== sourceId)
        : [...current.sources, sourceId];

      return {
        ...current,
        sources: nextSources.length > 0 ? nextSources : [...DEFAULT_SEARCH_SOURCES],
      };
    });
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("sources", draft.sources.join(","));
    params.set("oa", draft.open_access_only ? "1" : "0");

    if (draft.year_from.trim()) {
      params.set("year_from", draft.year_from.trim());
    } else {
      params.delete("year_from");
    }

    if (draft.year_to.trim()) {
      params.set("year_to", draft.year_to.trim());
    } else {
      params.delete("year_to");
    }

    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  const resetFilters = () => {
    setDraft({
      sources: [...DEFAULT_SEARCH_SOURCES],
      open_access_only: true,
      year_from: "",
      year_to: "",
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="rounded-full border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
        >
          <ListFilter className="size-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="border-white/10 bg-[#07131d] text-slate-100"
      >
        <SheetHeader>
          <SheetTitle className="text-white">Search filters</SheetTitle>
          <SheetDescription className="text-slate-400">
            Control which providers and constraints are sent to the live search API.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4">
          <div>
            <div className="text-sm font-medium text-white">Sources</div>
            <p className="mt-1 text-xs text-slate-400">
              Select one or more academic databases to query in parallel.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SEARCH_SOURCE_OPTIONS.map((option) => {
                const isSelected = draft.sources.includes(option.id);

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleSource(option.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      isSelected
                        ? "border-teal-300/30 bg-teal-400/12 text-teal-100"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-white">Access</div>
            <button
              type="button"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  open_access_only: !current.open_access_only,
                }))
              }
              className={cn(
                "mt-3 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors",
                draft.open_access_only
                  ? "border-teal-300/30 bg-teal-400/10 text-teal-100"
                  : "border-white/10 bg-white/[0.03] text-slate-300",
              )}
            >
              <span>Open access only</span>
              <span className="text-xs uppercase tracking-[0.2em]">
                {draft.open_access_only ? "On" : "Off"}
              </span>
            </button>
          </div>

          <div>
            <div className="text-sm font-medium text-white">Publication year</div>
            <p className="mt-1 text-xs text-slate-400">
              Optional range applied after retrieval.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs text-slate-400" htmlFor="year-from">
                  From
                </label>
                <Input
                  id="year-from"
                  inputMode="numeric"
                  placeholder="2018"
                  value={draft.year_from}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      year_from: event.target.value,
                    }))
                  }
                  className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs text-slate-400" htmlFor="year-to">
                  To
                </label>
                <Input
                  id="year-to"
                  inputMode="numeric"
                  placeholder="2026"
                  value={draft.year_to}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      year_to: event.target.value,
                    }))
                  }
                  className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="gap-2 sm:flex-col">
          <Button
            onClick={applyFilters}
            className="w-full rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110"
          >
            Apply filters
          </Button>
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              className="flex-1 rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
            >
              Reset
            </Button>
            <SheetClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 rounded-xl text-slate-300 hover:bg-white/6 hover:text-white"
              >
                Cancel
              </Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
