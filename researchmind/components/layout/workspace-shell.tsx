import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { WorkspaceHeader } from "@/components/layout/workspace-header";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className="pb-28 lg:pb-8">
      <WorkspaceHeader />
      <div className="workspace-shell mt-4 flex gap-4">
        <div className="hidden lg:block">
          <AppSidebar />
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
