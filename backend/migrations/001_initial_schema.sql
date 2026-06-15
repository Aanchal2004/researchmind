-- ResearchMind — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- Supabase Auth handles the `auth.users` table automatically.

-- ─── Extensions ────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── saved_papers ──────────────────────────────────────────────────────────
create table if not exists public.saved_papers (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  paper_id    text not null,                 -- namespaced ID e.g. "arxiv:2301.00001"
  raw_json    jsonb not null,                -- full SearchResultItem snapshot
  saved_at    timestamptz not null default now(),
  unique (user_id, paper_id)
);

-- ─── collections ───────────────────────────────────────────────────────────
create table if not exists public.collections (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  accent      text not null default 'teal',  -- color accent token
  paper_ids   text[] not null default '{}',  -- ordered list of paper_ids
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── alerts ────────────────────────────────────────────────────────────────
create table if not exists public.alerts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  topic       text not null,
  sources     text[] not null default '{}',
  frequency   text not null default 'weekly', -- 'daily' | 'weekly' | 'instant'
  status      text not null default 'active',  -- 'active' | 'paused'
  new_count   int not null default 0,
  last_run_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ─── search_history ────────────────────────────────────────────────────────
create table if not exists public.search_history (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  query         text not null,
  result_count  int not null default 0,
  sources       text[] not null default '{}',
  searched_at   timestamptz not null default now()
);

-- ─── paper_notes ───────────────────────────────────────────────────────────
create table if not exists public.paper_notes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  paper_id    text not null,
  content     text not null default '',
  updated_at  timestamptz not null default now(),
  unique (user_id, paper_id)
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
create index if not exists saved_papers_user_id_idx   on public.saved_papers(user_id);
create index if not exists saved_papers_paper_id_idx  on public.saved_papers(paper_id);
create index if not exists collections_user_id_idx    on public.collections(user_id);
create index if not exists alerts_user_id_idx         on public.alerts(user_id);
create index if not exists search_history_user_id_idx on public.search_history(user_id);
create index if not exists paper_notes_user_id_idx    on public.paper_notes(user_id);
create index if not exists paper_notes_paper_id_idx   on public.paper_notes(paper_id);

-- ─── updated_at trigger ─────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger collections_updated_at
  before update on public.collections
  for each row execute function public.handle_updated_at();

create trigger paper_notes_updated_at
  before update on public.paper_notes
  for each row execute function public.handle_updated_at();

-- ─── Row-Level Security ──────────────────────────────────────────────────────
alter table public.saved_papers    enable row level security;
alter table public.collections     enable row level security;
alter table public.alerts          enable row level security;
alter table public.search_history  enable row level security;
alter table public.paper_notes     enable row level security;

-- saved_papers
create policy "Users manage own saved papers"
  on public.saved_papers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- collections
create policy "Users manage own collections"
  on public.collections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- alerts
create policy "Users manage own alerts"
  on public.alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- search_history
create policy "Users manage own search history"
  on public.search_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- paper_notes
create policy "Users manage own notes"
  on public.paper_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
