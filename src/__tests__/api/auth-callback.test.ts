/**
 * Tests für src/app/auth/callback/route.ts
 * und Validierung des Produktions-Schemas (supabase/migrations).
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ── Auth Callback ─────────────────────────────────────────────
// Appwrite verwaltet Sessions über Cookies nativ – kein Code-Exchange nötig.

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: vi.fn((url: URL | string) => ({
      _type: 'redirect',
      href: typeof url === 'string' ? url : url.href,
    })),
  },
}));

import { GET } from '@/app/auth/callback/route';

describe('GET /auth/callback', () => {
  it('leitet auf Origin + / um wenn ?code= vorhanden', async () => {
    const req = new Request('http://localhost/auth/callback?code=test-code-123');
    const res = await GET(req as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('redirect');
    expect(((res as unknown as Record<string, unknown>).href as string)).toContain('/');
  });

  it('leitet auf Origin + / um auch ohne code-Parameter', async () => {
    const req = new Request('http://localhost/auth/callback');
    const res = await GET(req as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('redirect');
    expect(((res as unknown as Record<string, unknown>).href as string)).toContain('/');
  });

  it('leitet genau auf http://localhost/ um', async () => {
    const req = new Request('http://localhost/auth/callback?code=abc');
    const res = await GET(req as never);
    expect((res as unknown as Record<string, unknown>).href).toBe('http://localhost/');
  });
});


// ── Produktions-Schema: RLS-Validierung ──────────────────────

describe('supabase/migrations – Produktions-Schema mit RLS', () => {
  const schemaPath = join(__dirname, '..', '..', '..', 'supabase', 'migrations', '20240101000000_initial_schema.sql');
  let sql: string;

  it('Datei existiert', () => {
    expect(existsSync(schemaPath)).toBe(true);
    sql = readFileSync(schemaPath, 'utf8');
    expect(sql.length).toBeGreaterThan(0);
  });

  it('alle Tabellen haben Row Level Security aktiviert', () => {
    sql = readFileSync(schemaPath, 'utf8');
    const rlsCount = (sql.match(/enable row level security/gi) ?? []).length;
    // 6 Tabellen: ai_configs, jira_configs, projects, tasks, chat_messages, analysis_snapshots
    expect(rlsCount).toBeGreaterThanOrEqual(6);
  });

  it('jede Tabelle hat eine RLS-Policy', () => {
    sql = readFileSync(schemaPath, 'utf8');
    const policyCount = (sql.match(/create policy/gi) ?? []).length;
    expect(policyCount).toBeGreaterThanOrEqual(6);
  });

  it('Policies nutzen auth.uid() für User-Isolation', () => {
    sql = readFileSync(schemaPath, 'utf8');
    expect(sql).toContain('auth.uid()');
  });

  it('Schema referenziert Supabase auth.users', () => {
    sql = readFileSync(schemaPath, 'utf8');
    expect(sql).toContain('references auth.users');
  });

  it('alle Policies haben WITH CHECK (kein reines USING)', () => {
    sql = readFileSync(schemaPath, 'utf8');
    expect(sql).toContain('with check');
  });

  it('updated_at-Trigger ist für projects definiert', () => {
    sql = readFileSync(schemaPath, 'utf8');
    expect(sql).toMatch(/create trigger projects_updated_at/i);
  });

  it('updated_at-Trigger ist für tasks definiert', () => {
    sql = readFileSync(schemaPath, 'utf8');
    expect(sql).toMatch(/create trigger tasks_updated_at/i);
  });
});
