/**
 * Infrastruktur-Validierungstests für das lokale Docker-Setup.
 * Pfadüberdeckung: Alle Pflichtfelder, Services, Tabellen und Constraints werden geprüft.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..', '..');

// ── Hilfsfunktionen ──────────────────────────────────────────

function readRoot(file: string): string {
  const full = join(ROOT, file);
  if (!existsSync(full)) throw new Error(`Datei nicht gefunden: ${full}`);
  return readFileSync(full, 'utf8');
}

function parseYamlServices(content: string): string[] {
  return [...content.matchAll(/^  (\w+):/gm)].map(m => m[1]);
}

// ── docker-compose.yml ───────────────────────────────────────

describe('docker-compose.yml – Struktur', () => {
  let content: string;

  beforeAll(() => {
    content = readRoot('docker-compose.yml');
  });

  it('Datei existiert', () => {
    expect(existsSync(join(ROOT, 'docker-compose.yml'))).toBe(true);
  });

  it('enthält postgres-Service', () => {
    expect(content).toContain('postgres:');
  });

  it('enthält pgadmin-Service', () => {
    expect(content).toContain('pgadmin:');
  });

  it('postgres nutzt Image postgres:16-alpine', () => {
    expect(content).toMatch(/image:\s*postgres:16-alpine/);
  });

  it('postgres ist auf Port 5432 gemappt', () => {
    expect(content).toContain("'5432:5432'");
  });

  it('pgAdmin ist auf Port 5050 gemappt', () => {
    expect(content).toContain("'5050:80'");
  });

  it('postgres hat Healthcheck definiert', () => {
    expect(content).toContain('healthcheck:');
    expect(content).toContain('pg_isready');
  });

  it('pgAdmin hängt von postgres ab (depends_on)', () => {
    const pgadminSection = content.split('pgadmin:')[1];
    expect(pgadminSection).toContain('depends_on:');
    expect(pgadminSection).toContain('postgres');
  });

  it('Migrations-Verzeichnis ist als Volume eingebunden', () => {
    expect(content).toContain('./supabase/migrations:/docker-entrypoint-initdb.d');
  });

  it('pgAdmin-Server-Konfiguration ist als Volume eingebunden', () => {
    expect(content).toContain('./docker/pgadmin-servers.json');
  });

  it('Datenbank-Volumen ist deklariert', () => {
    expect(content).toContain('postgres_data:');
  });

  it('pgAdmin-Volumen ist deklariert', () => {
    expect(content).toContain('pgadmin_data:');
  });

  it('environment: POSTGRES_DB = archplanner', () => {
    expect(content).toContain('POSTGRES_DB: archplanner');
  });
});

// ── pgAdmin Servers-Konfiguration ────────────────────────────

describe('docker/pgadmin-servers.json – Struktur', () => {
  let config: Record<string, unknown>;

  beforeAll(() => {
    config = JSON.parse(readRoot('docker/pgadmin-servers.json'));
  });

  it('Datei ist valides JSON', () => {
    expect(config).toBeDefined();
  });

  it('enthält mindestens einen Server-Eintrag', () => {
    expect(Object.keys(config.Servers as object).length).toBeGreaterThan(0);
  });

  it('Server pegt auf postgres Host', () => {
    const servers = config.Servers as Record<string, Record<string, unknown>>;
    const server = Object.values(servers)[0];
    expect(server.Host).toBe('postgres');
  });

  it('Server nutzt Port 5432', () => {
    const servers = config.Servers as Record<string, Record<string, unknown>>;
    const server = Object.values(servers)[0];
    expect(server.Port).toBe(5432);
  });

  it('Server verbindet mit archplanner Datenbank', () => {
    const servers = config.Servers as Record<string, Record<string, unknown>>;
    const server = Object.values(servers)[0];
    expect(server.MaintenanceDB).toBe('archplanner');
  });
});

// ── Lokales SQL-Migrations-Schema ────────────────────────────

describe('supabase/migrations – Lokales Dev-Schema', () => {
  let sql: string;

  beforeAll(() => {
    sql = readRoot('supabase/migrations/00000000000000_local_dev_schema.sql');
  });

  it('Datei existiert', () => {
    expect(existsSync(join(ROOT, 'supabase/migrations/00000000000000_local_dev_schema.sql'))).toBe(true);
  });

  it('pgcrypto-Erweiterung wird aktiviert', () => {
    expect(sql).toContain('create extension if not exists "pgcrypto"');
  });

  it('local_users-Tabelle ist vorhanden', () => {
    expect(sql).toMatch(/create table if not exists local_users/i);
  });

  it('Tabelle ai_configs ist vorhanden', () => {
    expect(sql).toMatch(/create table if not exists ai_configs/i);
  });

  it('Tabelle jira_configs ist vorhanden', () => {
    expect(sql).toMatch(/create table if not exists jira_configs/i);
  });

  it('Tabelle projects ist vorhanden', () => {
    expect(sql).toMatch(/create table if not exists projects/i);
  });

  it('Tabelle tasks ist vorhanden', () => {
    expect(sql).toMatch(/create table if not exists tasks/i);
  });

  it('Tabelle chat_messages ist vorhanden', () => {
    expect(sql).toMatch(/create table if not exists chat_messages/i);
  });

  it('Tabelle analysis_snapshots ist vorhanden', () => {
    expect(sql).toMatch(/create table if not exists analysis_snapshots/i);
  });

  it('tasks.status hat CHECK-Constraint', () => {
    const tasksSection = sql.split('create table if not exists tasks')[1].split(');')[0];
    expect(tasksSection).toContain("check (status in ('open', 'in-progress', 'done'))");
  });

  it('chat_messages.role hat CHECK-Constraint', () => {
    const chatSection = sql.split('create table if not exists chat_messages')[1].split(');')[0];
    expect(chatSection).toContain("check (role in ('user', 'assistant'))");
  });

  it('projects hat updated_at-Trigger', () => {
    expect(sql).toMatch(/create trigger projects_updated_at/i);
  });

  it('tasks hat updated_at-Trigger', () => {
    expect(sql).toMatch(/create trigger tasks_updated_at/i);
  });

  it('Testdaten (Demo-Projekt) werden eingefügt', () => {
    expect(sql).toContain('insert into projects');
    expect(sql).toContain('Demo-Projekt');
  });

  it('Testuser dev@local.test wird angelegt', () => {
    expect(sql).toContain('dev@local.test');
  });

  it('ai_configs.provider hat CHECK-Constraint', () => {
    const aiSection = sql.split('create table if not exists ai_configs')[1].split(');')[0];
    expect(aiSection).toContain("check (provider in ('gemini', 'openai'))");
  });
});

// Produktions-Schema-Tests befinden sich auf feature/supabase-integration

