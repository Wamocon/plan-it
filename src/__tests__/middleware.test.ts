/**
 * Tests für src/middleware.ts
 *
 * Entscheidungsüberdeckung:
 * - Kein Session-Cookie + geschützte Route   → Redirect zu /auth/login
 * - Supabase-Session vorhanden               → Pass-through
 * - Beliebige Route unter /auth/*            → Pass-through (immer)
 * - Beliebige Route unter /api/*             → Pass-through (immer)
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn((init?: unknown) => ({
      _type: 'next',
      request: (init as Record<string, unknown>)?.request,
      cookies: { set: vi.fn() },
    })),
    redirect: vi.fn((url: URL) => ({
      _type: 'redirect',
      destination: url.pathname,
    })),
  },
}));

// Mock @supabase/ssr so no real HTTP calls happen
let mockUser: { id: string } | null = null;
let mockProfileRow: { role: string } | null = null;

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfileRow, error: null }),
    })),
    cookies: { set: vi.fn() },
  })),
}));

// ── Hilfsklasse: MinimalRequest ──────────────────────────────

function makeRequest(pathname: string, cookies: Record<string, string> = {}) {
  const allCookies = Object.entries(cookies).map(([name, value]) => ({ name, value }));
  return {
    nextUrl: {
      pathname,
      clone() {
        return { pathname, search: '', hostname: 'localhost' };
      },
    },
    cookies: {
      get: vi.fn((name: string) => {
        if (name in cookies) return { value: cookies[name] };
        return undefined;
      }),
      getAll: vi.fn(() => allCookies),
      set: vi.fn(),
    },
    url: `http://localhost${pathname}`,
  };
}

import { middleware } from '@/middleware';

describe('middleware – Authentifizierungs-Guard', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockProfileRow = null;
  });

  it('leitet nicht eingeloggten User auf /auth/login um', async () => {
    const res = await middleware(makeRequest('/') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('redirect');
    expect((res as unknown as Record<string, unknown>).destination).toBe('/auth/login');
  });

  it('leitet auf /auth/login um auch bei geschützten Unterseiten', async () => {
    const res = await middleware(makeRequest('/project/123') as never);
    expect((res as unknown as Record<string, unknown>).destination).toBe('/auth/login');
  });

  it('lässt eingeloggten User durch', async () => {
    mockUser = { id: 'user-123' };
    mockProfileRow = { role: 'user' };
    const res = await middleware(makeRequest('/') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('next');
  });

  it('leitet eingeloggten User ohne Schema-Profil auf /auth/login um', async () => {
    mockUser = { id: 'user-123' };
    mockProfileRow = null;
    const res = await middleware(makeRequest('/') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('redirect');
    expect((res as unknown as Record<string, unknown>).destination).toBe('/auth/login');
  });

  it('lässt /auth/login durch ohne Redirect wenn nicht eingeloggt', async () => {
    const res = await middleware(makeRequest('/auth/login') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt /auth/callback durch ohne Redirect wenn nicht eingeloggt', async () => {
    const res = await middleware(makeRequest('/auth/callback') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt /api/analyze durch ohne Redirect wenn nicht eingeloggt', async () => {
    const res = await middleware(makeRequest('/api/analyze') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt /api/chat durch ohne Redirect wenn nicht eingeloggt', async () => {
    const res = await middleware(makeRequest('/api/chat') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt eingeloggten User auf /settings durch', async () => {
    mockUser = { id: 'user-123' };
    mockProfileRow = { role: 'user' };
    const res = await middleware(makeRequest('/settings') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt eingeloggten User auf /wizard durch', async () => {
    mockUser = { id: 'user-123' };
    mockProfileRow = { role: 'user' };
    const res = await middleware(makeRequest('/wizard') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('next');
  });

  it('übergibt NEXT_PUBLIC_DB_SCHEMA an createServerClient', async () => {
    process.env.NEXT_PUBLIC_DB_SCHEMA = 'test';
    mockUser = { id: 'user-123' };
    mockProfileRow = { role: 'user' };
    const { createServerClient } = await import('@supabase/ssr');
    await middleware(makeRequest('/') as never);
    const callArgs = (createServerClient as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[2]).toMatchObject({ db: { schema: 'test' } });
    delete process.env.NEXT_PUBLIC_DB_SCHEMA;
  });
});

// ── Admin-Routen-Schutz ──────────────────────────────────────

describe('middleware – Admin-Routen-Guard', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockProfileRow = null;
  });

  it('leitet nicht eingeloggten User von /admin/users auf /auth/login um', async () => {
    const res = await middleware(makeRequest('/admin/users') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('redirect');
    expect((res as unknown as Record<string, unknown>).destination).toBe('/auth/login');
  });

  it('leitet eingeloggten Nicht-Admin von /admin/users auf / um', async () => {
    mockUser = { id: 'user-123' };
    mockProfileRow = { role: 'developer' };
    const res = await middleware(makeRequest('/admin/users') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('redirect');
    expect((res as unknown as Record<string, unknown>).destination).toBe('/');
  });

  it('leitet User ohne Schema-Profil von /admin/* auf /auth/login um', async () => {
    mockUser = { id: 'user-123' };
    mockProfileRow = null;
    const res = await middleware(makeRequest('/admin/users') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('redirect');
    expect((res as unknown as Record<string, unknown>).destination).toBe('/auth/login');
  });

  it('lässt Admin auf /admin/users durch', async () => {
    mockUser = { id: 'admin-1' };
    mockProfileRow = { role: 'admin' };
    const res = await middleware(makeRequest('/admin/users') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt Admin auch auf verschachtelten /admin/*-Pfaden durch', async () => {
    mockUser = { id: 'admin-1' };
    mockProfileRow = { role: 'admin' };
    const res = await middleware(makeRequest('/admin/settings') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('next');
  });
});
