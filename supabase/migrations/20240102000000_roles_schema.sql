-- ============================================================
-- archplanner – Rollen-Konzept
-- Fügt user_profiles mit Rollen-Spalte hinzu.
-- Rollen: admin | it-architect | developer | user
-- ============================================================

-- ── user_profiles ────────────────────────────────────────────
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

-- Jeder eingeloggte User darf sein eigenes Profil lesen
create policy "user_profiles: eigenes Profil lesen"
  on public.user_profiles for select
  using (auth.uid() = user_id);

-- Admins dürfen alle Profile lesen
create policy "user_profiles: Admin liest alle"
  on public.user_profiles for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.user_id = auth.uid() and up.role = 'admin'
    )
  );

-- Admins dürfen Rollen und Anzeigenamen aller Profile ändern
create policy "user_profiles: Admin aktualisiert alle"
  on public.user_profiles for update
  using (
    exists (
      select 1 from public.user_profiles up
      where up.user_id = auth.uid() and up.role = 'admin'
    )
  );

-- updated_at automatisch setzen (set_updated_at() existiert bereits aus initial_schema)
create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- ── Trigger: Profil bei Registrierung automatisch anlegen ────
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
