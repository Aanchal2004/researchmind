# ResearchMind HLD

## Overview
ResearchMind is an AI-native, MCP-based multi-agent research assistant designed to help researchers discover, synthesize, and organize academic knowledge.

## Layers
- Frontend: Next.js + React
- API: FastAPI
- Orchestration: LangGraph
- Agents: Search, Synthesis, Citation
- Tools: MCP wrappers around scholarly APIs
- Storage: Supabase Postgres, pgvector, Redis, object storage

## Core Flow
User query -> Frontend -> FastAPI -> Orchestrator -> Agents -> MCP tools -> Sources -> Structured response
