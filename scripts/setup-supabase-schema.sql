-- ============================================================
-- plan-it – Supabase Produktions-Schema (einmalig ausführen)
-- ============================================================
-- Dieses Skript im Supabase SQL-Editor ausführen:
--   Supabase Dashboard → SQL Editor → "New query" → Inhalt einfügen → Run
--
-- ACHTUNG: Löscht alle bestehenden Tabellen und legt sie neu an!
--          Nur ausführen, wenn noch keine Produktionsdaten vorhanden sind.
-- ============================================================

-- ── 1. Alte Tabellen entfernen (falls falsch angelegt) ────────
drop table if exists public.analysis_snapshots  cascade;
drop table if exists public.chat_messages        cascade;
drop table if exists public.tasks                cascade;
drop table if exists public.projects             cascade;
drop table if exists public.jira_configs         cascade;
drop table if exists public.ai_configs           cascade;
drop table if exists public.user_profiles        cascade;
drop table if exists public.local_users          cascade;  -- lokale Dev-Tabelle
drop function if exists public.set_updated_at()  cascade;
drop function if exists public.handle_new_user() cascade;

-- ── 2. UUID-Erweiterung ───────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── 3. ai_configs ────────────────────────────────────────────
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

-- ── 4. jira_configs ──────────────────────────────────────────
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

-- ── 5. projects ───────────────────────────────────────────────
create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  wizard_data     jsonb not null default '{}',
  analysis        jsonb not null default '{}',
  ai_pending      boolean not null default false,
  ai_fail_reason  text check (ai_fail_reason in ('limit', 'error')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.projects enable row level security;
create policy "projects: eigene Einträge" on public.projects
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ── 6. tasks ─────────────────────────────────────────────────
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

-- ── 7. chat_messages ─────────────────────────────────────────
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

-- ── 8. analysis_snapshots ────────────────────────────────────
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

-- ── 9. user_profiles (Rollen-Konzept) ────────────────────────
create table public.user_profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  role         text not null default 'user'
               check (role in ('admin', 'it-architect', 'developer', 'user')),
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.user_profiles enable row level security;

create policy "user_profiles: eigenes Profil lesen"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "user_profiles: Admin liest alle"
  on public.user_profiles for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.user_id = auth.uid() and up.role = 'admin'
    )
  );

create policy "user_profiles: Admin aktualisiert alle"
  on public.user_profiles for update
  using (
    exists (
      select 1 from public.user_profiles up
      where up.user_id = auth.uid() and up.role = 'admin'
    )
  );

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- Trigger: Profil bei Registrierung automatisch anlegen
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 10. user_profile für bereits existierende User anlegen ───
-- (Trigger wurde erst jetzt erstellt, also manuell nachholen)
insert into public.user_profiles (user_id, role)
select id, 'user' from auth.users
on conflict (user_id) do nothing;

-- ── 11. organizations ────────────────────────────────────────
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  created_by  uuid not null references auth.users(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.organizations enable row level security;

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create policy "orgs: Mitglieder lesen"
  on public.organizations for select
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = id and m.user_id = auth.uid()
    )
  );

create policy "orgs: Erstellen"
  on public.organizations for insert
  with check (auth.uid() = created_by);

create policy "orgs: Owner/Admin aktualisiert"
  on public.organizations for update
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

create policy "orgs: Owner löscht"
  on public.organizations for delete
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

-- ── 12. org_members ──────────────────────────────────────────
create table public.org_members (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member'
             check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
alter table public.org_members enable row level security;

create policy "org_members: lesen"
  on public.org_members for select
  using (
    exists (
      select 1 from public.org_members m2
      where m2.org_id = org_id and m2.user_id = auth.uid()
    )
  );

create policy "org_members: Owner/Admin fügt hinzu"
  on public.org_members for insert
  with check (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
    or (
      auth.uid() = user_id
      and role = 'owner'
      and not exists (
        select 1 from public.org_members m where m.org_id = org_id
      )
    )
  );

create policy "org_members: Owner/Admin aktualisiert"
  on public.org_members for update
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

create policy "org_members: Owner/Admin entfernt"
  on public.org_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.org_members m
      where m.org_id = org_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- ── 13. projects: org_id-Spalte ──────────────────────────────
alter table public.projects
  add column if not exists org_id uuid references public.organizations(id) on delete set null;

-- ── 14. user_profiles INSERT-Policy ─────────────────────────
create policy "user_profiles: eigenen Eintrag anlegen"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);
