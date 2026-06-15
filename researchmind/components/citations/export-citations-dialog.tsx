"use client";

import { useState } from "react";
import { Check, Copy, Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCitations, type CitationFormat } from "@/lib/citations/formatters";
import type { SearchResultItem } from "@/lib/api/types";

type Props = {
  papers: SearchResultItem[];
  trigger?: React.ReactNode;
};

export function ExportCitationsDialog({ papers, trigger }: Props) {
  const [format, setFormat] = useState<CitationFormat>("bibtex");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(papers.map((p) => p.paper_id)),
  );
  const [copied, setCopied] = useState(false);

  const selectedPapers = papers.filter((p) => selected.has(p.paper_id));
  const citation = formatCitations(selectedPapers, format);

  const toggleAll = () => {
    if (selected.size === papers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(papers.map((p) => p.paper_id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const ext = format === "bibtex" ? "bib" : format === "ris" ? "ris" : "txt";
    const blob = new Blob([citation], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `citations.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
          >
            <FileText className="size-4" />
            Export citations
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl border-white/10 bg-[#07131d] text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-white">Export citations</DialogTitle>
          <DialogDescription className="text-slate-400">
            Select papers and choose a format to copy or download.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Select papers
              </span>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-teal-300 hover:text-teal-200"
              >
                {selected.size === papers.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {papers.map((paper) => (
                <label
                  key={paper.paper_id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 hover:bg-white/[0.06]"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(paper.paper_id)}
                    onChange={() => toggle(paper.paper_id)}
                    className="mt-0.5 accent-teal-400"
                  />
                  <div className="min-w-0">
                    <p className="text-xs leading-5 text-slate-200 line-clamp-2">{paper.title}</p>
                    <p className="mt-0.5 text-[0.7rem] text-slate-500">
                      {paper.authors[0]}{paper.authors.length > 1 ? " et al." : ""} · {paper.year ?? "n.d."}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{selected.size} of {papers.length} selected</p>
          </div>

          <div className="space-y-3">
            <Tabs value={format} onValueChange={(v) => setFormat(v as CitationFormat)}>
              <TabsList variant="line" className="w-full justify-start gap-0 rounded-none border-b border-white/10 p-0">
                {(["bibtex", "apa", "mla", "ris"] as CitationFormat[]).map((f) => (
                  <TabsTrigger key={f} value={f} className="rounded-none px-3 py-2 text-xs uppercase text-slate-900">
                    {f.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
              {(["bibtex", "apa", "mla", "ris"] as CitationFormat[]).map((f) => (
                <TabsContent key={f} value={f}>
                  <pre className="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[0.72rem] leading-5 text-slate-300 whitespace-pre-wrap break-words">
                    {selectedPapers.length === 0
                      ? "Select at least one paper above."
                      : formatCitations(selectedPapers, f)}
                  </pre>
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex gap-2">
              <Button
                onClick={copy}
                variant="outline"
                className="flex-1 rounded-xl border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                disabled={selected.size === 0}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy all"}
              </Button>
              <Button
                onClick={download}
                className="flex-1 rounded-xl bg-[linear-gradient(135deg,#14b8c8_0%,#1b88a4_100%)] text-slate-950 hover:brightness-110"
                disabled={selected.size === 0}
              >
                <Download className="size-4" />
                Download .{format === "bibtex" ? "bib" : format === "ris" ? "ris" : "txt"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
