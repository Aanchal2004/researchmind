# ResearchMind — Project Tracker

## Legend
- ✅ Done
- 🟡 Partial
- 🔲 Not started

---

## Build Order (Priority — top to bottom)

1. **Phase 5** — Supabase persistence + auth ← **CURRENT FOCUS**
2. **Phase 6** — Paper detail (related papers panel)
3. **Phase 7** — Alert delivery jobs
4. **Phase 8** — Redis + hardening
5. **Phase 9** — Streaming search
6. **Phase 4 (remaining)** — Mind map tab
7. **Phase 10** — Memory + agents
8. **Phase 11** — UI Polish (professional finish)
9. **Phase 12** — Full feature testing & QA
10. **Phase 4 (final)** — AI synthesis polish & streaming

---

## Phase 1 — Retrieval MVP

| Task | Status | Notes |
|---|---|---|
| Next.js + Tailwind bootstrap | ✅ Done | App Router, dark theme, shadcn/ui |
| Design system (tokens, typography) | ✅ Done | CSS variables, Manrope + Newsreader fonts |
| Sidebar + workspace layout | ✅ Done | Desktop sidebar, mobile sheet, bottom nav |
| Routing + app structure | ✅ Done | Route groups, workspace shell, landing page |
| Responsive layout | ✅ Done | Desktop + mobile across all pages |
| Search page shell + filters | ✅ Done | URL-driven filters, filter sheet, filter badges |
| Search result cards | ✅ Done | Provider source badges, score, tags, save button |
| Synthesis panel UI | ✅ Done | AI synthesis tab, key takeaways tab, cited sources |
| Loading states + skeletons | ✅ Done | Per-section skeletons, error/retry states |
| FastAPI setup | ✅ Done | Lifespan, CORS, request logging, health endpoint |
| Environment config + logging | ✅ Done | Pydantic Settings, structured logging, `.env.example` |
| `/api/search` endpoint | ✅ Done | Typed request/response, POST handler |
| Async parallel retrieval | ✅ Done | `asyncio.gather` with per-provider error isolation |
| arXiv provider | ✅ Done | Live XML, retries, rate limiting, circuit breaker, in-process cache |
| Semantic Scholar provider | ✅ Done | Live HTTP, optional API key, retries, enabled by default |
| Schema normalization | ✅ Done | Unified `SearchResultItem` across all providers |
| Deduplication layer | ✅ Done | DOI normalization + fuzzy-title matching |
| Ranking pipeline | ✅ Done | Deterministic explainable heuristics (title, recency, multi-source) |
| Extractive synthesis | ✅ Done | Sentence scoring + highlight extraction, `build_prompt()` scaffold |
| Provider diagnostics | ✅ Done | Per-provider reports in `SearchMeta`, graceful degradation |
| Backend unit tests | ✅ Done | pytest coverage for search, synthesis, merger, Semantic Scholar |

---

## Phase 2 — Research Workspace (Frontend)

| Task | Status | Notes |
|---|---|---|
| Saved papers (localStorage) | ✅ Done | Save/unsave from search, cross-tab sync via custom events |
| Search history (localStorage) | ✅ Done | Auto-recorded per search, grouped by date, filterable |
| Collections (localStorage) | ✅ Done | Create/delete, accent colors, paper assignment |
| Alerts (localStorage) | ✅ Done | Create/pause/delete, new-count badge, search shortcut |
| User preferences (localStorage) | ✅ Done | Open access, default sources, limit, API key slot |
| Citation formatters | ✅ Done | BibTeX, APA, MLA, RIS — client-side, no backend needed |
| `/saved` page | ✅ Done | Grid/list view, text search, sort, pagination, export dialog |
| `/paper/[id]` page | ✅ Done | Three-column layout, metadata, abstract, citation tabs, save/unsave |
| `/collections` page | ✅ Done | Card grid, create collection dialog |
| `/collections/[id]` page | ✅ Done | Paper grid, export dialog |
| `/search/history` page | ✅ Done | Grouped timeline, filter, delete entries |
| `/alerts` page | ✅ Done | Alert cards, create/pause/delete, "view new papers" CTA |
| `/settings` page | ✅ Done | Preferences form, save, clear-all-data |
| `/agents` page | ✅ Done | Live backend health check, provider diagnostics UI, planned agents |
| `/memory` page | ✅ Done | Phase 4 shell with feature preview |
| `/review` page | ✅ Done | Phase 4 shell with feature preview |
| Sidebar restructure | ✅ Done | Library submenu, real routes, no broken hash anchors |
| Export citations dialog | ✅ Done | Per-paper selection, 4 formats, copy + download |
| Search history auto-record | ✅ Done | Recorded with result count and sources on every successful search |

---

## Phase 3 — Additional Providers

| Task | Status | Notes |
|---|---|---|
| PubMed provider | ✅ Done | ESearch → ESummary → EFetch pipeline, PMC open-access detection |
| Crossref provider | ✅ Done | `query.bibliographic` endpoint, JATS tag stripping, score normalisation |
| Unpaywall integration | ✅ Done | Post-merge enricher, resolves OA PDF URLs by DOI, concurrency semaphore |
| Enable PubMed/Crossref in settings UI | ✅ Done | Both shown as selectable sources, enabled by default |
| Provider config flags | ✅ Done | `pubmed_enabled`, `crossref_enabled`, `unpaywall_enabled` in config + container |
| Tests for new providers | ✅ Done | 13 new tests — PubMed (4), Crossref (4), Unpaywall (5); 26/26 passing |

---

## Phase 4 — LLM Synthesis (DEPRIORITISED — finish after Phase 10)

| Task | Status | Notes |
|---|---|---|
| Add LLM SDK dependency | ✅ Done | `google-genai` added to `pyproject.toml` |
| `RESEARCHMIND_LLM_PROVIDER` config | ✅ Done | Supports `gemini`, `ollama`, `disabled` |
| Wire LLM call in `synthesis.py` | ✅ Done | `LLMSynthesisService` (Gemini) + `OllamaSynthesisService` (local llama3) |
| Structured JSON output schema | ✅ Done | JSON mode enforced, `summary` + `highlights` + `key_claims` parsed |
| Fallback to extractive on LLM failure | ✅ Done | Timeout / network error → silent extractive fallback |
| Comparison table tab | ✅ Done | Live paper comparison table in synthesis panel (top 8 results) |
| Synthesis async decoupling | ✅ Done | Results return immediately; synthesis runs as BackgroundTask, polled every 1.5s |
| Gemini → Ollama → Extractive chain | ✅ Done | Primary Gemini, secondary Ollama, last-resort extractive |
| Synthesis model badge in UI | ✅ Done | Badge shows `gemini-3.5-flash`, `llama3`, or `Extractive` |
| "Ask about this paper" chat | ✅ Done | `/api/paper-chat` endpoint + live chat UI on paper detail page |
| Ollama local LLM | ✅ Done | `OllamaSynthesisService` using llama3, fully async httpx |
| Mind map tab | 🔲 Not started | ReactFlow or D3 concept clustering — visual paper relationship graph |
| Synthesis streaming (token by token) | 🔲 Not started | SSE stream from Gemini → frontend shows tokens as they arrive |
| LLM synthesis latency tuning | 🔲 Not started | Prompt compression, parallel section generation, response caching by topic |

---

## Phase 5 — Backend Persistence (Supabase) ← CURRENT FOCUS

| Task | Status | Notes |
|---|---|---|
| Supabase project setup | ✅ Done | Project created, URL + anon key + service_role + JWT secret configured |
| DB schema — saved_papers | ✅ Done | `user_id`, `paper_id`, `raw_json`, `saved_at` + RLS |
| DB schema — collections | ✅ Done | `user_id`, `name`, `description`, `accent`, `paper_ids[]` + RLS |
| DB schema — alerts | ✅ Done | `user_id`, `topic`, `frequency`, `sources`, `status`, `new_count` + RLS |
| DB schema — search_history | ✅ Done | `user_id`, `query`, `result_count`, `sources`, `timestamp` + RLS |
| DB schema — paper_notes | ✅ Done | `user_id`, `paper_id`, `content`, `updated_at` + RLS |
| Add Supabase client to backend | ✅ Done | `supabase-py` installed, `core/supabase.py` with admin + anon clients |
| Auth endpoints | ✅ Done | `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/refresh` |
| Auth middleware on frontend | ✅ Done | Next.js middleware + Supabase SSR client, session cookie refresh |
| Login / signup page | ✅ Done | `/login` — email + password, toggle signup/login, show-password, error states |
| Migrate localStorage → Supabase on login | 🔲 Not started | On first login, sync existing localStorage data to DB |
| CRUD API routes for saved papers | ✅ Done | `GET/POST/DELETE /api/papers/saved` |
| CRUD API routes for collections | ✅ Done | `GET/POST/PUT/DELETE /api/collections` |
| CRUD API routes for alerts | ✅ Done | `GET/POST/PUT/DELETE /api/alerts` |
| CRUD API routes for search history | ✅ Done | `GET/POST/DELETE /api/history` |
| CRUD API routes for paper notes | ✅ Done | `GET/POST/PUT/DELETE /api/notes` |
| Frontend data layer swap | ✅ Done | `useSavedPapers` + `useSearchHistory` hooks — Supabase when authed, localStorage when not |
| Row-level security (RLS) | ✅ Done | All 5 tables have RLS — users only see their own rows |
| Auth-aware sidebar | ✅ Done | Shows user email + sign-out when logged in; "Sign in to sync" prompt when anonymous |

---

## Phase 6 — Paper Detail (Complete)

| Task | Status | Notes |
|---|---|---|
| `/api/paper/{id}` backend endpoint | ✅ Done | Targeted search + exact/loose paper_id match, 404 on miss |
| Paper detail fetches live data | ✅ Done | localStorage first, falls back to live backend fetch with skeleton |
| Paper notes UI | 🔲 Not started | Inline editor on paper detail, save to Supabase (Phase 5 dep) |
| Related papers API | 🔲 Not started | Semantic Scholar `/paper/{id}/references` or `/recommendations` endpoint |
| Related papers panel | 🔲 Not started | Right sidebar panel on paper detail, links to `/paper/[id]` |
| PDF viewer / embed | 🔲 Not started | Embed OA PDF via `pdf_url` if available (iframe or react-pdf) |
| Highlight & annotate | 🔲 Not started | Text selection → save highlight with note to Supabase |

---

## Phase 7 — Alert Delivery (Backend Jobs)

| Task | Status | Notes |
|---|---|---|
| APScheduler setup in FastAPI | 🔲 Not started | Background job scheduler wired in `main.py` lifespan |
| Alert query runner | 🔲 Not started | On schedule, re-run saved alert topics against all providers |
| Diff against previous results | 🔲 Not started | Compare paper IDs to detect newly matched papers |
| Store new match counts in Supabase | 🔲 Not started | Update `alerts.new_count` + `alerts.last_run_at` |
| Email integration (Resend) | 🔲 Not started | Send digest email when new papers found for an alert |
| In-app notification badge | 🔲 Not started | Real `new_count` from DB → sidebar badge (currently hardcoded "3") |
| Alert frequency options | 🔲 Not started | Daily / weekly / instant scheduling |

---

## Phase 8 — Redis + Hardening

| Task | Status | Notes |
|---|---|---|
| Redis / Upstash setup | 🔲 Not started | Add `REDIS_URL` to config + `.env.example` |
| Cache search results by query hash | 🔲 Not started | `redis-py` in `pyproject.toml`, TTL-based cache in `search.py` |
| Move synthesis cache to Redis | 🔲 Not started | Replace in-process `SynthesisCache` with Redis-backed store |
| API-level rate limiting | 🔲 Not started | FastAPI middleware — per-IP limits, 429 responses |
| Frontend error boundaries | 🔲 Not started | React error boundaries around search, paper detail, collections |
| Retry + offline indicator | 🔲 Not started | Show offline banner + retry button when backend is unreachable |
| Monitoring / observability | 🔲 Not started | Sentry (frontend + backend errors) + structured log shipping |
| Backend health dashboard | 🔲 Not started | `/agents` page shows provider latencies, cache hit rate, error rate |

---

## Phase 9 — Streaming Search

| Task | Status | Notes |
|---|---|---|
| `/api/search/stream` SSE endpoint | 🔲 Not started | Emit results as each provider responds (not waiting for all) |
| Frontend streaming consumer | 🔲 Not started | Progressive render — results appear as they arrive |
| Per-provider loading indicators | 🔲 Not started | "Fetching from arXiv… Fetching from Semantic Scholar…" live status |
| Replace polling with SSE for synthesis | 🔲 Not started | Stream synthesis tokens directly via SSE instead of polling |

---

## Phase 10 — Research Memory + Agents

| Task | Status | Notes |
|---|---|---|
| pgvector setup in Supabase | 🔲 Not started | Vector extension, embeddings column on `saved_papers` |
| Embed paper abstracts on save | 🔲 Not started | Generate embeddings (Gemini or OpenAI), store in pgvector |
| Semantic similarity search | 🔲 Not started | "Find related papers" from personal library by vector distance |
| `/memory` page — live | 🔲 Not started | Replace shell with reading timeline, surfaced context, clusters |
| LangGraph agent orchestration | 🔲 Not started | Wrap search + synthesis into a LangGraph graph |
| `/review` page — live | 🔲 Not started | Select papers → generate structured literature review sections |
| Citation graph agent | 🔲 Not started | Seed paper → reference/citation network traversal |
| Alert digest agent | 🔲 Not started | Scheduled LangGraph run → personalized digest email |
| Research memory chat | 🔲 Not started | Ask questions across your entire saved paper library |

---

## Phase 11 — UI Polish (Professional Finish)

| Task | Status | Notes |
|---|---|---|
| Audit all pages against UI mocks | 🔲 Not started | Systematically compare each page to dashboard/search/paper-detail/saved mocks |
| Typography pass | 🔲 Not started | Consistent heading hierarchy, line-height, letter-spacing across all pages |
| Color & contrast audit | 🔲 Not started | Fix any low-contrast text, ensure WCAG AA on interactive elements |
| Spacing consistency | 🔲 Not started | Padding/margin tokens enforced — no ad-hoc spacing values |
| Component cleanup | 🔲 Not started | Remove duplicate/redundant UI patterns, unify card styles |
| Animation & transitions | 🔲 Not started | Smooth page transitions, skeleton → content fades, hover states |
| Empty states | 🔲 Not started | Proper illustrated empty states for saved, collections, alerts, history |
| Mobile polish | 🔲 Not started | Audit all pages on 375px — fix any overflow, tap target, scroll issues |
| Dark/light mode consistency | 🔲 Not started | Ensure all new components respect theme tokens |
| Landing page polish | 🔲 Not started | Hero, feature grid, CTA — matches landing-page mock |
| Dashboard polish | 🔲 Not started | Match dashboard mock — recent papers, activity, quick actions |
| Search results polish | 🔲 Not started | Match search-results mock — card density, filter UX, mobile view |
| Paper detail polish | 🔲 Not started | Match paper-detail mocks — layout, tabs, related panel, chat |
| Saved library polish | 🔲 Not started | Match saved.html mock — grid/list, filters, bulk actions |

---

## Phase 12 — Testing & QA (Full Coverage)

| Task | Status | Notes |
|---|---|---|
| Backend unit tests — all providers | 🔲 Not started | Expand coverage to PubMed edge cases, Crossref, Unpaywall failures |
| Backend integration tests | 🔲 Not started | Full search pipeline with mocked HTTP (httpx mock), end-to-end response shape |
| Auth flow tests | 🔲 Not started | Sign up, login, logout, token expiry, RLS enforcement |
| Supabase CRUD tests | 🔲 Not started | Saved papers, collections, alerts, history — happy + error paths |
| Alert delivery tests | 🔲 Not started | Scheduler trigger, diff detection, email dispatch mocked |
| Frontend component tests (Vitest) | 🔲 Not started | SearchResultsPanel, SynthesisPanel, PaperDetailShell, Collections |
| E2E tests (Playwright) | 🔲 Not started | Full user flows: search → save → collection → export → alert |
| Search flow E2E | 🔲 Not started | Type query → results appear → synthesis loads → save paper |
| Auth flow E2E | 🔲 Not started | Sign up → login → data persists → logout → data gone |
| Collections flow E2E | 🔲 Not started | Create collection → add papers → export → delete |
| Alert flow E2E | 🔲 Not started | Create alert → trigger run → see new count → view papers |
| Mobile E2E | 🔲 Not started | All critical flows on mobile viewport (Playwright device emulation) |
| Performance audit | 🔲 Not started | Lighthouse scores, Core Web Vitals, bundle size analysis |
| Accessibility audit | 🔲 Not started | axe-core, keyboard navigation, screen reader pass |
| Load testing | 🔲 Not started | k6 or Locust — concurrent search requests, synthesis queue under load |

---

## Current Focus

**Phase 5 complete. Starting Phase 6 — Paper detail (related papers, notes, PDF viewer).**

This is the highest-leverage phase: it replaces localStorage (fragile, device-locked) with a real database, enables user accounts, and is a prerequisite for Phases 7 (alert delivery) and 10 (memory + agents). Every feature built after this will be properly persisted and multi-device.

AI synthesis is complete enough for now (Gemini + Ollama + extractive fallback, async polling). Final synthesis polish (streaming tokens, mind map) happens in Phase 4 final, after all other features are built.
