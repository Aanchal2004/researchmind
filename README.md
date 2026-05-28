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

| Module | Status | Notes |
|--------|--------|-------|
| Frontend Architecture | ✅ Complete | App structure, routing, layouts |
| Design System | ✅ Complete | shadcn/ui + Tailwind integration |
| Responsive Workspace UI | ✅ Complete | Desktop-first responsive flows |
| Search Experience | ✅ Complete | AI-native search UX |
| Synthesis Panel UI | ✅ Complete | Multi-panel synthesis layout |
| API Contracts | ✅ Complete | Typed request/response schemas |
| FastAPI Backend | 🟡 In Progress | API gateway + orchestration |
| Search Aggregation | 🟡 In Progress | Multi-source normalization |
| MCP Integration Layer | 🟡 In Progress | Tool orchestration |
| LangGraph Agents | 🟡 In Progress | Agent workflows |
| Citation Pipeline | 🔲 Planned | Structured grounding |
| Collections System | 🔲 Planned | Persistent organization |
| Research Memory | 🔲 Planned | Long-term semantic context |

### Retrieval Integrations

| Source | Status |
|--------|--------|
| arXiv | 🟡 In Progress |
| Semantic Scholar | 🟡 In Progress |
| PubMed | 🔲 Planned |
| Crossref | 🔲 Planned |
| Unpaywall | 🔲 Planned |

### Infrastructure

| Component | Status |
|-----------|--------|
| Vercel Deployment | ✅ Configured |
| Docker Support | 🟡 In Progress |
| Supabase Postgres | 🔲 Planned |
| pgvector | 🔲 Planned |
| Redis Cache | 🔲 Planned |
| Cloudflare R2 | 🔲 Planned |

---

## 🗺️ Upcoming Milestones

<details>
<summary><b>Milestone 1 — Search Pipeline</b></summary>

- [ ] Unified retrieval orchestration
- [ ] Result normalization
- [ ] Ranking pipeline
- [ ] API response contracts

</details>

<details>
<summary><b>Milestone 2 — AI Synthesis</b></summary>

- [ ] Grounded summaries
- [ ] Citation extraction
- [ ] Key insight generation
- [ ] Related paper linking

</details>

<details>
<summary><b>Milestone 3 — Research Workspace</b></summary>

- [ ] Collections
- [ ] Saved papers
- [ ] Topic tracking
- [ ] Research memory

</details>

---

## 🎯 Engineering Goals

- Modular MCP-native architecture
- Production-oriented backend structure
- Retrieval-first AI workflows
- Extensible multi-agent orchestration
- Scalable research infrastructure

---

## 🚀 Local Setup

```bash
# Clone the repository
git clone https://github.com/Aanchal2004/researchmind.git
cd researchmind

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📁 Project Structure

```
app/
components/
  ├── layout/
  ├── search/
  ├── paper/
  ├── collections/
  └── ui/
lib/
hooks/
styles/
types/
```

---

## 🔭 Roadmap

| Phase | Focus | Highlights |
|-------|-------|------------|
| **Phase 1 — MVP** | Core functionality | Multi-source search, AI synthesis, citations, collections, alerts |
| **Phase 2 — Beta** | Intelligence | Vector search, semantic recommendations, user accounts, research memory |
| **Phase 3 — Growth** | Scale | Team collaboration, private corpora, enterprise connectors, workflow automation |

---
# Contributing

Contributions, improvements, and architecture discussions are welcome.

If you'd like to work on an issue:

1. Browse the open issues
2. Comment on the issue you'd like to take
3. Wait for assignment/discussion if needed
4. Fork the repository
5. Create a feature branch
6. Submit a pull request with a clear description

---

## Development Guidelines

- Keep architecture modular
- Prefer small focused PRs
- Maintain TypeScript/Python typing
- Preserve existing design language
- Avoid unnecessary abstractions
- Add comments for non-obvious logic
- Keep retrieval/provider logic isolated

## 💡 Vision

> **"Composable AI infrastructure for research workflows."**

The long-term goal is to build an extensible research operating system powered by MCP, multi-agent orchestration, retrieval systems, and research memory.

---

## 📄 License

MIT

---

<div align="center">

*Built with curiosity, caffeine, and too many research papers.*

</div>
