# 12-Week MCP + Agentic Research Assistant Roadmap

| Week | Theme | Day | Task | Expected Outcome | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | Frontend Foundation | Mon | Setup monorepo + Next.js + Tailwind | Project bootstrapped | Partial | Next.js + Tailwind app is bootstrapped, but this is not a true monorepo setup. |
| 1 | Frontend Foundation | Tue | Setup shadcn/ui + typography + dark mode | Design system initialized | Done | shadcn/ui primitives, dark-first theme tokens, and typography foundation are in place. |
| 1 | Frontend Foundation | Wed | Create sidebar/navbar layouts | Reusable layout | Done | Reusable sidebar, workspace header, mobile nav, and shell layout are implemented. |
| 1 | Frontend Foundation | Thu | Setup routing + app structure | Navigation ready | Done | Landing, dashboard, and search routes are wired with App Router route groups. |
| 1 | Frontend Foundation | Fri | Responsive fixes + cleanup | Stable UI base | Done | Main surfaces respond across desktop and mobile; base cleanup/build verification completed. |
| 1 | Frontend Foundation | Sat | Build dashboard shell | Dashboard skeleton | Done | Dashboard shell with metrics, recent papers, collections, and alerts is implemented. |
| 1 | Frontend Foundation | Sun | Buffer/debug/refactor | Catch-up day | Partial | General refactor/debugging happened during implementation, but not as a dedicated pass. |

| 2 | Search Experience | Mon | Search page layout | Search UI | Done | Search page shell with filters row, results column, and synthesis pane is implemented. |
| 2 | Search Experience | Tue | Filters + chips | Interactive filtering | Partial | Filter chips and controls are styled, but no interactive filtering logic is wired yet. |
| 2 | Search Experience | Wed | Result cards | Paper cards | Done | Reusable result card treatment is implemented in the search results list. |
| 2 | Search Experience | Thu | Synthesis panel UI | AI section | Done | Reading/synthesis panel with tabs, grounded source list, and mobile CTA is implemented. |
| 2 | Search Experience | Fri | Loading states + skeletons | Better UX | Partial | Skeleton primitive exists, but loading states are not yet integrated into the page flows. |
| 2 | Search Experience | Sat | Mobile responsiveness | Responsive pages | Done | Mobile sheet nav, bottom nav, responsive search layout, and mobile CTA are in place. |
| 2 | Search Experience | Sun | Buffer/polish | UI cleanup | Partial | Foundation is visually strong, but a full polish and interaction pass is still pending. |

| 3 | Backend API | Mon | FastAPI setup | Backend running | Not Started | |
| 3 | Backend API | Tue | Environment configs + logging | Stable configs | Not Started | |
| 3 | Backend API | Wed | Create `/search` endpoint | API ready | Not Started | |
| 3 | Backend API | Thu | Async request handling | Concurrency | Not Started | |
| 3 | Backend API | Fri | arXiv integration | First source connected | Not Started | |
| 3 | Backend API | Sat | Schema normalization | Unified results | Not Started | |
| 3 | Backend API | Sun | Buffer/debugging | Fix async/CORS issues | Not Started | |

| 4 | MCP Integrations | Mon | Setup MCP server | Tool runtime | Not Started | |
| 4 | MCP Integrations | Tue | Semantic Scholar integration | 2nd source | Not Started | |
| 4 | MCP Integrations | Wed | Crossref integration | DOI metadata | Not Started | |
| 4 | MCP Integrations | Thu | PubMed integration | Biomedical support | Not Started | |
| 4 | MCP Integrations | Fri | Parallel tool execution | Faster retrieval | Not Started | |
| 4 | MCP Integrations | Sat | Response normalization | Unified schema | Not Started | |
| 4 | MCP Integrations | Sun | Buffer/API fixes | Rate-limit handling | Not Started | |

| 5 | Search Agent | Mon | Search agent setup | Agent skeleton | Not Started | |
| 5 | Search Agent | Tue | Query planner | Smarter search | Not Started | |
| 5 | Search Agent | Wed | Deduplication logic | Duplicate handling | Not Started | |
| 5 | Search Agent | Thu | Ranking pipeline | Sorted results | Not Started | |
| 5 | Search Agent | Fri | Relevance scoring | Improved quality | Not Started | |
| 5 | Search Agent | Sat | Streaming responses | Live updates | Not Started | |
| 5 | Search Agent | Sun | Buffer/tuning | Search optimization | Not Started | |

| 6 | Synthesis Agent | Mon | Claude integration | LLM connected | Not Started | |
| 6 | Synthesis Agent | Tue | Prompt templates | Stable prompting | Not Started | |
| 6 | Synthesis Agent | Wed | Structured JSON output | Reliable parsing | Not Started | |
| 6 | Synthesis Agent | Thu | Inline citations | Grounded responses | Not Started | |
| 6 | Synthesis Agent | Fri | Key claims extraction | Research insights | Not Started | |
| 6 | Synthesis Agent | Sat | Summary caching | Cost optimization | Not Started | |
| 6 | Synthesis Agent | Sun | Buffer/debug prompts | Token fixes | Not Started | |

| 7 | Database + Auth | Mon | Supabase setup | Database online | Not Started | |
| 7 | Database + Auth | Tue | Schema creation | Core tables | Not Started | |
| 7 | Database + Auth | Wed | User auth flows | Secure login | Not Started | |
| 7 | Database + Auth | Thu | Save paper feature | Persistence | Not Started | |
| 7 | Database + Auth | Fri | Collections support | Library feature | Not Started | |
| 7 | Database + Auth | Sat | Query history | Tracking | Not Started | |
| 7 | Database + Auth | Sun | Buffer/RLS fixes | DB debugging | Not Started | |

| 8 | Paper Detail Experience | Mon | Dynamic paper routes | SEO routes | Not Started | |
| 8 | Paper Detail Experience | Tue | Abstract + metadata sections | Reader page | Not Started | |
| 8 | Paper Detail Experience | Wed | Key claims UI | Insight section | Not Started | |
| 8 | Paper Detail Experience | Thu | Related papers | Discovery | Not Started | |
| 8 | Paper Detail Experience | Fri | Citation export | BibTeX/APA | Not Started | |
| 8 | Paper Detail Experience | Sat | Ask about this paper | Agent interaction | Not Started | |
| 8 | Paper Detail Experience | Sun | Buffer/layout polish | Responsive fixes | Not Started | |

| 9 | Alerts + Background Jobs | Mon | Alert schema | Alerts DB | Not Started | |
| 9 | Alerts + Background Jobs | Tue | Cron setup | Schedulers | Not Started | |
| 9 | Alerts + Background Jobs | Wed | Redis queue | Async jobs | Not Started | |
| 9 | Alerts + Background Jobs | Thu | Notification logic | New paper alerts | Not Started | |
| 9 | Alerts + Background Jobs | Fri | Email integration | Notifications | Not Started | |
| 9 | Alerts + Background Jobs | Sat | Deduplicate alerts | Cleaner UX | Not Started | |
| 9 | Alerts + Background Jobs | Sun | Buffer/queue debugging | Retries | Not Started | |

| 10 | SEO + Discoverability | Mon | SSR/ISR setup | Indexable pages | Not Started | |
| 10 | SEO + Discoverability | Tue | Metadata generation | SEO tags | Not Started | |
| 10 | SEO + Discoverability | Wed | Sitemap + robots.txt | Search indexing | Not Started | |
| 10 | SEO + Discoverability | Thu | Topic pages | Discoverability | Not Started | |
| 10 | SEO + Discoverability | Fri | Author pages | Organic growth | Not Started | |
| 10 | SEO + Discoverability | Sat | OpenGraph previews | Social sharing | Not Started | |
| 10 | SEO + Discoverability | Sun | Buffer/hydration fixes | SEO cleanup | Not Started | |

| 11 | Performance + Reliability | Mon | Redis caching | Faster responses | Not Started | |
| 11 | Performance + Reliability | Tue | Rate limiting | Protection | Not Started | |
| 11 | Performance + Reliability | Wed | Retry handling | Reliability | Not Started | |
| 11 | Performance + Reliability | Thu | Error boundaries | Safer frontend | Not Started | |
| 11 | Performance + Reliability | Fri | Analytics setup | Tracking | Not Started | |
| 11 | Performance + Reliability | Sat | Monitoring/logging | Observability | Not Started | |
| 11 | Performance + Reliability | Sun | Buffer/perf tuning | Optimization | Not Started | |

| 12 | Launch | Mon | Final UI polish | Refined product | Not Started | |
| 12 | Launch | Tue | Deploy production infra | Live backend | Not Started | |
| 12 | Launch | Wed | GitHub README | Portfolio ready | Not Started | |
| 12 | Launch | Thu | Architecture diagrams | Presentation assets | Not Started | |
| 12 | Launch | Fri | Demo video | Showcase | Not Started | |
| 12 | Launch | Sat | Launch on Product Hunt/Reddit | Public launch | Not Started | |
| 12 | Launch | Sun | Buffer/hotfixes | Post-launch fixes | Not Started | |
