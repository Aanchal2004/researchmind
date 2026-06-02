<div align="center">

# 🔬 ResearchMind

### AI-native research workspace for discovering, synthesizing, and organizing academic knowledge.

<p align="center">
  <img src="https://img.shields.io/badge/status-in%20development-0f172a?style=for-the-badge" />
  <img src="https://img.shields.io/badge/frontend-nextjs-000000?style=for-the-badge&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/backend-fastapi-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/agents-langgraph-7C3AED?style=for-the-badge" />
  <img src="https://img.shields.io/badge/database-supabase-3ECF8E?style=for-the-badge&logo=supabase" />
</p>

<p align="center">
  <a href="#-overview">Overview</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-current-progress">Progress</a> ·
  <a href="#-roadmap">Roadmap</a>
</p>

</div>

---

## 📖 Overview

ResearchMind is an **MCP-native multi-agent research assistant** designed for researchers, engineers, students, and R&D teams.

It combines academic paper discovery, AI-powered synthesis, grounded citations, collections, and research workflows into a modern AI-native workspace.

Instead of manually searching fragmented research databases, users can ask natural language research questions and receive:

- 🔍 Synthesized insights
- 📄 Related papers
- 🔗 Citations
- 🗂️ Structured research context

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔍 AI Research Search
- Multi-source academic retrieval
- arXiv, Semantic Scholar, PubMed, Crossref
- Unified ranking pipeline

</td>
<td width="50%">

### 🧠 AI Synthesis
- Research summaries
- Grounded citations
- Key claim extraction
- Related work discovery

</td>
</tr>
<tr>
<td width="50%">

### 🗂️ Research Workspace
- Save papers & collections
- Topic alerts
- Research memory
- Semantic organization

</td>
<td width="50%">

### 🎨 Modern UX
- Dark mode first
- Responsive design
- Dense but readable layouts
- AI-native search experience

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
User
  ↓
Next.js Frontend
  ↓
FastAPI Gateway
  ↓
LangGraph Agent Orchestrator
  ↓
MCP Tool Layer
  ├── arXiv
  ├── Semantic Scholar
  ├── PubMed
  ├── Crossref
  └── Unpaywall
  ↓
Storage + Cache Layer
  ├── Supabase Postgres
  ├── pgvector
  ├── Redis
  └── Cloudflare R2
```

---

## 🛠️ Tech Stack

### Frontend
<p>
  <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind" />
</p>

`Next.js 15` · `React` · `TypeScript` · `Tailwind CSS` · `shadcn/ui` · `Framer Motion`

### Backend
<p>
  <img src="https://skillicons.dev/icons?i=python,fastapi,redis,postgres" />
</p>

`FastAPI` · `LangGraph` · `MCP Servers` · `Redis` · `PostgreSQL` · `pgvector`

### Infrastructure
<p>
  <img src="https://skillicons.dev/icons?i=vercel,docker,github" />
</p>

`Vercel` · `Railway` · `Supabase` · `Upstash Redis` · `Cloudflare R2`

---

## 🤖 MCP + Agent System

ResearchMind uses a modular MCP-native architecture.

| Layer | Components |
|-------|------------|
| **Agents** | Search Agent · Synthesis Agent · Citation Agent |
| **MCP Tools** | arXiv Retriever · Semantic Scholar Retriever · PubMed Retriever · DOI Resolver · Citation Formatter |

---

## 📊 Current Progress

### Core Platform

| Module                  | Status         | Notes                                           |
| ----------------------- | -------------- | ----------------------------------------------- |
| Frontend Architecture   | ✅ Complete     | App structure, routing, layouts                 |
| Design System           | ✅ Complete     | shadcn/ui + Tailwind integration                |
| Responsive Workspace UI | ✅ Complete     | Desktop + mobile responsive flows               |
| Search Experience       | ✅ Complete     | Live AI-native search UX                        |
| Synthesis Panel UI      | ✅ Complete     | Grounded synthesis + citations                  |
| API Contracts           | ✅ Complete     | Typed request/response schemas                  |
| FastAPI Backend         | ✅ Complete     | Async backend foundation                        |
| Search Aggregation      | ✅ Complete     | Multi-provider normalization + merge            |
| Retrieval Hardening     | ✅ Complete     | Retry/backoff, caching, circuit breaker         |
| Deterministic Ranking   | ✅ Complete     | Explainable ranking heuristics                  |
| Deduplication Layer     | ✅ Complete     | DOI + fuzzy-title dedupe                        |
| Grounded Synthesis      | ✅ Complete     | Deterministic extractive synthesis              |
| Provider Diagnostics    | ✅ Complete     | Graceful degraded retrieval states              |
| MCP Integration Layer   | 🟡 In Progress | Architecture prepared, partial integration      |
| LangGraph Agents        | 🔲 Planned     | Deferred intentionally until workflows mature   |
| Citation Pipeline       | 🟡 In Progress | Grounded citations integrated into synthesis UX |
| Collections System      | 🔲 Planned     | Saved papers + organization workflows           |
| Research Memory         | 🔲 Planned     | Long-term semantic context                      |

### Retrieval Integrations

| Source           | Status     |
| ---------------- | ---------- |
| arXiv            | ✅ Complete |
| Semantic Scholar | ✅ Complete |
| PubMed           | 🔲 Planned |
| Crossref         | 🔲 Planned |
| Unpaywall        | 🔲 Planned |

### Infrastructure

| Component         | Status         |
| ----------------- | -------------- |
| Vercel Deployment | ✅ Configured   |
| Docker Support    | 🟡 In Progress |
| Supabase Postgres | 🔲 Planned     |
| pgvector          | 🔲 Planned     |
| Redis Cache       | 🔲 Planned     |
| Cloudflare R2     | 🔲 Planned     |

---

## 🗺️ Upcoming Milestones

<details>
<summary><b>Milestone 1 — Retrieval + Synthesis MVP</b></summary>

* [x] Unified retrieval orchestration
* [x] Result normalization
* [x] Deterministic ranking pipeline
* [x] DOI + fuzzy-title deduplication
* [x] Grounded synthesis generation
* [x] Provider diagnostics
* [x] Responsive synthesis UX

</details>

<details>
<summary><b>Milestone 2 — Research Workspace</b></summary>

* [ ] Saved papers
* [ ] Collections
* [ ] Search persistence
* [ ] Citation export
* [ ] Paper detail pages

</details>

<details>
<summary><b>Milestone 3 — Retrieval Intelligence</b></summary>

* [ ] PubMed integration
* [ ] Crossref integration
* [ ] Unpaywall integration
* [ ] Retrieval quality tuning
* [ ] Query expansion strategies

</details>

<details>
<summary><b>Milestone 4 — Research Memory + Agents</b></summary>

* [ ] Vector search
* [ ] Semantic recommendations
* [ ] Long-term research memory
* [ ] Workflow orchestration
* [ ] LangGraph agent systems

</details>

---

## 🔭 Roadmap

| Phase                                | Focus                         | Highlights                                                        |
| ------------------------------------ | ----------------------------- | ----------------------------------------------------------------- |
| **Phase 1 — Retrieval MVP**          | Core retrieval infrastructure | Multi-provider search, ranking, deduplication, grounded synthesis |
| **Phase 2 — Research Workspace**     | User workflow UX              | Saved papers, collections, citation export, search persistence    |
| **Phase 3 — Retrieval Intelligence** | Search quality expansion      | Additional providers, retrieval tuning, semantic relevance        |
| **Phase 4 — Research Memory**        | Long-term context             | Vector search, semantic memory, related-paper intelligence        |
| **Phase 5 — Agent Workflows**        | Orchestration                 | LangGraph workflows, research automation, agent pipelines         |
