"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SearchMeta, ProviderReport } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type BackendHealth = {
  status: "ok" | "error" | "loading" | "unknown";
  service?: string;
  version?: string;
  environment?: string;
  timestamp?: string;
};

type Props = {
  lastMeta?: SearchMeta | null;
};

export function AgentsPage({ lastMeta }: Props) {
  const [health, setHealth] = useState<BackendHealth>({ status: "loading" });
  const [checking, setChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      const base =
        process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = (await res.json()) as {
          status: string;
          service?: string;
          version?: string;
          environment?: string;
          timestamp?: string;
        };
        setHealth({
          status: data.status === "ok" ? "ok" : "error",
          service: data.service,
          version: data.version,
          environment: data.environment,
          timestamp: data.timestamp,
        });
      } else {
        setHealth({ status: "error" });
      }
    } catch {
      setHealth({ status: "error" });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const providerReports = lastMeta?.provider_reports ?? [];

  return (
    <div className="space-y-5">
      <div className="panel p-5 sm:p-6">
        <div className="eyebrow">AI Platform</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          Agent Workflows
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Live diagnostics for the search pipeline, provider health, and planned AI agents.
        </p>
      </div>

      {/* Backend health */}
      <div className="panel p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Server className="size-4 text-slate-400" />
            <span className="text-sm font-medium text-white">Backend API</span>
          </div>
          <div className="flex items-center gap-2">
            <HealthBadge status={health.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={checking}
              className="rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
            >
              <RefreshCw className={cn("size-3.5", checking && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {health.status === "ok" && (
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Service", value: health.service ?? "—" },
              { label: "Version", value: health.version ?? "—" },
              { label: "Environment", value: health.environment ?? "—" },
              {
                label: "Last checked",
                value: health.timestamp
                  ? new Date(health.timestamp).toLocaleTimeString()
                  : new Date().toLocaleTimeString(),
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <dt className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-slate-500">{item.label}</dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-200">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {health.status === "error" && (
          <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-300" />
              <div>
                <p className="text-sm font-medium text-rose-200">Backend unreachable</p>
                <p className="mt-1 text-xs text-slate-400">
                  Start the FastAPI server with{" "}
                  <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs text-slate-300">
                    uvicorn app.main:app --reload
                  </code>{" "}
                  from the <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs text-slate-300">backend/</code> directory.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Provider diagnostics from last search */}
      <div className="panel p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="size-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Last search diagnostics</span>
          {lastMeta && (
            <Badge variant="outline" className="ml-auto rounded-full border-white/10 text-xs text-slate-400">
              {lastMeta.duration_ms}ms · {lastMeta.result_count} results
            </Badge>
          )}
        </div>

        {providerReports.length === 0 ? (
          <p className="text-sm text-slate-500">
            Run a search to see per-provider diagnostics here.
          </p>
        ) : (
          <div className="space-y-3">
            {providerReports.map((report) => (
              <ProviderCard key={report.source} report={report} />
            ))}
          </div>
        )}
      </div>

      {/* Planned agents */}
      <div className="panel p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bot className="size-4 text-slate-400" />
          <span className="text-sm font-medium text-white">Planned AI agents</span>
          <Badge variant="outline" className="ml-auto rounded-full border-amber-300/20 bg-amber-400/10 text-xs text-amber-300">
            Roadmap
          </Badge>
        </div>
        <div className="space-y-3">
          {[
            {
              name: "Literature Review Agent",
              description: "Synthesizes a full structured review across saved papers, organized by theme.",
              phase: "Phase 4",
            },
            {
              name: "Research Memory Agent",
              description: "Tracks your reading history and surfaces relevant context when you start a new search.",
              phase: "Phase 4",
            },
            {
              name: "Citation Graph Agent",
              description: "Builds a citation network graph from a seed paper to discover influential predecessors.",
              phase: "Phase 5",
            },
            {
              name: "Alert Digest Agent",
              description: "Runs scheduled queries against live databases and delivers personalized digests.",
              phase: "Phase 4",
            },
          ].map((agent) => (
            <div key={agent.name} className="flex items-start gap-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                <Bot className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-200">{agent.name}</span>
                  <Badge variant="outline" className="rounded-full border-violet-400/20 bg-violet-400/10 text-[0.65rem] text-violet-300">
                    {agent.phase}
                  </Badge>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{agent.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProviderCard({ report }: { report: ProviderReport }) {
  const [expanded, setExpanded] = useState(false);
  const ok = report.status === "ok";
  const partial = report.status === "partial";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02]"
      >
        <div className={cn("size-2 rounded-full shrink-0", ok ? "bg-emerald-400" : partial ? "bg-amber-400" : "bg-rose-400")} />
        <span className="flex-1 text-sm font-medium text-slate-200">{report.source}</span>
        <span className="text-xs text-slate-500">{report.served_count} results · {report.latency_ms}ms</span>
        <ProviderStatusBadge status={report.status} />
        <ChevronDown className={cn("size-3.5 text-slate-500 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="border-t border-white/8 px-4 py-3">
          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <MetaItem label="Strategy" value={report.query_strategy} />
            <MetaItem label="Requested" value={String(report.requested_limit)} />
            <MetaItem label="Served" value={String(report.served_count)} />
            <MetaItem label="Total available" value={report.total_results != null ? String(report.total_results) : "—"} />
            <MetaItem label="Latency" value={`${report.latency_ms}ms`} />
          </dl>
          {report.errors.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {report.errors.map((err, i) => (
                <div key={i} className="rounded-lg border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2 text-xs text-rose-200">
                  {err.code}: {err.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-600">{label}</dt>
      <dd className="mt-0.5 text-slate-300">{value}</dd>
    </div>
  );
}

function HealthBadge({ status }: { status: BackendHealth["status"] }) {
  if (status === "loading") return (
    <Badge variant="outline" className="gap-1.5 rounded-full border-slate-600 text-slate-400">
      <Clock className="size-3" /> Checking
    </Badge>
  );
  if (status === "ok") return (
    <Badge variant="outline" className="gap-1.5 rounded-full border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
      <Wifi className="size-3" /> Online
    </Badge>
  );
  return (
    <Badge variant="outline" className="gap-1.5 rounded-full border-rose-400/20 bg-rose-400/10 text-rose-300">
      <WifiOff className="size-3" /> Offline
    </Badge>
  );
}

function ProviderStatusBadge({ status }: { status: ProviderReport["status"] }) {
  if (status === "ok") return (
    <CheckCircle2 className="size-3.5 text-emerald-400" />
  );
  if (status === "partial") return (
    <AlertCircle className="size-3.5 text-amber-400" />
  );
  return <AlertCircle className="size-3.5 text-rose-400" />;
}
