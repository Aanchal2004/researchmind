import type { SearchResultItem } from "@/lib/api/types";

export type CitationFormat = "bibtex" | "apa" | "mla" | "ris";

export function formatCitation(paper: SearchResultItem, format: CitationFormat): string {
  switch (format) {
    case "bibtex": return toBibTex(paper);
    case "apa": return toAPA(paper);
    case "mla": return toMLA(paper);
    case "ris": return toRIS(paper);
  }
}

export function formatCitations(papers: SearchResultItem[], format: CitationFormat): string {
  return papers.map((p) => formatCitation(p, format)).join("\n\n");
}

function bibtexKey(paper: SearchResultItem): string {
  const first = paper.authors[0]?.split(",")[0]?.split(" ").pop() ?? "Unknown";
  const year = paper.year ?? "n.d.";
  const word = paper.title.split(/\s+/)[0] ?? "untitled";
  return `${first}${year}${word}`.replace(/[^a-zA-Z0-9]/g, "");
}

function toBibTex(paper: SearchResultItem): string {
  const key = bibtexKey(paper);
  const authors = paper.authors.join(" and ");
  const lines: string[] = [
    `@article{${key},`,
    `  title   = {${paper.title}},`,
    `  author  = {${authors}},`,
  ];
  if (paper.year) lines.push(`  year    = {${paper.year}},`);
  if (paper.venue) lines.push(`  journal = {${paper.venue}},`);
  if (paper.doi) lines.push(`  doi     = {${paper.doi}},`);
  if (paper.url) lines.push(`  url     = {${paper.url}},`);
  lines.push("}");
  return lines.join("\n");
}

function toAPA(paper: SearchResultItem): string {
  const authorStr = formatAPAAuthors(paper.authors);
  const year = paper.year ? `(${paper.year})` : "(n.d.)";
  const venue = paper.venue ? ` *${paper.venue}*` : "";
  const doi = paper.doi ? ` https://doi.org/${paper.doi}` : paper.url ? ` ${paper.url}` : "";
  return `${authorStr} ${year}. ${paper.title}.${venue}.${doi}`.trim();
}

function toMLA(paper: SearchResultItem): string {
  const firstAuthor = paper.authors[0] ?? "Unknown";
  const otherAuthors =
    paper.authors.length === 2
      ? `, and ${paper.authors[1]}`
      : paper.authors.length > 2
        ? ", et al."
        : "";
  const year = paper.year ?? "n.d.";
  const venue = paper.venue ? ` *${paper.venue}*,` : "";
  return `${firstAuthor}${otherAuthors}. "${paper.title}."${venue} ${year}.`;
}

function toRIS(paper: SearchResultItem): string {
  const lines: string[] = ["TY  - JOUR"];
  for (const author of paper.authors) {
    lines.push(`AU  - ${author}`);
  }
  lines.push(`TI  - ${paper.title}`);
  if (paper.year) lines.push(`PY  - ${paper.year}`);
  if (paper.venue) lines.push(`JO  - ${paper.venue}`);
  if (paper.doi) lines.push(`DO  - ${paper.doi}`);
  if (paper.url) lines.push(`UR  - ${paper.url}`);
  lines.push("ER  -");
  return lines.join("\n");
}

function formatAPAAuthors(authors: string[]): string {
  if (authors.length === 0) return "Unknown Author";
  if (authors.length === 1) return authors[0];
  if (authors.length <= 3) {
    return authors.slice(0, -1).join(", ") + ", & " + authors[authors.length - 1];
  }
  return authors[0] + " et al.";
}
