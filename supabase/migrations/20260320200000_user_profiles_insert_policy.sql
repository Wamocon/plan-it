-- ============================================================
-- Fehlende INSERT-Policy für user_profiles
-- Ermöglicht authentifizierten Usern das Anlegen des eigenen Profils
-- (z.B. bei Accounts die vor dem handle_new_user-Trigger registriert wurden).
-- ============================================================

-- Public Schema
create policy "user_profiles: eigenen Eintrag anlegen"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

-- Prod Schema (falls vorhanden)
create policy "user_profiles: eigenen Eintrag anlegen"
  on prod.user_profiles for insert
  with check (auth.uid() = user_id);

-- Test Schema (falls vorhanden)
create policy "user_profiles: eigenen Eintrag anlegen"
  on test.user_profiles for insert
  with check (auth.uid() = user_id);
