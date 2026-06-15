"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, LibraryBig, Search, Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";

const mobileItems = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/saved", label: "Library", icon: LibraryBig },
  { href: "/alerts", label: "Alerts", icon: BellRing, badge: "3" },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-4 bottom-4 z-40 rounded-[1.7rem] border border-white/10 bg-slate-950/92 p-2 shadow-[0_18px_50px_rgba(2,8,20,0.32)] backdrop-blur lg:hidden"
    >
      <div className="grid grid-cols-4 gap-1">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/search"
              ? pathname.startsWith("/search") && !pathname.startsWith("/search/history")
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs text-slate-400",
                isActive && "bg-teal-400/12 text-teal-200",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
              {item.badge ? (
                <span className="absolute right-4 top-1 rounded-full bg-teal-400 px-1.5 text-[0.65rem] font-medium text-slate-950">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
