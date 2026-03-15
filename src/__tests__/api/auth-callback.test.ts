/**
 * Tests für src/app/auth/callback/route.ts
 * und Validierung des Produktions-Schemas (supabase/migrations).
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ── Auth Callback ─────────────────────────────────────────────

const mockExchangeCodeForSession = vi.fn().mockResolvedValue({ data: {}, error: null });

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}));

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
  it('tauscht Code gegen Session aus wenn ?code= vorhanden', async () => {
    const req = new Request('http://localhost/auth/callback?code=test-code-123');
    await GET(req as never);
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-code-123');
  });

  it('ruft exchangeCodeForSession NICHT auf wenn kein code-Parameter', async () => {
    mockExchangeCodeForSession.mockClear();
    const req = new Request('http://localhost/auth/callback');
    await GET(req as never);
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('leitet nach / um', async () => {
    const req = new Request('http://localhost/auth/callback?code=abc');
    const res = await GET(req as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('redirect');
    expect(((res as unknown as Record<string, unknown>).href as string)).toContain('/');
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
