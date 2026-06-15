"use client";

import { useEffect, useState } from "react";
import {
  BellOff,
  BellRing,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createAlert,
  deleteAlert,
  loadAlerts,
  subscribeAlerts,
  toggleAlertStatus,
  type ResearchAlert,
} from "@/lib/alerts";
import { cn } from "@/lib/utils";

const ACCENT_MAP: Record<string, string> = {
  "default-diffusion": "text-teal-300 bg-teal-400/10 border-teal-400/20",
  "default-protein": "text-violet-300 bg-violet-400/10 border-violet-400/20",
  "default-llm": "text-amber-300 bg-amber-400/10 border-amber-400/20",
};

export function AlertsPage() {
  const [alerts, setAlerts] = useState<ResearchAlert[]>([]);
  const [mounted, setMounted] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAlerts(loadAlerts());
    return subscribeAlerts(() => setAlerts(loadAlerts()));
  }, []);

  const handleCreate = () => {
    if (!newTopic.trim()) return;
    createAlert(newTopic.trim(), { description: newDesc.trim() });
    setNewTopic("");
    setNewDesc("");
    setOpen(false);
  };

  const totalNew = alerts.reduce((sum, a) => sum + a.newCount, 0);
  const activeCount = alerts.filter((a) => a.status === "active").length;

  if (!mounted) return null;

  return (
    <div className="space-y-5">
      <div className="panel p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Research</div>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Alerts
              {totalNew > 0 && (
                <span className="rounded-full border border-teal-300/20 bg-teal-400/10 px-3 py-0.5 text-base font-medium text-teal-200">
                  {totalNew} new
                </span>
              )}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {activeCount} active · {alerts.length} total. Alerts will query your selected sources on a schedule.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110">
                <Plus className="size-4" />
                New alert
              </Button>
            </DialogTrigger>
            <DialogContent className="border-white/10 bg-[#07131d] text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-white">New research alert</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Enter a topic or keyword to monitor. ResearchMind will notify you when new papers match.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Topic or keyword (e.g. Diffusion Models)"
                  className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100"
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                />
                <Input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={!newTopic.trim()}
                  className="rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110"
                >
                  Create alert
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="panel p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-400/10 text-teal-200">
            <BellRing className="size-7" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-white">No alerts yet</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-400">
            Create alerts for research topics to be notified when new papers are published.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onToggle={() => toggleAlertStatus(alert.id)}
              onDelete={() => deleteAlert(alert.id)}
            />
          ))}
        </div>
      )}

      {/* Coming soon note */}
      <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] p-5">
        <div className="flex items-start gap-3">
          <Zap className="size-4 mt-0.5 shrink-0 text-amber-300" />
          <div>
            <p className="text-sm font-medium text-amber-200">Alert delivery coming soon</p>
            <p className="mt-1 text-sm text-amber-200/60">
              Email and in-app alert delivery requires backend scheduling (planned in Phase 4). Alerts created here are stored locally and will be wired up automatically when the feature ships.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  onToggle,
  onDelete,
}: {
  alert: ResearchAlert;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const accentClass = ACCENT_MAP[alert.id] ?? "text-teal-300 bg-teal-400/10 border-teal-400/20";
  const isPaused = alert.status === "paused";

  return (
    <article className="panel flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("rounded-2xl border px-3 py-1.5 text-sm font-medium", accentClass)}>
          {alert.topic}
        </div>
        <div className="flex items-center gap-1.5">
          {alert.newCount > 0 && (
            <span className="rounded-full bg-teal-400/15 px-2 py-0.5 text-xs font-medium text-teal-200">
              {alert.newCount} new
            </span>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/6 hover:text-white"
            title={isPaused ? "Resume alert" : "Pause alert"}
          >
            {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/6 hover:text-rose-300"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {alert.description && (
        <p className="text-sm leading-6 text-slate-400">{alert.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge
          variant="outline"
          className={cn(
            "rounded-full border",
            isPaused
              ? "border-slate-600 text-slate-500"
              : "border-emerald-400/20 text-emerald-300",
          )}
        >
          {isPaused ? (
            <><BellOff className="size-3 mr-1" /> Paused</>
          ) : (
            <><BellRing className="size-3 mr-1" /> Active</>
          )}
        </Badge>
        <span className="text-slate-500">{alert.frequency}</span>
        {alert.sources.map((s) => (
          <span key={s} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-slate-500">
            {s}
          </span>
        ))}
      </div>

      {alert.newCount > 0 && (
        <a
          href={`/search?q=${encodeURIComponent(alert.topic)}`}
          className="flex items-center gap-2 rounded-xl border border-teal-300/15 bg-teal-400/[0.06] px-3 py-2.5 text-sm text-teal-200 hover:bg-teal-400/10"
        >
          <Search className="size-3.5" />
          View {alert.newCount} new paper{alert.newCount > 1 ? "s" : ""}
        </a>
      )}
    </article>
  );
}
