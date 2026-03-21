-- ============================================================
-- plan-it – Patch: Creator darf eigene Org lesen
--
-- Problem: Nach dem INSERT kann der Ersteller seine eigene Org
-- nicht lesen, weil is_org_member() noch kein Mitglied findet
-- (org_members-INSERT kommt eine Millisekunde später).
--
-- Lösung: Zusätzliche SELECT-Policy "Ersteller liest eigene Org".
--
-- Ausführen im Supabase SQL-Editor → Run
-- ============================================================

-- public
drop policy if exists "orgs: Ersteller liest eigene" on public.organizations;
create policy "orgs: Ersteller liest eigene"
  on public.organizations for select
  using (auth.uid() = created_by);

-- prod (falls vorhanden)
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'prod') then
    execute $x$
      drop policy if exists "orgs: Ersteller liest eigene" on prod.organizations;
      create policy "orgs: Ersteller liest eigene"
        on prod.organizations for select
        using (auth.uid() = created_by);
    $x$;
    raise notice 'prod: Creator-Policy angelegt.';
  end if;
end $$;

-- test (falls vorhanden)
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'test') then
    execute $x$
      drop policy if exists "orgs: Ersteller liest eigene" on test.organizations;
      create policy "orgs: Ersteller liest eigene"
        on test.organizations for select
        using (auth.uid() = created_by);
    $x$;
    raise notice 'test: Creator-Policy angelegt.';
  end if;
end $$;
