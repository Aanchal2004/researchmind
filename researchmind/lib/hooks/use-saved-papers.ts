"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import {
  apiListSavedPapers,
  apiSavePaper,
  apiUnsavePaper,
} from "@/lib/api/library";
import {
  loadSavedPapers,
  persistSavedPapers,
  subscribeSavedPapers,
} from "@/lib/saved-papers";
import type { SearchResultItem } from "@/lib/api/types";

/**
 * Unified saved-papers hook.
 * - Authenticated: reads/writes via backend → Supabase
 * - Anonymous: reads/writes via localStorage (existing behaviour)
 */
export function useSavedPapers() {
  const { user, isLoading: authLoading } = useAuth();
  const [papers, setPapers] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load papers from the right source whenever auth state changes.
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      setIsLoading(true);
      apiListSavedPapers()
        .then(setPapers)
        .catch(() => setPapers(loadSavedPapers())) // graceful fallback
        .finally(() => setIsLoading(false));
    } else {
      setPapers(loadSavedPapers());
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Keep localStorage in sync for cross-tab updates when anonymous.
  useEffect(() => {
    if (user) return;
    return subscribeSavedPapers(() => setPapers(loadSavedPapers()));
  }, [user]);

  const savePaper = useCallback(
    async (paper: SearchResultItem) => {
      if (user) {
        await apiSavePaper(paper);
        setPapers((prev) =>
          prev.some((p) => p.paper_id === paper.paper_id)
            ? prev
            : [paper, ...prev],
        );
      } else {
        setPapers((prev) => {
          const next = prev.some((p) => p.paper_id === paper.paper_id)
            ? prev
            : [paper, ...prev];
          persistSavedPapers(next);
          return next;
        });
      }
    },
    [user],
  );

  const unsavePaper = useCallback(
    async (paperId: string) => {
      if (user) {
        await apiUnsavePaper(paperId);
        setPapers((prev) => prev.filter((p) => p.paper_id !== paperId));
      } else {
        setPapers((prev) => {
          const next = prev.filter((p) => p.paper_id !== paperId);
          persistSavedPapers(next);
          return next;
        });
      }
    },
    [user],
  );

  const togglePaper = useCallback(
    async (paper: SearchResultItem) => {
      const isSaved = papers.some((p) => p.paper_id === paper.paper_id);
      if (isSaved) {
        await unsavePaper(paper.paper_id);
      } else {
        await savePaper(paper);
      }
    },
    [papers, savePaper, unsavePaper],
  );

  const savedPaperIds = new Set(papers.map((p) => p.paper_id));

  return { papers, savedPaperIds, isLoading, savePaper, unsavePaper, togglePaper };
}
