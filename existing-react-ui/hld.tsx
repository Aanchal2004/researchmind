"use client";

import { useState } from "react";

const sections = [
  "overview",
  "product",
  "architecture",
  "data-flow",
  "mcp-agents",
  "infra",
  "risks",
  "roadmap",
];

const sectionLabels = {
  overview: "Overview",
  product: "Product POV",
  architecture: "Architecture",
  "data-flow": "Data Flow",
  "mcp-agents": "MCP & Agents",
  infra: "Infra & Cost",
  risks: "Risks",
  roadmap: "Roadmap",
};

const Tag = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-sky-900/60 text-sky-300 border-sky-700",
    green: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
    amber: "bg-amber-900/60 text-amber-300 border-amber-700",
    red: "bg-red-900/60 text-red-300 border-red-700",
    purple: "bg-violet-900/60 text-violet-300 border-violet-700",
    gray: "bg-zinc-800 text-zinc-400 border-zinc-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${colors[color]}`}>
      {children}
    </span>
  );
};

const Card = ({ title, children, accent = "sky" }) => {
  const accents = {
    sky: "border-sky-700/50 before:bg-sky-500",
    emerald: "border-emerald-700/50 before:bg-emerald-500",
    amber: "border-amber-700/50 before:bg-amber-500",
    violet: "border-violet-700/50 before:bg-violet-500",
    red: "border-red-700/50 before:bg-red-500",
  };
  return (
    <div className={`relative bg-zinc-900 border ${accents[accent]} rounded-lg p-5 overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${accents[accent].split(" ")[1]}`} />
      {title && <h3 className="text-sm font-semibold text-zinc-200 mb-3 pl-2 uppercase tracking-widest">{title}</h3>}
      <div className="pl-2">{children}</div>
    </div>
  );
};

const Box = ({ label, sub, color = "zinc" }) => {
  const colors = {
    zinc: "bg-zinc-800 border-zinc-600 text-zinc-200",
    sky: "bg-sky-900/40 border-sky-600 text-sky-200",
    emerald: "bg-emerald-900/40 border-emerald-600 text-emerald-200",
    amber: "bg-amber-900/40 border-amber-600 text-amber-200",
    violet: "bg-violet-900/40 border-violet-600 text-violet-200",
    red: "bg-red-900/40 border-red-600 text-red-200",
  };
  return (
    <div className={`border rounded-md px-3 py-2 text-center ${colors[color]}`}>
      <div className="text-xs font-bold tracking-wide">{label}</div>
      {sub && <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
};

const Arrow = ({ label, dir = "down" }) => (
  <div className="flex flex-col items-center my-1 gap-0.5">
    {dir === "down" && (
      <>
        <div className="w-px h-4 bg-zinc-600" />
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-zinc-500" />
      </>
    )}
    {label && <span className="text-[9px] text-zinc-500 font-mono">{label}</span>}
  </div>
);

const Row = ({ children }) => (
  <div className="flex items-center gap-2 flex-wrap">{children}</div>
);

const HArrow = () => (
  <div className="flex items-center">
    <div className="h-px w-4 bg-zinc-600" />
    <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-zinc-500" />
  </div>
);

const MetricBadge = ({ value, label }) => (
  <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-center">
    <div className="text-2xl font-black text-sky-400 font-mono">{value}</div>
    <div className="text-[11px] text-zinc-400 mt-1 uppercase tracking-wider">{label}</div>
  </div>
);

const RiskRow = ({ risk, impact, mitigation, level }) => {
  const levels = { High: "red", Medium: "amber", Low: "green" };
  return (
    <div className="border border-zinc-700/50 rounded-md p-3 bg-zinc-900/50">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm text-zinc-200 font-medium">{risk}</span>
        <Tag color={levels[level]}>{level}</Tag>
      </div>
      <div className="text-xs text-zinc-500 mb-1">Impact: {impact}</div>
      <div className="text-xs text-emerald-400">↳ {mitigation}</div>
    </div>
  );
};

const TimelineItem = ({ phase, duration, items, active }) => (
  <div className={`border rounded-lg p-4 ${active ? "border-sky-600 bg-sky-900/10" : "border-zinc-700 bg-zinc-900/50"}`}>
    <div className="flex items-center justify-between mb-2">
      <span className={`text-sm font-bold ${active ? "text-sky-300" : "text-zinc-300"}`}>{phase}</span>
      <Tag color={active ? "blue" : "gray"}>{duration}</Tag>
    </div>
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
          <span className={`mt-0.5 ${active ? "text-sky-500" : "text-zinc-600"}`}>▸</span>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default function HLD() {
  const [active, setActive] = useState("overview");

  const renderSection = () => {
    switch (active) {
      case "overview":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-1">Research<span className="text-sky-400">Mind</span></h2>
              <p className="text-zinc-400 text-sm max-w-xl">
                An AI-powered, multi-agent research assistant that unifies fragmented academic databases into a single intelligent interface — built on MCP, free APIs, and Claude.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricBadge value="₹0–1,450" label="Est. Monthly Cost" />
              <MetricBadge value="200M+" label="Papers Indexed" />
              <MetricBadge value="5" label="Free APIs" />
              <MetricBadge value="3" label="Agent Types" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card title="Problem" accent="red">
                <p className="text-xs text-zinc-400">Researchers spend 30–40% of time finding, reading, and synthesizing papers across siloed databases. No unified, intelligent interface exists that's free to use.</p>
              </Card>
              <Card title="Solution" accent="sky">
                <p className="text-xs text-zinc-400">A multi-agent system with MCP tools that searches across arXiv, Semantic Scholar, PubMed simultaneously — then synthesizes, summarizes, and cites results via LLM.</p>
              </Card>
              <Card title="Differentiator" accent="emerald">
                <p className="text-xs text-zinc-400">Not just RAG on PDFs. Live search + synthesis + citation generation + topic tracking — all in one place, free to host, discoverable via SEO.</p>
              </Card>
            </div>
            <Card title="Target Users" accent="violet">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["PhD Students", "Academic Researchers", "R&D Engineers", "Science Journalists"].map(u => (
                  <div key={u} className="bg-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-300 text-center">{u}</div>
                ))}
              </div>
            </Card>
          </div>
        );

      case "product":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white tracking-tight">Product POV</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card title="Core User Journeys" accent="sky">
                <ol className="space-y-3">
                  {[
                    { step: "1", label: "Search", desc: "User types a research question in natural language" },
                    { step: "2", label: "Discover", desc: "Agent fans out to 5 APIs simultaneously, returns top papers" },
                    { step: "3", label: "Synthesize", desc: "LLM generates a structured synthesis with citations" },
                    { step: "4", label: "Deep Dive", desc: "User opens paper → get summary, key claims, related work" },
                    { step: "5", label: "Export", desc: "BibTeX / APA / formatted reference list download" },
                  ].map(({ step, label, desc }) => (
                    <li key={step} className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">{step}</span>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">{label}</div>
                        <div className="text-xs text-zinc-500">{desc}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
              <div className="space-y-3">
                <Card title="Feature Tiers" accent="emerald">
                  <div className="space-y-2">
                    {[
                      { tier: "Free", color: "green", features: ["10 searches/day", "3 databases", "Basic summaries", "APA export"] },
                      { tier: "Pro (₹870/mo)", color: "blue", features: ["Unlimited searches", "All 5 databases", "Deep synthesis", "All citation formats", "Topic alerts"] },
                    ].map(({ tier, color, features }) => (
                      <div key={tier} className="bg-zinc-800 rounded-md p-3">
                        <Tag color={color}>{tier}</Tag>
                        <ul className="mt-2 space-y-1">
                          {features.map(f => <li key={f} className="text-xs text-zinc-400">• {f}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card title="Discoverability Strategy" accent="amber">
                  <ul className="space-y-1.5">
                    {[
                      ["SEO", "Long-tail academic search queries"],
                      ["Product Hunt", "Launch day push for researchers"],
                      ["Reddit", "r/MachineLearning, r/academia"],
                      ["Twitter/X", "Research community threads"],
                      ["Institution outreach", "Pilot with university labs"],
                    ].map(([channel, tactic]) => (
                      <li key={channel} className="flex gap-2 items-start text-xs">
                        <Tag color="amber">{channel}</Tag>
                        <span className="text-zinc-400">{tactic}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        );

      case "architecture":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white tracking-tight">System Architecture</h2>
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-5">
              {/* User */}
              <div className="flex justify-center mb-2">
                <Box label="👤 User" sub="Browser / Mobile" color="zinc" />
              </div>
              <Arrow label="HTTPS" />
              {/* Frontend */}
              <div className="flex justify-center mb-2">
                <Box label="React Frontend" sub="Vercel · CDN Edge" color="sky" />
              </div>
              <Arrow label="REST / WebSocket" />
              {/* API Gateway */}
              <div className="flex justify-center mb-2">
                <Box label="FastAPI Gateway" sub="Render / Railway · Auth · Rate Limit" color="emerald" />
              </div>
              <Arrow label="Tool calls via MCP" />
              {/* Orchestration */}
              <div className="flex justify-center mb-2">
                <Box label="Agent Orchestrator" sub="LangGraph / Custom · Claude claude-sonnet-4-20250514" color="violet" />
              </div>
              {/* MCP Layer */}
              <Arrow label="MCP Protocol" />
              <div className="border border-violet-700/40 rounded-lg p-3 bg-violet-950/10 mb-2">
                <div className="text-[10px] text-violet-400 font-mono uppercase tracking-widest mb-2 text-center">MCP Tool Layer</div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { label: "arXiv", sub: "CS/Physics" },
                    { label: "Semantic Scholar", sub: "200M papers" },
                    { label: "PubMed", sub: "Biomedical" },
                    { label: "CrossRef", sub: "DOI/Meta" },
                    { label: "Unpaywall", sub: "Open PDFs" },
                  ].map(({ label, sub }) => (
                    <Box key={label} label={label} sub={sub} color="violet" />
                  ))}
                </div>
              </div>
              <Arrow label="Embeddings / Vector search" />
              {/* Storage */}
              <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
                <Box label="Supabase" sub="Vector DB" color="emerald" />
                <Box label="Redis" sub="Cache" color="amber" />
                <Box label="S3 / R2" sub="PDF Store" color="sky" />
              </div>
            </div>
          </div>
        );

      case "data-flow":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white tracking-tight">Data Flow</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card title="Query Flow (Sync)" accent="sky">
                <ol className="space-y-2">
                  {[
                    "User submits query via frontend",
                    "Gateway authenticates + rate limits",
                    "Orchestrator plans: Search Agent activated",
                    "MCP tools fan-out to 3–5 APIs in parallel",
                    "Results deduplicated + ranked by relevance",
                    "Synthesis Agent: Claude summarizes top-N papers",
                    "Citation Agent: formats references",
                    "Response streamed back to user (SSE)",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-zinc-400">
                      <span className="text-sky-500 font-mono shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </Card>
              <div className="space-y-3">
                <Card title="Async Jobs" accent="amber">
                  <ul className="space-y-1.5 text-xs text-zinc-400">
                    {[
                      "PDF ingestion → chunk → embed → store in Supabase pgvector",
                      "Topic alert jobs (cron) → new paper notifications",
                      "Cache warm-up for trending queries",
                      "Embedding refresh on model upgrades",
                    ].map((j, i) => <li key={i} className="flex gap-1.5"><span className="text-amber-500">⚡</span>{j}</li>)}
                  </ul>
                </Card>
                <Card title="Caching Strategy" accent="emerald">
                  <div className="space-y-2 text-xs text-zinc-400">
                    <div className="flex justify-between items-center border-b border-zinc-700 pb-1">
                      <span>API search results</span><Tag color="green">Redis · 1hr TTL</Tag>
                    </div>
                    <div className="flex justify-between items-center border-b border-zinc-700 pb-1">
                      <span>Paper summaries</span><Tag color="green">Supabase · 7d TTL</Tag>
                    </div>
                    <div className="flex justify-between items-center border-b border-zinc-700 pb-1">
                      <span>Embeddings</span><Tag color="green">Permanent</Tag>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>LLM synthesis</span><Tag color="green">Redis · 24hr TTL</Tag>
                    </div>
                  </div>
                </Card>
                <Card title="Data Sources" accent="violet">
                  <div className="space-y-1 text-xs">
                    {[
                      { src: "arXiv", limit: "Unlimited", auth: "None" },
                      { src: "Semantic Scholar", limit: "100 req/5min", auth: "API Key" },
                      { src: "PubMed (E-utils)", limit: "10 req/s", auth: "Email" },
                      { src: "CrossRef", limit: "Polite pool", auth: "None" },
                      { src: "Unpaywall", limit: "100k/day", auth: "Email" },
                    ].map(({ src, limit, auth }) => (
                      <div key={src} className="flex items-center justify-between">
                        <span className="text-zinc-300">{src}</span>
                        <div className="flex gap-1">
                          <Tag color="gray">{limit}</Tag>
                          <Tag color={auth === "None" ? "green" : "blue"}>{auth}</Tag>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        );

      case "mcp-agents":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white tracking-tight">MCP & Agent Design</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  name: "Search Agent",
                  icon: "🔍",
                  accent: "sky",
                  color: "blue",
                  desc: "Fan-out coordinator. Dispatches parallel MCP tool calls to all connected APIs and merges deduplicated results.",
                  tools: ["arxiv_search", "semantic_scholar_search", "pubmed_search", "crossref_lookup"],
                  trigger: "Every user query",
                },
                {
                  name: "Synthesis Agent",
                  icon: "🧠",
                  accent: "violet",
                  color: "purple",
                  desc: "Takes top-N ranked papers, reads abstracts/conclusions, produces a structured synthesis with inline citations.",
                  tools: ["read_abstract", "extract_claims", "generate_synthesis"],
                  trigger: "Post search · on demand",
                },
                {
                  name: "Citation Agent",
                  icon: "📎",
                  accent: "emerald",
                  color: "green",
                  desc: "Resolves DOIs via CrossRef, formats citations in APA/MLA/BibTeX/Chicago, generates reference lists.",
                  tools: ["resolve_doi", "format_citation", "export_bibtex"],
                  trigger: "On export / paper view",
                },
              ].map(({ name, icon, accent, color, desc, tools, trigger }) => (
                <Card key={name} title={`${icon} ${name}`} accent={accent}>
                  <p className="text-xs text-zinc-400 mb-3">{desc}</p>
                  <div className="mb-2">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">MCP Tools</div>
                    <div className="flex flex-wrap gap-1">
                      {tools.map(t => <Tag key={t} color={color}>{t}</Tag>)}
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500">Trigger: <span className="text-zinc-300">{trigger}</span></div>
                </Card>
              ))}
            </div>
            <Card title="MCP Server Structure" accent="amber">
              <div className="font-mono text-xs text-zinc-300 space-y-1 bg-zinc-950 rounded-md p-3">
                <div className="text-amber-400">mcp-server/</div>
                <div className="pl-4 text-zinc-400">├── tools/</div>
                <div className="pl-8 text-sky-300">├── arxiv.py        <span className="text-zinc-600"># search, fetch abstract</span></div>
                <div className="pl-8 text-sky-300">├── semantic_scholar.py</div>
                <div className="pl-8 text-sky-300">├── pubmed.py</div>
                <div className="pl-8 text-sky-300">├── crossref.py     <span className="text-zinc-600"># DOI resolution</span></div>
                <div className="pl-8 text-sky-300">└── unpaywall.py    <span className="text-zinc-600"># open PDF links</span></div>
                <div className="pl-4 text-zinc-400">├── agents/</div>
                <div className="pl-8 text-violet-300">├── search_agent.py</div>
                <div className="pl-8 text-violet-300">├── synthesis_agent.py</div>
                <div className="pl-8 text-violet-300">└── citation_agent.py</div>
                <div className="pl-4 text-zinc-400">├── orchestrator.py <span className="text-zinc-600"># LangGraph DAG</span></div>
                <div className="pl-4 text-zinc-400">└── server.py       <span className="text-zinc-600"># FastMCP / stdio transport</span></div>
              </div>
            </Card>
          </div>
        );

      case "infra":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white tracking-tight">Infrastructure & Cost</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card title="Hosting Stack" accent="sky">
                <div className="space-y-2">
                  {[
                    { layer: "Frontend", service: "Vercel", cost: "Free", note: "CDN + Edge" },
                    { layer: "Backend API", service: "Render", cost: "Free / ₹680", note: "Spin-down on free" },
                    { layer: "MCP Server", service: "Railway", cost: "Free / ₹485", note: "Always-on" },
                    { layer: "Vector DB", service: "Supabase", cost: "Free", note: "500MB limit" },
                    { layer: "Cache", service: "Upstash Redis", cost: "Free", note: "10k req/day" },
                    { layer: "PDF Storage", service: "Cloudflare R2", cost: "₹1.45/GB", note: "Cheap egress" },
                    { layer: "Domain", service: "Namecheap", cost: "₹970/yr", note: "Discoverable" },
                  ].map(({ layer, service, cost, note }) => (
                    <div key={layer} className="flex items-center justify-between text-xs border-b border-zinc-800 pb-1.5">
                      <div>
                        <span className="text-zinc-200">{layer}</span>
                        <span className="text-zinc-500 ml-2">{service}</span>
                      </div>
                      <div className="flex gap-1 items-center">
                        <Tag color={cost === "Free" ? "green" : "amber"}>{cost}</Tag>
                        <span className="text-zinc-600">{note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <div className="space-y-3">
                <Card title="Claude API Cost Model" accent="violet">
                  <div className="space-y-2 text-xs text-zinc-400">
                    <div className="bg-zinc-800 rounded-md p-3">
                      <div className="text-zinc-200 font-semibold mb-2">100 searches/day estimate</div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span>Input tokens (context)</span><span className="text-violet-300">~500K/day</span></div>
                        <div className="flex justify-between"><span>Output tokens (synthesis)</span><span className="text-violet-300">~100K/day</span></div>
                        <div className="flex justify-between border-t border-zinc-700 pt-1 text-zinc-200 font-semibold">
                          <span>Est. daily cost</span><span className="text-emerald-400">~₹48–₹145</span>
                        </div>
                        <div className="flex justify-between text-zinc-200 font-semibold">
                          <span>Monthly (100 DAU)</span><span className="text-emerald-400">~₹1,450–₹4,350</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-zinc-500">Caching summaries reduces repeat LLM calls by ~60–70%.</p>
                  </div>
                </Card>
                <Card title="Total Monthly Estimate" accent="emerald">
                  <div className="space-y-1 text-xs">
                    {[
                      ["Hosting (all)", "₹0–1,150"],
                      ["Claude API", "₹1,450–₹4,350"],
                      ["Domain (amortized)", "~₹80"],
                      ["Total", "₹1,530–₹5,580"],
                    ].map(([item, cost], i) => (
                      <div key={item} className={`flex justify-between items-center ${i === 3 ? "border-t border-zinc-700 pt-2 text-white font-bold" : "text-zinc-400"}`}>
                        <span>{item}</span>
                        <span className={i === 3 ? "text-emerald-400" : ""}>{cost}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        );

      case "risks":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white tracking-tight">Risk Register</h2>
            <div className="space-y-3">
              <RiskRow risk="API rate limit exhaustion" impact="Search degraded for all users" level="High" mitigation="Request queuing, multi-key rotation, aggressive caching, graceful degradation per source" />
              <RiskRow risk="Claude API cost spike" impact="Runway burn if viral traffic" level="High" mitigation="Hard rate limits per user, cache synthesis results, offer free-tier cap with clear upgrade path" />
              <RiskRow risk="Supabase free tier limits" impact="DB reads throttled at scale" level="Medium" mitigation="Move to paid Supabase (₹2,425/mo) at 500+ DAU; use Redis to shield DB from raw reads" />
              <RiskRow risk="Render spin-down latency" impact="Cold start 30s on free tier" level="Medium" mitigation="Use Railway always-on or UptimeRobot pings; upgrade to paid at launch" />
              <RiskRow risk="Hallucinated citations" impact="Trust erosion with researchers" level="High" mitigation="Ground synthesis strictly on fetched abstracts; show source links always; never invent DOIs" />
              <RiskRow risk="PDF access restrictions" impact="Unpaywall fails for paywalled papers" level="Low" mitigation="Show abstract only; link to original; note open-access status clearly" />
              <RiskRow risk="SEO discoverability slow" impact="Low organic traffic initially" level="Medium" mitigation="Pre-generate pages for top 10K research queries; launch on Product Hunt + Reddit communities" />
            </div>
          </div>
        );

      case "roadmap":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white tracking-tight">Phased Roadmap</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TimelineItem
                phase="Phase 1 — MVP"
                duration="Weeks 1–4"
                active={true}
                items={[
                  "MCP server with arXiv + Semantic Scholar tools",
                  "FastAPI backend + Claude orchestration",
                  "React frontend: search + results + synthesis view",
                  "Deploy on Vercel + Railway (free tier)",
                  "Basic auth (email/password via Supabase Auth)",
                ]}
              />
              <TimelineItem
                phase="Phase 2 — Beta"
                duration="Weeks 5–8"
                items={[
                  "Add PubMed + CrossRef + Unpaywall MCP tools",
                  "Citation Agent: APA / BibTeX export",
                  "Vector search: semantic similarity across saved papers",
                  "User dashboard: saved searches, paper collections",
                  "Launch on Product Hunt + Reddit",
                ]}
              />
              <TimelineItem
                phase="Phase 3 — Growth"
                duration="Months 3–4"
                items={[
                  "Topic alert system (cron + email notifications)",
                  "Pro tier monetization via Stripe",
                  "PDF upload + private corpus search",
                  "Collaboration: shared collections, annotation",
                  "SEO: pre-rendered paper summary pages",
                ]}
              />
              <TimelineItem
                phase="Phase 4 — Scale"
                duration="Months 5–6"
                items={[
                  "Institution/lab team plans",
                  "Slack / Notion integrations",
                  "Custom MCP tool SDK for power users",
                  "API access for developers",
                  "Move to dedicated infra if 1K+ DAU",
                ]}
              />
            </div>
            <Card title="Tech Decisions Frozen at MVP" accent="amber">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  ["Claude claude-sonnet-4-20250514", "LLM"],
                  ["LangGraph", "Agent DAG"],
                  ["FastMCP", "MCP transport"],
                  ["Supabase pgvector", "Vector DB"],
                ].map(([tech, role]) => (
                  <div key={tech} className="bg-zinc-800 rounded-md p-2 text-center">
                    <div className="text-xs font-semibold text-zinc-200">{tech}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{role}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans" style={{ fontFamily: "'IBM Plex Mono', 'Fira Code', monospace" }}>
      {/* Header */}
      <div className="border-b border-zinc-800 px-5 py-3 flex items-center justify-between sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-sky-500 flex items-center justify-center text-[10px] font-black text-white">R</div>
          <span className="text-sm font-bold text-zinc-200 tracking-wider">RESEARCHMIND · HLD</span>
        </div>
        <div className="flex gap-1.5">
          <Tag color="blue">v1.0</Tag>
          <Tag color="gray">Draft</Tag>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-36 shrink-0 border-r border-zinc-800 min-h-screen p-3 sticky top-10 self-start">
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-3 pl-1">Sections</div>
          <nav className="space-y-0.5">
            {sections.map(s => (
              <button
                key={s}
                onClick={() => setActive(s)}
                className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-all ${
                  active === s
                    ? "bg-sky-600/20 text-sky-300 border border-sky-700/50"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {sectionLabels[s]}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-5 max-w-3xl">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}