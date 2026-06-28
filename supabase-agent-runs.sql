-- История на AI агентите (AgriNexus AI Leader)
-- Изпълни в Supabase SQL Editor

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  ok boolean not null default false,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  metrics jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists agent_runs_agent_id_started_at_idx
  on public.agent_runs (agent_id, started_at desc);

alter table public.agent_runs enable row level security;

-- Само service role пише; anon/authenticated без select по подразбиране
comment on table public.agent_runs is 'Run log for AgriNexus AI Leader agents (archive, guardian, learner, indexer, analyst)';
