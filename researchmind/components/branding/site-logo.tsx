import Link from "next/link";

import { cn } from "@/lib/utils";

type SiteLogoProps = {
  className?: string;
  href?: string;
  compact?: boolean;
};

export function SiteLogo({
  className,
  href = "/",
  compact = false,
}: SiteLogoProps) {
  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className={cn("size-10 shrink-0 text-primary", compact && "size-8")}
        fill="none"
      >
        <path
          d="M24 4 41 14v20L24 44 7 34V14L24 4Z"
          className="fill-current/10 stroke-current"
          strokeWidth="1.5"
        />
        <path
          d="M16 18.5 24 14l8 4.5-8 4.5-8-4.5Z"
          className="stroke-current"
          strokeWidth="1.5"
        />
        <path
          d="M16 25.5 24 30l8-4.5M16 25.5V18.5M32 25.5V18.5"
          className="stroke-current"
          strokeWidth="1.5"
        />
        <path
          d="M16 25.5V31l8 4.5 8-4.5v-5.5"
          className="stroke-current"
          strokeWidth="1.5"
        />
      </svg>
      <div>
        <div className="text-lg font-semibold tracking-[0.22em] text-white">
          RESEARCHMIND
        </div>
        <div className="text-[0.68rem] uppercase tracking-[0.28em] text-slate-400">
          Research Assistant
        </div>
      </div>
    </div>
  );

  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
    >
      {content}
    </Link>
  );
}
