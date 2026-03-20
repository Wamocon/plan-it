/**
 * Infrastruktur-Validierungstests für die Supabase-Konfiguration.
 * Prüft .env.example, Supabase-Migrations und Seed-Skript auf Vollständigkeit.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..', '..');

function readRoot(file: string): string {
  const full = join(ROOT, file);
  if (!existsSync(full)) throw new Error(`Datei nicht gefunden: ${full}`);
  return readFileSync(full, 'utf8');
}

// ── .env.example ─────────────────────────────────────────────

describe('.env.example – Vollständigkeit', () => {
  let content: string;

  beforeAll(() => {
    content = readRoot('.env.example');
  });

  it('Datei existiert', () => {
    expect(existsSync(join(ROOT, '.env.example'))).toBe(true);
  });

  it('enthält NEXT_PUBLIC_SUPABASE_URL', () => {
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL');
  });

  it('enthält NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });

  it('enthält SUPABASE_SERVICE_ROLE_KEY', () => {
    expect(content).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('enthält NEXT_PUBLIC_DB_SCHEMA', () => {
    expect(content).toContain('NEXT_PUBLIC_DB_SCHEMA');
  });

  it('enthält GOOGLE_AI_API_KEY', () => {
    expect(content).toContain('GOOGLE_AI_API_KEY');
  });
});

// ── Supabase Migrations ──────────────────────────────────────

describe('supabase/migrations – Produktionsschema', () => {
  let sql: string;

  beforeAll(() => {
    sql = readRoot('supabase/migrations/20240101000000_initial_schema.sql');
  });

  it('Datei existiert', () => {
    expect(existsSync(join(ROOT, 'supabase/migrations/20240101000000_initial_schema.sql'))).toBe(true);
  });

  it('pgcrypto-Erweiterung wird aktiviert', () => {
    expect(sql).toContain('pgcrypto');
  });

  it('Tabelle projects ist vorhanden', () => {
    expect(sql).toMatch(/create table/i);
    expect(sql).toContain('projects');
  });

  it('Tabelle tasks ist vorhanden', () => {
    expect(sql).toContain('tasks');
  });

  it('Tabelle ai_configs ist vorhanden', () => {
    expect(sql).toContain('ai_configs');
  });

  it('Tabelle jira_configs ist vorhanden', () => {
    expect(sql).toContain('jira_configs');
  });

  it('Row Level Security ist aktiviert', () => {
    expect(sql).toMatch(/enable row level security/i);
  });
});

// ── Schema-Trennungs-Migration ────────────────────────────────

describe('supabase/migrations – Schema-Trennung (prod/test)', () => {
  let sql: string;

  beforeAll(() => {
    sql = readRoot('supabase/migrations/20260320000000_two_schema_separation.sql');
  });

  it('Datei existiert', () => {
    expect(existsSync(join(ROOT, 'supabase/migrations/20260320000000_two_schema_separation.sql'))).toBe(true);
  });

  it('prod-Schema wird angelegt', () => {
    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS prod");
  });

  it('test-Schema wird angelegt', () => {
    expect(sql).toContain("CREATE SCHEMA IF NOT EXISTS test");
  });

  it('Berechtigungen für anon-Role sind gesetzt', () => {
    expect(sql).toContain('GRANT USAGE ON SCHEMA prod TO anon');
    expect(sql).toContain('GRANT USAGE ON SCHEMA test TO anon');
  });
});

// ── Seed-Skript ───────────────────────────────────────────────

describe('scripts/seed-supabase.ts – Vollständigkeit', () => {
  let content: string;

  beforeAll(() => {
    content = readRoot('scripts/seed-supabase.ts');
  });

  it('Datei existiert', () => {
    expect(existsSync(join(ROOT, 'scripts/seed-supabase.ts'))).toBe(true);
  });

  it('verwendet NEXT_PUBLIC_SUPABASE_URL', () => {
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL');
  });

  it('verwendet SUPABASE_SERVICE_ROLE_KEY', () => {
    expect(content).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('verwendet SEED_USER_ID', () => {
    expect(content).toContain('SEED_USER_ID');
  });

  it('verwendet Schema-Konfiguration (test/prod)', () => {
    expect(content).toContain('NEXT_PUBLIC_DB_SCHEMA');
    expect(content).toContain("db: { schema");
  });

  it('enthält mindestens 10 Projekte', () => {
    const projectCount = (content.match(/projectName:/g) ?? []).length;
    expect(projectCount).toBeGreaterThanOrEqual(10);
  });

  it('enthält Tasks für Projekte', () => {
    expect(content).toContain('tasks');
  });
});

// ── Supabase Client ───────────────────────────────────────────

describe('src/lib/supabase/client.ts – Konfiguration', () => {
  let content: string;

  beforeAll(() => {
    content = readRoot('src/lib/supabase/client.ts');
  });

  it('Guard für fehlende Env-Vars vorhanden', () => {
    expect(content).toContain('throw new Error');
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL');
  });

  it('Schema wird aus Umgebungsvariable gelesen', () => {
    expect(content).toContain('NEXT_PUBLIC_DB_SCHEMA');
    expect(content).toContain('db: { schema }');
  });
});
