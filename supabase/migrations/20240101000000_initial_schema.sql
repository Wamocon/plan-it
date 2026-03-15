-- ============================================================
-- archplanner – Initial Schema
-- ============================================================
-- Aktiviere UUID-Erweiterung
create extension if not exists "pgcrypto";

-- ── ai_configs ──────────────────────────────────────────────
create table public.ai_configs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  provider    text not null check (provider in ('gemini', 'openai')),
  label       text not null,
  api_key     text not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.ai_configs enable row level security;
create policy "ai_configs: eigene Einträge" on public.ai_configs
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── jira_configs ─────────────────────────────────────────────
create table public.jira_configs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  label        text not null,
  base_url     text not null,
  email        text not null,
  api_token    text not null,
  project_key  text not null,
  issue_type   text not null,
  created_at   timestamptz not null default now()
);
alter table public.jira_configs enable row level security;
create policy "jira_configs: eigene Einträge" on public.jira_configs
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── projects ─────────────────────────────────────────────────
create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  -- Wizard-Daten als JSONB (flexibles Key-Value-Objekt)
  wizard_data     jsonb not null default '{}',
  -- Analyse-Ergebnis als JSONB
  analysis        jsonb not null default '{}',
  ai_pending      boolean not null default false,
  ai_fail_reason  text check (ai_fail_reason in ('limit', 'error')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.projects enable row level security;
create policy "projects: eigene Einträge" on public.projects
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- updated_at automatisch setzen
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ── tasks ────────────────────────────────────────────────────
create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  wave_number     integer not null,
  wave_title      text not null,
  item            text not null,
  status          text not null default 'open' check (status in ('open', 'in-progress', 'done')),
  note            text,
  jira_issue_key  text,
  jira_issue_url  text,
  jira_config_id  uuid references public.jira_configs(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "tasks: eigene Einträge" on public.tasks
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ── chat_messages ────────────────────────────────────────────
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
create policy "chat_messages: eigene Einträge" on public.chat_messages
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── analysis_snapshots ───────────────────────────────────────
create table public.analysis_snapshots (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  score        integer,
  score_label  text,
  risk_count   integer not null default 0,
  high_count   integer not null default 0,
  source       text not null check (source in ('ai', 'fallback')),
  taken_at     timestamptz not null default now()
);
alter table public.analysis_snapshots enable row level security;
create policy "snapshots: eigene Einträge" on public.analysis_snapshots
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
