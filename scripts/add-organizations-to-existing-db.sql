-- ============================================================
-- plan-it – Organisations-Modul (Addendum)
-- Sicher auf einer BESTEHENDEN Datenbank ausführen.
-- Bestehende Tabellen/Daten werden NICHT verändert.
-- Gilt für alle drei Schemas: public, prod, test
--
-- Ausführen im Supabase SQL-Editor:
--   Dashboard → SQL Editor → "New query" → Run
-- ============================================================

-- ╔══════════════════════════════════════════════════════════╗
-- ║  Hilfsprozedur – einmalig anlegen, am Ende aufräumen    ║
-- ╚══════════════════════════════════════════════════════════╝
create or replace function pg_temp.add_org_tables(schema_name text)
returns void language plpgsql as $fn$
begin

  -- ── 1. organizations ───────────────────────────────────────
  execute format('
    create table if not exists %I.organizations (
      id          uuid primary key default gen_random_uuid(),
      name        text not null,
      slug        text not null unique,
      description text,
      created_by  uuid not null references auth.users(id) on delete restrict,
      created_at  timestamptz not null default now(),
      updated_at  timestamptz not null default now()
    )', schema_name);

  execute format('alter table %I.organizations enable row level security', schema_name);

  -- Trigger (set_updated_at muss im jeweiligen Schema existieren)
  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = schema_name and c.relname = 'organizations' and t.tgname = 'organizations_updated_at'
  ) then
    execute format('
      create trigger organizations_updated_at
        before update on %I.organizations
        for each row execute function %I.set_updated_at()', schema_name, schema_name);
  end if;

  -- ── 2. org_members ─────────────────────────────────────────
  execute format('
    create table if not exists %I.org_members (
      id         uuid primary key default gen_random_uuid(),
      org_id     uuid not null references %I.organizations(id) on delete cascade,
      user_id    uuid not null references auth.users(id) on delete cascade,
      role       text not null default ''member''
                 check (role in (''owner'', ''admin'', ''member'')),
      created_at timestamptz not null default now(),
      unique (org_id, user_id)
    )', schema_name, schema_name);

  execute format('alter table %I.org_members enable row level security', schema_name);

  -- ── 3. org_id-Spalte in projects ───────────────────────────
  execute format('
    alter table %I.projects
      add column if not exists org_id uuid references %I.organizations(id) on delete set null',
    schema_name, schema_name);

  -- ── 4. RLS-Policies: organizations ─────────────────────────
  if not exists (select 1 from pg_policies where schemaname = schema_name and tablename = 'organizations' and policyname = 'orgs: Mitglieder lesen') then
    execute format('
      create policy "orgs: Mitglieder lesen" on %I.organizations for select
      using (exists (select 1 from %I.org_members m where m.org_id = id and m.user_id = auth.uid()))',
      schema_name, schema_name);
  end if;

  if not exists (select 1 from pg_policies where schemaname = schema_name and tablename = 'organizations' and policyname = 'orgs: Erstellen') then
    execute format('
      create policy "orgs: Erstellen" on %I.organizations for insert
      with check (auth.uid() = created_by)', schema_name);
  end if;

  if not exists (select 1 from pg_policies where schemaname = schema_name and tablename = 'organizations' and policyname = 'orgs: Owner/Admin aktualisiert') then
    execute format('
      create policy "orgs: Owner/Admin aktualisiert" on %I.organizations for update
      using (exists (select 1 from %I.org_members m where m.org_id = id and m.user_id = auth.uid() and m.role in (''owner'',''admin'')))',
      schema_name, schema_name);
  end if;

  if not exists (select 1 from pg_policies where schemaname = schema_name and tablename = 'organizations' and policyname = 'orgs: Owner löscht') then
    execute format('
      create policy "orgs: Owner löscht" on %I.organizations for delete
      using (exists (select 1 from %I.org_members m where m.org_id = id and m.user_id = auth.uid() and m.role = ''owner''))',
      schema_name, schema_name);
  end if;

  -- ── 5. RLS-Policies: org_members ───────────────────────────
  if not exists (select 1 from pg_policies where schemaname = schema_name and tablename = 'org_members' and policyname = 'org_members: lesen') then
    execute format('
      create policy "org_members: lesen" on %I.org_members for select
      using (exists (select 1 from %I.org_members m2 where m2.org_id = org_id and m2.user_id = auth.uid()))',
      schema_name, schema_name);
  end if;

  if not exists (select 1 from pg_policies where schemaname = schema_name and tablename = 'org_members' and policyname = 'org_members: Owner/Admin fügt hinzu') then
    execute format('
      create policy "org_members: Owner/Admin fügt hinzu" on %I.org_members for insert
      with check (
        exists (select 1 from %I.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in (''owner'',''admin''))
        or (
          auth.uid() = user_id and role = ''owner''
          and not exists (select 1 from %I.org_members m where m.org_id = org_id)
        )
      )', schema_name, schema_name, schema_name);
  end if;

  if not exists (select 1 from pg_policies where schemaname = schema_name and tablename = 'org_members' and policyname = 'org_members: Owner/Admin aktualisiert') then
    execute format('
      create policy "org_members: Owner/Admin aktualisiert" on %I.org_members for update
      using (exists (select 1 from %I.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in (''owner'',''admin'')))',
      schema_name, schema_name);
  end if;

  if not exists (select 1 from pg_policies where schemaname = schema_name and tablename = 'org_members' and policyname = 'org_members: Owner/Admin entfernt') then
    execute format('
      create policy "org_members: Owner/Admin entfernt" on %I.org_members for delete
      using (
        user_id = auth.uid()
        or exists (select 1 from %I.org_members m where m.org_id = org_id and m.user_id = auth.uid() and m.role in (''owner'',''admin''))
      )', schema_name, schema_name);
  end if;

  -- ── 6. user_profiles INSERT-Policy ─────────────────────────
  if not exists (select 1 from pg_policies where schemaname = schema_name and tablename = 'user_profiles' and policyname = 'user_profiles: eigenen Eintrag anlegen') then
    execute format('
      create policy "user_profiles: eigenen Eintrag anlegen" on %I.user_profiles for insert
      with check (auth.uid() = user_id)', schema_name);
  end if;

  -- ── 7. Fehlende user_profiles für bestehende User ──────────
  execute format('
    insert into %I.user_profiles (user_id, role)
    select id, ''user'' from auth.users
    on conflict (user_id) do nothing', schema_name);

end;
$fn$;

-- ╔══════════════════════════════════════════════════════════╗
-- ║  Für alle drei Schemas ausführen                        ║
-- ╚══════════════════════════════════════════════════════════╝

-- public (immer vorhanden)
select pg_temp.add_org_tables('public');

-- prod (nur wenn Schema existiert)
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'prod') then
    perform pg_temp.add_org_tables('prod');
    raise notice 'prod: Organisations-Tabellen angelegt.';
  else
    raise notice 'prod: Schema nicht vorhanden – übersprungen.';
  end if;
end $$;

-- test (nur wenn Schema existiert)
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'test') then
    perform pg_temp.add_org_tables('test');
    raise notice 'test: Organisations-Tabellen angelegt.';
  else
    raise notice 'test: Schema nicht vorhanden – übersprungen.';
  end if;
end $$;

