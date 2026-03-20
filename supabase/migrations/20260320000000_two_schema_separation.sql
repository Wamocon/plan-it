-- ============================================================
-- Schema-Trennung: prod + test
--
-- Ausführen im Supabase SQL Editor (einmalig).
-- Danach Schritt 2: Supabase Dashboard → API Settings →
-- "Extra search path" / "Exposed schemas" → prod, test eintragen.
-- ============================================================

-- ── 1. Schemas anlegen ──────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS prod;
CREATE SCHEMA IF NOT EXISTS test;

-- ── 2. Berechtigungen für PostgREST ─────────────────────────
GRANT USAGE ON SCHEMA prod TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA test TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA prod
  GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA prod
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA test
  GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA test
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ── 3. Hilfsfunktion set_updated_at (pro Schema) ────────────
CREATE OR REPLACE FUNCTION prod.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION test.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============================================================
-- 4. Tabellen – PROD-Schema
-- ============================================================

CREATE TABLE prod.ai_configs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider    text NOT NULL CHECK (provider IN ('gemini', 'openai')),
  label       text NOT NULL,
  api_key     text NOT NULL,
  is_active   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE prod.ai_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_configs: eigene Einträge" ON prod.ai_configs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE prod.jira_configs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label        text NOT NULL,
  base_url     text NOT NULL,
  email        text NOT NULL,
  api_token    text NOT NULL,
  project_key  text NOT NULL,
  issue_type   text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE prod.jira_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jira_configs: eigene Einträge" ON prod.jira_configs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE prod.projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wizard_data     jsonb NOT NULL DEFAULT '{}',
  analysis        jsonb NOT NULL DEFAULT '{}',
  ai_pending      boolean NOT NULL DEFAULT false,
  ai_fail_reason  text CHECK (ai_fail_reason IN ('limit', 'error')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE prod.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects: eigene Einträge" ON prod.projects
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON prod.projects
  FOR EACH ROW EXECUTE FUNCTION prod.set_updated_at();

CREATE TABLE prod.tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES prod.projects(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wave_number     integer NOT NULL,
  wave_title      text NOT NULL,
  item            text NOT NULL,
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'done')),
  note            text,
  jira_issue_key  text,
  jira_issue_url  text,
  jira_config_id  uuid REFERENCES prod.jira_configs(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE prod.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks: eigene Einträge" ON prod.tasks
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON prod.tasks
  FOR EACH ROW EXECUTE FUNCTION prod.set_updated_at();

CREATE TABLE prod.chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES prod.projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE prod.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages: eigene Einträge" ON prod.chat_messages
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE prod.analysis_snapshots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES prod.projects(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score        integer,
  score_label  text,
  risk_count   integer NOT NULL DEFAULT 0,
  high_count   integer NOT NULL DEFAULT 0,
  source       text NOT NULL CHECK (source IN ('ai', 'fallback')),
  taken_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE prod.analysis_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "snapshots: eigene Einträge" ON prod.analysis_snapshots
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE prod.user_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'user'
               CHECK (role IN ('admin', 'it-architect', 'developer', 'user')),
  display_name text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE prod.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles: eigenes Profil lesen" ON prod.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles: Admin liest alle" ON prod.user_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM prod.user_profiles up
            WHERE up.user_id = auth.uid() AND up.role = 'admin')
  );

CREATE POLICY "user_profiles: Admin aktualisiert alle" ON prod.user_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM prod.user_profiles up
            WHERE up.user_id = auth.uid() AND up.role = 'admin')
  );

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON prod.user_profiles
  FOR EACH ROW EXECUTE FUNCTION prod.set_updated_at();

-- PROD: Kein automatischer Trigger → Prod-Profile werden vom Admin manuell angelegt.
-- (verhindert, dass Test-User automatisch Prod-Zugriff bekommen)

-- ============================================================
-- 5. Tabellen – TEST-Schema (identisch mit prod)
-- ============================================================

CREATE TABLE test.ai_configs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider    text NOT NULL CHECK (provider IN ('gemini', 'openai')),
  label       text NOT NULL,
  api_key     text NOT NULL,
  is_active   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE test.ai_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_configs: eigene Einträge" ON test.ai_configs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE test.jira_configs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label        text NOT NULL,
  base_url     text NOT NULL,
  email        text NOT NULL,
  api_token    text NOT NULL,
  project_key  text NOT NULL,
  issue_type   text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE test.jira_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jira_configs: eigene Einträge" ON test.jira_configs
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE test.projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wizard_data     jsonb NOT NULL DEFAULT '{}',
  analysis        jsonb NOT NULL DEFAULT '{}',
  ai_pending      boolean NOT NULL DEFAULT false,
  ai_fail_reason  text CHECK (ai_fail_reason IN ('limit', 'error')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE test.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects: eigene Einträge" ON test.projects
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON test.projects
  FOR EACH ROW EXECUTE FUNCTION test.set_updated_at();

CREATE TABLE test.tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES test.projects(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wave_number     integer NOT NULL,
  wave_title      text NOT NULL,
  item            text NOT NULL,
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'done')),
  note            text,
  jira_issue_key  text,
  jira_issue_url  text,
  jira_config_id  uuid REFERENCES test.jira_configs(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE test.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks: eigene Einträge" ON test.tasks
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON test.tasks
  FOR EACH ROW EXECUTE FUNCTION test.set_updated_at();

CREATE TABLE test.chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES test.projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE test.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages: eigene Einträge" ON test.chat_messages
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE test.analysis_snapshots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES test.projects(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score        integer,
  score_label  text,
  risk_count   integer NOT NULL DEFAULT 0,
  high_count   integer NOT NULL DEFAULT 0,
  source       text NOT NULL CHECK (source IN ('ai', 'fallback')),
  taken_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE test.analysis_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "snapshots: eigene Einträge" ON test.analysis_snapshots
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE test.user_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'user'
               CHECK (role IN ('admin', 'it-architect', 'developer', 'user')),
  display_name text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE test.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles: eigenes Profil lesen" ON test.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles: Admin liest alle" ON test.user_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM test.user_profiles up
            WHERE up.user_id = auth.uid() AND up.role = 'admin')
  );

CREATE POLICY "user_profiles: Admin aktualisiert alle" ON test.user_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM test.user_profiles up
            WHERE up.user_id = auth.uid() AND up.role = 'admin')
  );

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON test.user_profiles
  FOR EACH ROW EXECUTE FUNCTION test.set_updated_at();

-- TEST: Automatisches Profil bei Registrierung
-- (Test-User bekommen automatisch Zugriff, Prod bleibt kontrolliert)
CREATE OR REPLACE FUNCTION test.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO test.user_profiles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_test
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION test.handle_new_user();

-- ============================================================
-- 6. Bestehende Daten aus public nach prod kopieren
--    (nur ausführen wenn public-Daten in prod übernommen werden sollen)
-- ============================================================
/*
INSERT INTO prod.ai_configs         SELECT * FROM public.ai_configs;
INSERT INTO prod.jira_configs       SELECT * FROM public.jira_configs;
INSERT INTO prod.projects           SELECT * FROM public.projects;
INSERT INTO prod.tasks              SELECT * FROM public.tasks;
INSERT INTO prod.chat_messages      SELECT * FROM public.chat_messages;
INSERT INTO prod.analysis_snapshots SELECT * FROM public.analysis_snapshots;
INSERT INTO prod.user_profiles      SELECT * FROM public.user_profiles;
*/

-- ============================================================
-- HINWEIS: Nach diesem Script im Supabase Dashboard unter
-- API Settings → "Exposed schemas" folgende Einträge ergänzen:
--   prod
--   test
-- ============================================================
