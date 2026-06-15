"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BellRing,
  BookMarked,
  Bot,
  BrainCircuit,
  ChevronDown,
  FileText,
  FolderKanban,
  History,
  Home,
  LibraryBig,
  LogIn,
  LogOut,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";

import { SiteLogo } from "@/components/branding/site-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  children?: { href: string; label: string; icon: React.ElementType }[];
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  {
    href: "/saved",
    label: "Library",
    icon: LibraryBig,
    children: [
      { href: "/saved", label: "Saved papers", icon: BookMarked },
      { href: "/collections", label: "Collections", icon: FolderKanban },
      { href: "/search/history", label: "Search history", icon: History },
    ],
  },
  { href: "/alerts", label: "Alerts", icon: BellRing, badge: "3" },
  { href: "/settings", label: "Settings", icon: Settings2 },
  { href: "/memory", label: "Research Memory", icon: BrainCircuit },
  { href: "/review", label: "Literature Review", icon: FileText },
  { href: "/agents", label: "Agent Workflows", icon: Bot },
];

type AppSidebarProps = {
  mobile?: boolean;
};

function isPathActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function AppSidebar({ mobile = false }: AppSidebarProps) {
  const pathname = usePathname();

  const libraryActive =
    pathname.startsWith("/saved") ||
    pathname.startsWith("/collections") ||
    pathname.startsWith("/search/history");

  const [libraryOpen, setLibraryOpen] = useState(libraryActive);
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col justify-between bg-[linear-gradient(180deg,rgba(3,10,18,0.96)_0%,rgba(6,17,27,0.98)_100%)]",
        mobile
          ? "w-full rounded-none border-0"
          : "panel sticky top-4 h-[calc(100vh-2rem)] min-h-[44rem] w-[var(--sidebar-width)] overflow-y-auto p-4",
      )}
    >
      <div className="space-y-6">
        <SiteLogo compact={mobile} />
        <nav aria-label="Workspace" className="space-y-0.5">
          {navItems.map((item) => {
            if (item.children) {
              const isOpen = libraryOpen;
              const isAnyChildActive = item.children.some((c) => isPathActive(c.href, pathname));
              const Icon = item.icon;

              return (
                <div key={item.href}>
                  <button
                    type="button"
                    onClick={() => setLibraryOpen((v) => !v)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm text-slate-300 outline-none hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-teal-400/60",
                      isAnyChildActive && "bg-teal-400/8 text-teal-200",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="size-4" />
                      {item.label}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-3.5 text-slate-500 transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/8 pl-3">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const active = isPathActive(child.href, pathname);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/[0.05] hover:text-white",
                              active && "bg-teal-400/12 text-teal-200 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.22)]",
                            )}
                          >
                            <ChildIcon className="size-3.5" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;
            const active = isPathActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-3 py-3 text-sm text-slate-300 outline-none hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-teal-400/60",
                  active && "bg-teal-400/12 text-teal-200 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.22)]",
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

      <div className="mt-6 space-y-3">
        <div className="rounded-[1.5rem] border border-teal-400/18 bg-teal-400/[0.07] p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-teal-400/12 p-2 text-teal-200">
              <Sparkles className="size-4" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-white">Upgrade to Pro</div>
              <p className="text-sm leading-6 text-slate-300/72">
                Unlock unlimited synthesis, richer alerts, and export-ready citation workflows.
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

        {user ? (
          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-teal-500/20 text-sm font-semibold text-teal-300">
                {user.email?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{user.email}</div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="size-3" /> Sign out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-[1.35rem] border border-teal-500/20 bg-teal-500/[0.06] p-3 text-sm text-teal-300 hover:bg-teal-500/[0.10] transition-colors"
          >
            <LogIn className="size-4" />
            Sign in to sync your library
          </Link>
        )}
      </div>
    </aside>
  );
}
