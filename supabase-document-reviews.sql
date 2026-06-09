create extension if not exists pgcrypto;

create table if not exists public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_type text,
  review_mode text not null check (review_mode in ('subsidy', 'contract', 'lease', 'notice')),
  farmer_context text,
  extracted_text_preview text,
  analysis text not null,
  model text,
  risk_level text check (risk_level in ('low', 'medium', 'high', 'unknown')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agrinexus_cases (
  id uuid primary key default gen_random_uuid(),
  product text not null check (product in ('core', 'law', 'terraiq', 'academy', 'fieldlot', 'admin')),
  case_type text not null,
  title text not null,
  source_table text,
  source_id uuid,
  summary text not null,
  risk_level text not null default 'unknown' check (risk_level in ('low', 'medium', 'high', 'unknown')),
  recommended_action text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists document_reviews_created_at_idx on public.document_reviews (created_at desc);
create index if not exists document_reviews_review_mode_idx on public.document_reviews (review_mode);
create index if not exists document_reviews_risk_level_idx on public.document_reviews (risk_level);

create index if not exists agrinexus_cases_created_at_idx on public.agrinexus_cases (created_at desc);
create index if not exists agrinexus_cases_product_idx on public.agrinexus_cases (product);
create index if not exists agrinexus_cases_case_type_idx on public.agrinexus_cases (case_type);
create index if not exists agrinexus_cases_risk_level_idx on public.agrinexus_cases (risk_level);
create index if not exists agrinexus_cases_source_idx on public.agrinexus_cases (source_table, source_id);

alter table public.document_reviews enable row level security;
alter table public.agrinexus_cases enable row level security;

drop policy if exists "Service role can manage document reviews" on public.document_reviews;
create policy "Service role can manage document reviews"
  on public.document_reviews
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage Agrinexus cases" on public.agrinexus_cases;
create policy "Service role can manage Agrinexus cases"
  on public.agrinexus_cases
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');