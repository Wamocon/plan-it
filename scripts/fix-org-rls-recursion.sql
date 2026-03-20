-- ============================================================
-- plan-it – RLS-Policy-Fix: Endlosrekursion in org_members
--
-- Problem: SELECT- und INSERT-Policies auf org_members lesen
-- org_members selbst → PostgreSQL bricht mit ERROR 500 ab.
--
-- Lösung: Zwei Security-Definer-Funktionen als "RLS-Brücke".
-- Diese laufen mit den Rechten des Erstellers (postgres) und
-- umgehen damit RLS-Rekursion, ohne RLS zu deaktivieren.
--
-- Ausführen im Supabase SQL-Editor:
--   Dashboard → SQL Editor → "New query" → Run
-- ============================================================

-- ── Hilfsfunktionen (public Schema) ──────────────────────────

-- Prüft ob der aktuelle User Mitglied einer Org ist
create or replace function public.is_org_member(p_org_id uuid)
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from public.org_members
    where org_id = p_org_id and user_id = auth.uid()
  );
$$;

-- Prüft ob der aktuelle User Owner oder Admin einer Org ist
create or replace function public.is_org_admin_or_owner(p_org_id uuid)
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from public.org_members
    where org_id = p_org_id and user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

grant execute on function public.is_org_member(uuid)          to authenticated;
grant execute on function public.is_org_admin_or_owner(uuid)  to authenticated;

-- ── Alle rekursiven Policies ersetzen (public) ────────────────

-- organizations
drop policy if exists "orgs: Mitglieder lesen"        on public.organizations;
drop policy if exists "orgs: Owner/Admin aktualisiert" on public.organizations;
drop policy if exists "orgs: Owner löscht"             on public.organizations;

create policy "orgs: Mitglieder lesen"
  on public.organizations for select
  using (public.is_org_member(id));

create policy "orgs: Owner/Admin aktualisiert"
  on public.organizations for update
  using (public.is_org_admin_or_owner(id));

create policy "orgs: Owner löscht"
  on public.organizations for delete
  using (
    exists (
      select 1 from public.org_members
      where org_id = id and user_id = auth.uid() and role = 'owner'
    )
  );

-- org_members
drop policy if exists "org_members: lesen"              on public.org_members;
drop policy if exists "org_members: Owner/Admin fügt hinzu" on public.org_members;
drop policy if exists "org_members: Owner/Admin aktualisiert" on public.org_members;
drop policy if exists "org_members: Owner/Admin entfernt" on public.org_members;

create policy "org_members: lesen"
  on public.org_members for select
  using (public.is_org_member(org_id));

create policy "org_members: Owner/Admin fügt hinzu"
  on public.org_members for insert
  with check (
    public.is_org_admin_or_owner(org_id)
    or (
      -- Gründer trägt sich selbst als owner ein (erste Zeile der Org)
      auth.uid() = user_id
      and role = 'owner'
      and not public.is_org_member(org_id)
    )
  );

create policy "org_members: Owner/Admin aktualisiert"
  on public.org_members for update
  using (public.is_org_admin_or_owner(org_id));

create policy "org_members: Owner/Admin entfernt"
  on public.org_members for delete
  using (
    user_id = auth.uid()
    or public.is_org_admin_or_owner(org_id)
  );

-- ── prod Schema (falls vorhanden) ─────────────────────────────
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'prod') then
    execute $x$
      create or replace function prod.is_org_member(p_org_id uuid)
      returns boolean language sql stable security definer
      set search_path = prod as $f$
        select exists (select 1 from prod.org_members where org_id = p_org_id and user_id = auth.uid());
      $f$;
      create or replace function prod.is_org_admin_or_owner(p_org_id uuid)
      returns boolean language sql stable security definer
      set search_path = prod as $f$
        select exists (select 1 from prod.org_members where org_id = p_org_id and user_id = auth.uid() and role in ('owner','admin'));
      $f$;
      grant execute on function prod.is_org_member(uuid)         to authenticated;
      grant execute on function prod.is_org_admin_or_owner(uuid) to authenticated;

      drop policy if exists "orgs: Mitglieder lesen"             on prod.organizations;
      drop policy if exists "orgs: Owner/Admin aktualisiert"     on prod.organizations;
      drop policy if exists "orgs: Owner löscht"                 on prod.organizations;
      drop policy if exists "org_members: lesen"                 on prod.org_members;
      drop policy if exists "org_members: Owner/Admin fügt hinzu" on prod.org_members;
      drop policy if exists "org_members: Owner/Admin aktualisiert" on prod.org_members;
      drop policy if exists "org_members: Owner/Admin entfernt"  on prod.org_members;

      create policy "orgs: Mitglieder lesen"         on prod.organizations for select using (prod.is_org_member(id));
      create policy "orgs: Owner/Admin aktualisiert" on prod.organizations for update using (prod.is_org_admin_or_owner(id));
      create policy "orgs: Owner löscht"             on prod.organizations for delete using (exists (select 1 from prod.org_members where org_id = id and user_id = auth.uid() and role = 'owner'));
      create policy "org_members: lesen"             on prod.org_members for select using (prod.is_org_member(org_id));
      create policy "org_members: Owner/Admin fügt hinzu" on prod.org_members for insert with check (prod.is_org_admin_or_owner(org_id) or (auth.uid() = user_id and role = 'owner' and not prod.is_org_member(org_id)));
      create policy "org_members: Owner/Admin aktualisiert" on prod.org_members for update using (prod.is_org_admin_or_owner(org_id));
      create policy "org_members: Owner/Admin entfernt" on prod.org_members for delete using (user_id = auth.uid() or prod.is_org_admin_or_owner(org_id));
    $x$;
    raise notice 'prod: RLS-Policies aktualisiert.';
  else
    raise notice 'prod: Schema nicht vorhanden – übersprungen.';
  end if;
end $$;

-- ── test Schema (falls vorhanden) ─────────────────────────────
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'test') then
    execute $x$
      create or replace function test.is_org_member(p_org_id uuid)
      returns boolean language sql stable security definer
      set search_path = test as $f$
        select exists (select 1 from test.org_members where org_id = p_org_id and user_id = auth.uid());
      $f$;
      create or replace function test.is_org_admin_or_owner(p_org_id uuid)
      returns boolean language sql stable security definer
      set search_path = test as $f$
        select exists (select 1 from test.org_members where org_id = p_org_id and user_id = auth.uid() and role in ('owner','admin'));
      $f$;
      grant execute on function test.is_org_member(uuid)         to authenticated;
      grant execute on function test.is_org_admin_or_owner(uuid) to authenticated;

      drop policy if exists "orgs: Mitglieder lesen"             on test.organizations;
      drop policy if exists "orgs: Owner/Admin aktualisiert"     on test.organizations;
      drop policy if exists "orgs: Owner löscht"                 on test.organizations;
      drop policy if exists "org_members: lesen"                 on test.org_members;
      drop policy if exists "org_members: Owner/Admin fügt hinzu" on test.org_members;
      drop policy if exists "org_members: Owner/Admin aktualisiert" on test.org_members;
      drop policy if exists "org_members: Owner/Admin entfernt"  on test.org_members;

      create policy "orgs: Mitglieder lesen"         on test.organizations for select using (test.is_org_member(id));
      create policy "orgs: Owner/Admin aktualisiert" on test.organizations for update using (test.is_org_admin_or_owner(id));
      create policy "orgs: Owner löscht"             on test.organizations for delete using (exists (select 1 from test.org_members where org_id = id and user_id = auth.uid() and role = 'owner'));
      create policy "org_members: lesen"             on test.org_members for select using (test.is_org_member(org_id));
      create policy "org_members: Owner/Admin fügt hinzu" on test.org_members for insert with check (test.is_org_admin_or_owner(org_id) or (auth.uid() = user_id and role = 'owner' and not test.is_org_member(org_id)));
      create policy "org_members: Owner/Admin aktualisiert" on test.org_members for update using (test.is_org_admin_or_owner(org_id));
      create policy "org_members: Owner/Admin entfernt" on test.org_members for delete using (user_id = auth.uid() or test.is_org_admin_or_owner(org_id));
    $x$;
    raise notice 'test: RLS-Policies aktualisiert.';
  else
    raise notice 'test: Schema nicht vorhanden – übersprungen.';
  end if;
end $$;

--
-- Problem: Die SELECT-Policy auf org_members fragt org_members
-- selbst ab → PostgreSQL bricht mit ERROR 500 (infinite recursion) ab.
--
-- Lösung: Security-Definer-Funktion als "RLS-Brücke" – diese
-- Funktion läuft mit den Rechten des Erstellers (postgres/service)
-- und umgeht damit die RLS, ohne sie zu deaktivieren.
--
-- Ausführen im Supabase SQL-Editor:
--   Dashboard → SQL Editor → "New query" → Run
-- ============================================================

-- ── Hilfsfunktion (security definer = kein RLS-Rekursionsproblem) ──
create or replace function public.is_org_member(p_org_id uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where org_id = p_org_id and user_id = auth.uid()
  );
$$;

-- Berechtigungen: Alle authentifizierten User dürfen die Funktion aufrufen
grant execute on function public.is_org_member(uuid) to authenticated;

-- ── Rekursive Policies ersetzen ────────────────────────────────
-- public Schema
drop policy if exists "orgs: Mitglieder lesen"         on public.organizations;
drop policy if exists "org_members: lesen"              on public.org_members;

create policy "orgs: Mitglieder lesen"
  on public.organizations for select
  using (public.is_org_member(id));

create policy "org_members: lesen"
  on public.org_members for select
  using (public.is_org_member(org_id));

-- ── prod Schema (falls vorhanden) ─────────────────────────────
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'prod') then

    execute $x$
      create or replace function prod.is_org_member(p_org_id uuid)
      returns boolean language sql stable security definer
      set search_path = prod
      as $f$
        select exists (
          select 1 from prod.org_members
          where org_id = p_org_id and user_id = auth.uid()
        );
      $f$;
      grant execute on function prod.is_org_member(uuid) to authenticated;
      drop policy if exists "orgs: Mitglieder lesen" on prod.organizations;
      drop policy if exists "org_members: lesen"      on prod.org_members;
      create policy "orgs: Mitglieder lesen" on prod.organizations for select
        using (prod.is_org_member(id));
      create policy "org_members: lesen" on prod.org_members for select
        using (prod.is_org_member(org_id));
    $x$;

    raise notice 'prod: RLS-Policies aktualisiert.';
  else
    raise notice 'prod: Schema nicht vorhanden – übersprungen.';
  end if;
end $$;

-- ── test Schema (falls vorhanden) ─────────────────────────────
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'test') then

    execute $x$
      create or replace function test.is_org_member(p_org_id uuid)
      returns boolean language sql stable security definer
      set search_path = test
      as $f$
        select exists (
          select 1 from test.org_members
          where org_id = p_org_id and user_id = auth.uid()
        );
      $f$;
      grant execute on function test.is_org_member(uuid) to authenticated;
      drop policy if exists "orgs: Mitglieder lesen" on test.organizations;
      drop policy if exists "org_members: lesen"      on test.org_members;
      create policy "orgs: Mitglieder lesen" on test.organizations for select
        using (test.is_org_member(id));
      create policy "org_members: lesen" on test.org_members for select
        using (test.is_org_member(org_id));
    $x$;

    raise notice 'test: RLS-Policies aktualisiert.';
  else
    raise notice 'test: Schema nicht vorhanden – übersprungen.';
  end if;
end $$;
