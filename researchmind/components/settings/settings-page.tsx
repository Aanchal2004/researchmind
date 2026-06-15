"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Key,
  Sliders,
  Trash2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearAllLocalData,
  loadPreferences,
  persistPreferences,
  type UserPreferences,
} from "@/lib/user-preferences";

const AVAILABLE_SOURCES = [
  { id: "arxiv", label: "arXiv" },
  { id: "semantic_scholar", label: "Semantic Scholar" },
  { id: "pubmed", label: "PubMed" },
  { id: "crossref", label: "Crossref" },
];

export function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  const save = () => {
    if (!prefs) return;
    persistPreferences(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const update = (patch: Partial<UserPreferences>) => setPrefs((p) => p ? { ...p, ...patch } : p);

  const clearData = () => {
    if (!confirm("Clear all locally stored papers, collections, search history, and alerts? This cannot be undone.")) return;
    clearAllLocalData();
    setCleared(true);
  };

  if (!prefs) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="panel p-5 sm:p-6">
        <div className="eyebrow">Workspace</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">Preferences are stored locally on this device.</p>
      </div>

      {/* Search defaults */}
      <Section icon={<Sliders className="size-4" />} title="Search defaults">
        <SettingRow label="Open access only" description="Filter out paywalled papers by default.">
          <Toggle
            checked={prefs.openAccessOnly}
            onChange={(v) => update({ openAccessOnly: v })}
          />
        </SettingRow>
        <SettingRow label="AI synthesis by default" description="Automatically generate synthesis after each search.">
          <Toggle
            checked={prefs.aiSummaryByDefault}
            onChange={(v) => update({ aiSummaryByDefault: v })}
          />
        </SettingRow>
        <SettingRow label="Results per page" description="Maximum papers shown per search.">
          <select
            value={prefs.defaultLimit}
            onChange={(e) => update({ defaultLimit: Number(e.target.value) })}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-teal-400/40"
          >
            {[5, 8, 12, 20].map((v) => (
              <option key={v} value={v}>{v} results</option>
            ))}
          </select>
        </SettingRow>

        <div>
          <p className="text-sm font-medium text-slate-300">Default sources</p>
          <p className="mt-0.5 text-xs text-slate-500">Sources queried on every search.</p>
          <div className="mt-3 space-y-2">
            {AVAILABLE_SOURCES.map(({ id, label, disabled }) => (
              <label key={id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={prefs.defaultSources.includes(id)}
                  onChange={(e) =>
                    update({
                      defaultSources: e.target.checked
                        ? [...prefs.defaultSources, id]
                        : prefs.defaultSources.filter((s) => s !== id),
                    })
                  }
                  className="accent-teal-400"
                />
                <span className={disabled ? "text-slate-600" : "text-slate-300"}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </Section>

      {/* API Keys */}
      <Section icon={<Key className="size-4" />} title="API keys">
        <SettingRow
          label="Semantic Scholar API key"
          description="Optional. Provides higher rate limits. Get one at semanticscholar.org/product/api."
        >
          <Input
            type="password"
            value={prefs.semanticScholarApiKey}
            onChange={(e) => update({ semanticScholarApiKey: e.target.value })}
            placeholder="sk-…"
            className="w-56 rounded-xl border-white/10 bg-white/[0.04] text-sm text-slate-200"
          />
        </SettingRow>
        <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.06] p-4">
          <p className="text-xs text-amber-200/70">API keys are stored in your browser&apos;s localStorage. They are never sent to ResearchMind servers. Actual key usage requires backend wiring (coming in Phase 4).</p>
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={<User className="size-4" />} title="Notifications">
        <SettingRow label="Email alerts" description="Receive digests when new papers match your alerts.">
          <Toggle checked={prefs.emailAlerts} onChange={(v) => update({ emailAlerts: v })} />
        </SettingRow>
        <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-4">
          <p className="text-xs text-slate-500">Email delivery requires authentication, which is planned in Phase 4. This preference is saved for when that feature ships.</p>
        </div>
      </Section>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          onClick={save}
          className="rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110"
        >
          {saved ? <><CheckCircle2 className="size-4" /> Saved!</> : "Save preferences"}
        </Button>
      </div>

      {/* Data management */}
      <Section icon={<Database className="size-4" />} title="Data management">
        <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.05] p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-300" />
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-rose-200">Clear all local data</p>
                <p className="mt-1 text-xs text-slate-400">
                  Permanently removes all saved papers, collections, search history, alerts, and preferences from this device.
                </p>
              </div>
              {cleared ? (
                <p className="text-sm text-emerald-300">All data cleared.</p>
              ) : (
                <Button
                  onClick={clearData}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-rose-500/30 bg-rose-500/[0.08] text-rose-200 hover:bg-rose-500/15"
                >
                  <Trash2 className="size-4" />
                  Clear all data
                </Button>
              )}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[0.68rem] font-medium uppercase tracking-[0.22em]">{title}</span>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-300">{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-teal-400" : "bg-white/10"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  );
}
