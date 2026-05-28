import { Suspense } from "react";

import { SearchPageShell } from "@/components/search/search-page-shell";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="panel min-h-[32rem]" />}>
      <SearchPageShell />
    </Suspense>
  );
}
