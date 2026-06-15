"use client";

import { useEffect, useState } from "react";
import { AgentsPage } from "@/components/agents/agents-page";
import { loadLastSearchMeta } from "@/lib/last-search-meta";
import type { SearchMeta } from "@/lib/api/types";

export default function Agents() {
  const [lastMeta, setLastMeta] = useState<SearchMeta | null>(null);

  useEffect(() => {
    setLastMeta(loadLastSearchMeta());
  }, []);

  return <AgentsPage lastMeta={lastMeta} />;
}
