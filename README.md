<div align="center">

# ResearchMind

### AI-native research workspace for discovering, synthesizing, and organizing academic knowledge.

<p align="center">
  <img src="https://img.shields.io/badge/status-in%20development-0f172a?style=for-the-badge" />
  <img src="https://img.shields.io/badge/frontend-nextjs-000000?style=for-the-badge&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/backend-fastapi-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/agents-langgraph-7C3AED?style=for-the-badge" />
  <img src="https://img.shields.io/badge/database-supabase-3ECF8E?style=for-the-badge&logo=supabase" />
</p>

<p align="center">
  <a href="#features">Features</a>
  ·
  <a href="#architecture">Architecture</a>
  ·
  <a href="#tech-stack">Tech Stack</a>
  ·
  <a href="#roadmap">Roadmap</a>
</p>

</div>

---

# Overview

ResearchMind is an MCP-native multi-agent research assistant designed for researchers, engineers, students, and R&D teams.

It combines:
- academic paper discovery,
- AI-powered synthesis,
- grounded citations,
- collections,
- and research workflows

into a modern AI-native workspace.

Instead of manually searching fragmented research databases, users can ask natural language research questions and receive:
- synthesized insights,
- related papers,
- citations,
- and structured research context.

---

# Features

## AI Research Search
- Multi-source academic retrieval
- arXiv
- Semantic Scholar
- PubMed
- Crossref
- Unified ranking pipeline

---

## AI Synthesis
- Research summaries
- Grounded citations
- Key claim extraction
- Related work discovery

---

## Research Workspace
- Save papers
- Collections
- Topic alerts
- Research memory
- Semantic organization

---

## Modern UX
- Dark mode first
- Responsive design
- Dense but readable layouts
- AI-native search experience

---

# Architecture

```txt
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

# Tech Stack

## Frontend

<p>
  <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind" />
</p>

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

---

## Backend

<p>
  <img src="https://skillicons.dev/icons?i=python,fastapi,redis,postgres" />
</p>

- FastAPI
- LangGraph
- MCP Servers
- Redis
- PostgreSQL
- pgvector

---

## Infrastructure

<p>
  <img src="https://skillicons.dev/icons?i=vercel,docker,github" />
</p>

- Vercel
- Railway
- Supabase
- Upstash Redis
- Cloudflare R2

---

# MCP + Agent System

ResearchMind uses a modular MCP-native architecture.

## Agents
- Search Agent
- Synthesis Agent
- Citation Agent

## MCP Tools
- arXiv Retriever
- Semantic Scholar Retriever
- PubMed Retriever
- DOI Resolver
- Citation Formatter

---

# Current Progress

## Completed
- Frontend architecture
- Dashboard shell
- Search experience
- Responsive layouts
- Design system
- Dark mode
- Synthesis UI

## In Progress
- FastAPI backend
- MCP integrations
- Search orchestration
- API normalization

---

# Local Setup

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/researchmind.git
cd researchmind
```

---

## Install Dependencies

```bash
npm install
```

---

## Start Development Server

```bash
npm run dev
```

---

# Project Structure

```txt
app/
components/
lib/
hooks/
styles/
types/

components/
├── layout/
├── search/
├── paper/
├── collections/
└── ui/
```

---

# Roadmap

## Phase 1 — MVP
- Multi-source search
- AI synthesis
- Citation generation
- Collections
- Alerts

## Phase 2 — Beta
- Vector search
- Semantic recommendations
- User accounts
- Research memory

## Phase 3 — Growth
- Team collaboration
- Private corpora
- Enterprise connectors
- Workflow automation

---

# Vision

ResearchMind is evolving toward:

> "Composable AI infrastructure for research workflows."

The long-term goal is to build an extensible research operating system powered by:
- MCP,
- multi-agent orchestration,
- retrieval systems,
- and research memory.

---

# License

MIT

---

<div align="center">

Built with curiosity, caffeine, and too many research papers.

</div>
