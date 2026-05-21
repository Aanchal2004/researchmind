"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRing,
  BookMarked,
  FolderKanban,
  Home,
  LibraryBig,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";

import { SiteLogo } from "@/components/branding/site-logo";
import { Button } from "@/components/ui/button";
import { workspaceNav } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const iconMap = {
  Dashboard: Home,
  Search,
  Library: LibraryBig,
  Collections: FolderKanban,
  Alerts: BellRing,
  Settings: Settings2,
} as const;

type AppSidebarProps = {
  mobile?: boolean;
};

export function AppSidebar({ mobile = false }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col justify-between bg-[linear-gradient(180deg,rgba(3,10,18,0.96)_0%,rgba(6,17,27,0.98)_100%)]",
        mobile
          ? "w-full rounded-none border-0"
          : "panel sticky top-4 h-[calc(100vh-2rem)] min-h-[44rem] w-[var(--sidebar-width)] p-4",
      )}
    >
      <div className="space-y-8">
        <SiteLogo compact={mobile} />
        <nav aria-label="Workspace" className="space-y-1.5">
          {workspaceNav.map((item) => {
            const Icon =
              iconMap[item.label as keyof typeof iconMap] ?? BookMarked;
            const isActive =
              item.href === "/search"
                ? pathname.startsWith("/search")
                : pathname.startsWith("/dashboard") && item.label === "Dashboard";

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-3 py-3 text-sm text-slate-300 outline-none hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-teal-400/60",
                  isActive && "bg-teal-400/12 text-teal-200 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.22)]",
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="size-4" />
                  {item.label}
                </span>
                {item.badge ? (
                  <span className="rounded-full bg-teal-400/15 px-2 py-0.5 text-xs text-teal-200">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4">
        <div className="rounded-[1.5rem] border border-teal-400/18 bg-teal-400/[0.07] p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-teal-400/12 p-2 text-teal-200">
              <Sparkles className="size-4" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-white">Upgrade to Pro</div>
              <p className="text-sm leading-6 text-slate-300/72">
                Unlock unlimited synthesis, richer alerts, and export-ready
                citation workflows.
              </p>
              <Button
                className="w-full rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110"
                size="sm"
              >
                Upgrade now
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-semibold text-white">
              AK
            </div>
            <div>
              <div className="text-sm font-medium text-white">Alex Kim</div>
              <div className="text-xs text-slate-400">alex.kim@university.edu</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
