/**
 * Tests für src/middleware.ts
 *
 * Entscheidungsüberdeckung:
 * - Nicht eingeloggt + geschützte Route  → Redirect zu /auth/login
 * - Nicht eingeloggt + /auth/*           → Kein Redirect (pass-through)
 * - Nicht eingeloggt + /api/*            → Kein Redirect (pass-through)
 * - Eingeloggt + beliebige Route         → Pass-through
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────

const mockGetUser = vi.fn();
const mockSetAll = vi.fn();
const mockRedirect = vi.fn();
const mockNext = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

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

// ── Hilfsklasse: MinimalRequest ──────────────────────────────

function makeRequest(pathname: string) {
  return {
    nextUrl: {
      pathname,
      clone() {
        return { pathname, search: '', hostname: 'localhost' };
      },
    },
    cookies: {
      getAll: vi.fn(() => []),
      set: vi.fn(),
    },
    url: `http://localhost${pathname}`,
  };
}

import { middleware } from '@/middleware';

describe('middleware – Authentifizierungs-Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNext.mockReturnValue({ _type: 'next', cookies: { set: vi.fn() } });
  });

  it('leitet nicht eingeloggten User auf /auth/login um', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = makeRequest('/');
    const res = await middleware(req as never);
    expect((res as Record<string, unknown>)._type).toBe('redirect');
    expect((res as Record<string, unknown>).destination).toBe('/auth/login');
  });

  it('leitet auf /auth/login um auch bei geschützten Unterseiten', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await middleware(makeRequest('/project/123') as never);
    expect((res as Record<string, unknown>).destination).toBe('/auth/login');
  });

  it('lässt /auth/login durch ohne Redirect wenn nicht eingeloggt', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await middleware(makeRequest('/auth/login') as never);
    expect((res as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt /auth/callback durch ohne Redirect wenn nicht eingeloggt', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await middleware(makeRequest('/auth/callback') as never);
    expect((res as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt /api/analyze durch ohne Redirect wenn nicht eingeloggt', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await middleware(makeRequest('/api/analyze') as never);
    expect((res as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt /api/chat durch ohne Redirect wenn nicht eingeloggt', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await middleware(makeRequest('/api/chat') as never);
    expect((res as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt eingeloggten User auf / durch', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const res = await middleware(makeRequest('/') as never);
    expect((res as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt eingeloggten User auf /settings durch', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const res = await middleware(makeRequest('/settings') as never);
    expect((res as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt eingeloggten User auf /wizard durch', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    const res = await middleware(makeRequest('/wizard') as never);
    expect((res as Record<string, unknown>)._type).toBe('next');
  });

  it('ruft auth.getUser() immer auf (Session-Refresh)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await middleware(makeRequest('/auth/login') as never);
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });
});
