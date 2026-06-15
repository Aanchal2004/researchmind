"use client";

import { useCallback } from "react";
import { useAuth } from "@/lib/auth/context";
import { apiAddHistory } from "@/lib/api/library";
import { addSearchHistoryEntry } from "@/lib/search-history";

/**
 * Returns an `addEntry` function that writes to Supabase when authed,
 * localStorage otherwise.
 */
export function useSearchHistory() {
  const { user } = useAuth();

  const addEntry = useCallback(
    (query: string, meta: { resultCount: number; sourcesQueried: string[] }) => {
      if (user) {
        // Fire-and-forget — don't block search UX on history write.
        apiAddHistory(query, meta.resultCount, meta.sourcesQueried).catch(
          () => {
            // Silently fall back to localStorage on error.
            addSearchHistoryEntry(query, meta);
          },
        );
      } else {
        addSearchHistoryEntry(query, meta);
      }
    },
    [user],
  );

  return { addEntry };
}
