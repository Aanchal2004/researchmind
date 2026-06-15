"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Bell, Bookmark, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ResearchSearchBar } from "@/components/search/research-search-bar";

export function WorkspaceHeader() {
  return (
    <header className="workspace-shell sticky top-0 z-30 pt-4">
      <div className="flex items-center gap-3 rounded-[1.7rem] border border-white/10 bg-slate-950/78 px-3 py-3 shadow-[0_16px_40px_rgba(2,8,20,0.18)] backdrop-blur">
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-200 hover:bg-white/6 hover:text-white"
              >
                <Menu className="size-5" />
                <span className="sr-only">Open workspace navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[calc(100vw-1.5rem)] border-white/10 bg-[#061018] p-0 text-white"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Workspace navigation</SheetTitle>
                <SheetDescription>
                  Navigate between dashboard, search, library, and alerts.
                </SheetDescription>
              </SheetHeader>
              <AppSidebar mobile />
            </SheetContent>
          </Sheet>
        </div>

        <div className="min-w-0 flex-1">
          <Suspense fallback={<div className="h-10 rounded-xl bg-white/5" />}>
            <ResearchSearchBar
              compact
              className="border-0 bg-transparent p-0 shadow-none"
            />
          </Suspense>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
          >
            <Link href="/saved">
              <Bookmark className="size-4" />
              My library
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
          >
            <Link href="/alerts">
              <Bell className="size-4" />
              Alerts
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
