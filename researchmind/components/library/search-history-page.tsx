"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, History, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearSearchHistory,
  deleteSearchHistoryEntry,
  groupEntriesByDate,
  loadSearchHistory,
  type SearchHistoryEntry,
} from "@/lib/search-history";

export function SearchHistoryPage() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHistory(loadSearchHistory());
  }, []);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return q ? history.filter((e) => e.query.toLowerCase().includes(q)) : history;
  }, [history, filter]);

  const groups = useMemo(() => groupEntriesByDate(filtered), [filtered]);

  const removeEntry = (id: string) => {
    deleteSearchHistoryEntry(id);
    setHistory(loadSearchHistory());
  };

  const clearAll = () => {
    clearSearchHistory();
    setHistory([]);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      <div className="panel p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Library</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Search history
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {history.length} queries stored locally on this device.
            </p>
          </div>
          {history.length > 0 && (
            <Button
              onClick={clearAll}
              variant="outline"
              className="rounded-xl border-rose-500/20 bg-rose-500/[0.06] text-rose-200 hover:bg-rose-500/10"
            >
              <Trash2 className="size-4" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="panel p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter history..."
              className="rounded-xl border-white/10 bg-white/[0.04] pl-9 text-slate-100"
            />
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="panel p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-400/10 text-teal-200">
            <History className="size-7" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-white">No search history yet</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-400">
            Your search queries will appear here once you start searching.
          </p>
          <Button asChild className="mt-8 rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110">
            <Link href="/search">
              <Search className="size-4" />
              Start searching
            </Link>
          </Button>
        </div>
      ) : groups.length === 0 ? (
        <div className="panel p-12 text-center">
          <p className="text-white">No results for &ldquo;{filter}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.label} className="panel p-5">
              <div className="mb-3 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-slate-500">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.04]"
                  >
                    <Clock className="size-3.5 shrink-0 text-slate-600" />
                    <Link
                      href={`/search?q=${encodeURIComponent(entry.query)}`}
                      className="min-w-0 flex-1 truncate text-sm text-slate-300 hover:text-white"
                    >
                      {entry.query}
                    </Link>
                    <span className="shrink-0 text-xs text-slate-600">{formatTime(entry.timestamp)}</span>
                    {entry.resultCount != null && (
                      <span className="hidden shrink-0 text-xs text-slate-600 sm:block">
                        {entry.resultCount} results
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="shrink-0 rounded-md p-1 text-slate-600 opacity-0 hover:text-rose-300 group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
