/**
 * Tests für src/middleware.ts
 *
 * Entscheidungsüberdeckung:
 * - Kein Session-Cookie + geschützte Route   → Redirect zu /auth/login
 * - Ungültige Session + geschützte Route     → Redirect zu /auth/login
 * - Gültige Session + beliebige Route        → Pass-through
 * - Beliebige Route unter /auth/*            → Pass-through (immer)
 * - Beliebige Route unter /api/*             → Pass-through (immer)
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────

const mockAccountGet = vi.fn();

vi.mock('node-appwrite', () => ({
  Client: vi.fn(() => ({
    setEndpoint: vi.fn().mockReturnThis(),
    setProject:  vi.fn().mockReturnThis(),
    setSession:  vi.fn().mockReturnThis(),
  })),
  Account: vi.fn(() => ({
    get: mockAccountGet,
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

function makeRequest(pathname: string, sessionCookie?: string) {
  return {
    nextUrl: {
      pathname,
      clone() {
        return { pathname, search: '', hostname: 'localhost' };
      },
    },
    cookies: {
      get: vi.fn((name: string) => {
        if (sessionCookie && name.startsWith('a_session_')) {
          return { value: sessionCookie };
        }
        return undefined;
      }),
    },
    url: `http://localhost${pathname}`,
  };
}

import { middleware } from '@/middleware';

describe('middleware – Authentifizierungs-Guard', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT   = 'http://localhost:9080/v1';
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'testproject';
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    delete process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('leitet nicht eingeloggten User auf /auth/login um', async () => {
    const req = makeRequest('/');
    const res = await middleware(req as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('redirect');
    expect((res as unknown as Record<string, unknown>).destination).toBe('/auth/login');
  });

  it('leitet auf /auth/login um auch bei geschützten Unterseiten', async () => {
    const res = await middleware(makeRequest('/project/123') as never);
    expect((res as unknown as Record<string, unknown>).destination).toBe('/auth/login');
  });

  it('leitet auf /auth/login um wenn Session ungültig ist', async () => {
    mockAccountGet.mockRejectedValueOnce(new Error('Unauthorized'));
    const res = await middleware(makeRequest('/', 'invalid-session') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('redirect');
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

  it('lässt eingeloggten User auf / durch', async () => {
    mockAccountGet.mockResolvedValueOnce({ $id: 'user-1' });
    const res = await middleware(makeRequest('/', 'valid-session') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt eingeloggten User auf /settings durch', async () => {
    mockAccountGet.mockResolvedValueOnce({ $id: 'user-1' });
    const res = await middleware(makeRequest('/settings', 'valid-session') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('next');
  });

  it('lässt eingeloggten User auf /wizard durch', async () => {
    mockAccountGet.mockResolvedValueOnce({ $id: 'user-1' });
    const res = await middleware(makeRequest('/wizard', 'valid-session') as never);
    expect((res as unknown as Record<string, unknown>)._type).toBe('next');
  });

  it('ruft Account.get() auf wenn Session-Cookie vorhanden ist', async () => {
    mockAccountGet.mockResolvedValueOnce({ $id: 'user-1' });
    await middleware(makeRequest('/', 'valid-session') as never);
    expect(mockAccountGet).toHaveBeenCalledTimes(1);
  });
});

