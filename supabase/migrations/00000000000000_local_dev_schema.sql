-- ============================================================
-- archplanner – Lokales Entwicklungsschema (ohne Supabase Auth)
-- Dieses Schema wird beim Start des Docker-Containers automatisch
-- angewendet (via docker-entrypoint-initdb.d/).
-- ============================================================

-- Aktiviere UUID-Erweiterung
create extension if not exists "pgcrypto";

-- ── Lokaler Testuser (ersetzt Supabase Auth für lokale Dev) ──
-- In Produktion übernimmt Supabase Auth die User-Verwaltung
create table if not exists local_users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  created_at timestamptz not null default now()
);

-- Testuser automatisch einfügen
insert into local_users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'dev@local.test')
on conflict do nothing;

-- ── ai_configs ──────────────────────────────────────────────
create table if not exists ai_configs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references local_users(id) on delete cascade,
  provider    text not null check (provider in ('gemini', 'openai')),
  label       text not null,
  api_key     text not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── jira_configs ─────────────────────────────────────────────
create table if not exists jira_configs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references local_users(id) on delete cascade,
  label        text not null,
  base_url     text not null,
  email        text not null,
  api_token    text not null,
  project_key  text not null,
  issue_type   text not null,
  created_at   timestamptz not null default now()
);

-- ── projects ─────────────────────────────────────────────────
create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references local_users(id) on delete cascade,
  wizard_data     jsonb not null default '{}',
  analysis        jsonb not null default '{}',
  ai_pending      boolean not null default false,
  ai_fail_reason  text check (ai_fail_reason in ('limit', 'error')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at before update on projects
  for each row execute function set_updated_at();

-- ── tasks ────────────────────────────────────────────────────
create table if not exists tasks (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  user_id         uuid not null references local_users(id) on delete cascade,
  wave_number     integer not null,
  wave_title      text not null,
  item            text not null,
  status          text not null default 'open' check (status in ('open', 'in-progress', 'done')),
  note            text,
  jira_issue_key  text,
  jira_issue_url  text,
  jira_config_id  uuid references jira_configs(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger tasks_updated_at before update on tasks
  for each row execute function set_updated_at();

-- ── chat_messages ────────────────────────────────────────────
create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  user_id     uuid not null references local_users(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

-- ── analysis_snapshots ───────────────────────────────────────
create table if not exists analysis_snapshots (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  user_id      uuid not null references local_users(id) on delete cascade,
  score        integer,
  score_label  text,
  risk_count   integer not null default 0,
  high_count   integer not null default 0,
  source       text not null check (source in ('ai', 'fallback')),
  taken_at     timestamptz not null default now()
);

-- ── Testdaten ────────────────────────────────────────────────
-- Beispielprojekt für lokale Entwicklung
insert into projects (id, user_id, wizard_data, analysis) values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  '{
    "projectName": "Demo-Projekt",
    "teamSize": "5-10",
    "techStack": "React, Node.js, PostgreSQL",
    "hasTests": "partial",
    "hasCiCd": "yes",
    "hasMonitoring": "no"
  }',
  '{
    "risks": [],
    "soll": [],
    "waves": [],
    "summary": "Lokales Testprojekt – noch keine KI-Analyse durchgeführt.",
    "source": "fallback"
  }'
) on conflict do nothing;
