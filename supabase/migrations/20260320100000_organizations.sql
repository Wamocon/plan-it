-- ============================================================
-- archplanner – Organisations-Modul
-- Unternehmen als übergeordnete Einheit mit Teams, Projekten
-- und Mitgliedern.
-- ============================================================

-- ── organizations ────────────────────────────────────────────
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

-- ── org_members ───────────────────────────────────────────────
-- Rollen innerhalb einer Organisation:
--   owner  – Gründer; volle Kontrolle, kann nicht entfernt werden
--   admin  – Mitglieder verwalten, Projekte verwalten
--   member – Lesend + eigene Projekte verwalten
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

-- ── Projekte: optionale Organisations-Zuordnung ───────────────
alter table public.projects
  add column if not exists org_id uuid references public.organizations(id) on delete set null;

-- ── RLS-Policies: organizations ──────────────────────────────

-- Nur Mitglieder dürfen eine Org sehen
create policy "orgs: Mitglieder lesen"
  on public.organizations for select
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = id and m.user_id = auth.uid()
    )
  );

-- Jeder eingeloggte User darf eine Org erstellen
create policy "orgs: Erstellen"
  on public.organizations for insert
  with check (auth.uid() = created_by);

-- Nur Owner/Admin dürfen aktualisieren
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

-- Nur Owner darf die Org löschen
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

-- ── RLS-Policies: org_members ─────────────────────────────────

-- Mitglieder der Org dürfen alle Mitglieder sehen
create policy "org_members: lesen"
  on public.org_members for select
  using (
    exists (
      select 1 from public.org_members m2
      where m2.org_id = org_id and m2.user_id = auth.uid()
    )
  );

-- Nur Owner/Admin dürfen Mitglieder hinzufügen
create policy "org_members: Owner/Admin fügt hinzu"
  on public.org_members for insert
  with check (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
    -- Sonderfall: Gründer fügt sich selbst als owner ein (kein Eintrag existiert noch)
    or (
      auth.uid() = user_id
      and role = 'owner'
      and not exists (
        select 1 from public.org_members m
        where m.org_id = org_id
      )
    )
  );

-- Nur Owner/Admin dürfen Rollen ändern (Owner-Rolle kann nicht entzogen werden)
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

-- Owner/Admin darf Mitglieder entfernen; jeder darf sich selbst entfernen
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
