/**
 * Unit-Tests für src/app/api/jira/test/route.ts
 *
 * Abdeckungsstrategie:
 *  - Pfadüberdeckung: alle Validierungspfade, Erfolgsfall mit verschiedenen
 *    Rückgabewerten (displayName / emailAddress / Standardtext), Fehlerfall.
 *  - Entscheidungsüberdeckung: fehlende Parameter (je einzeln), HTTP vs. HTTPS,
 *    fetch ok vs. nicht ok vs. throw.
 *  - White-Box: Authorization-Header-Format, URL-Bereinigung (trailing slashes).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/jira/test/route';

// ── Hilfsfunktionen ──────────────────────────────────────────
function makeRequest(body: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextRequest } = require('next/server');
  return new NextRequest('http://localhost/api/jira/test', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── Tests ────────────────────────────────────────────────────
describe('POST /api/jira/test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  // ────────────────────────────────────────────────────────────
  // Input-Validierung
  // ────────────────────────────────────────────────────────────

  it('gibt 400 zurück bei ungültigem JSON-Body', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NextRequest } = require('next/server');
    const req = new NextRequest('http://localhost/api/jira/test', { method: 'POST', body: '{KEIN_JSON' });
    req.json = async () => {
      throw new SyntaxError('Invalid JSON');
    };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück wenn baseUrl fehlt', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', apiToken: 'token' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Fehlende Parameter');
  });

  it('gibt 400 zurück wenn email fehlt', async () => {
    const res = await POST(makeRequest({ baseUrl: 'https://test.atlassian.net', apiToken: 'token' }));
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück wenn apiToken fehlt', async () => {
    const res = await POST(makeRequest({ baseUrl: 'https://test.atlassian.net', email: 'a@b.com' }));
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück wenn alle Felder fehlen', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück bei HTTP-URL (HTTPS erforderlich)', async () => {
    const res = await POST(makeRequest({ baseUrl: 'http://test.atlassian.net', email: 'a@b.com', apiToken: 'tok' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('HTTPS');
  });

  it('gibt 400 zurück bei URL ohne Schema', async () => {
    const res = await POST(makeRequest({ baseUrl: 'test.atlassian.net', email: 'a@b.com', apiToken: 'tok' }));
    expect(res.status).toBe(400);
  });

  // ────────────────────────────────────────────────────────────
  // URL-Bereinigung (White-Box)
  // ────────────────────────────────────────────────────────────

  it('entfernt trailing slashes aus der Basis-URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ displayName: 'Test' }) });
    vi.stubGlobal('fetch', mockFetch);

    await POST(makeRequest({ baseUrl: 'https://test.atlassian.net///', email: 'a@b.com', apiToken: 'tok' }));

    expect(mockFetch.mock.calls[0][0]).toBe('https://test.atlassian.net/rest/api/3/myself');
  });

  // ────────────────────────────────────────────────────────────
  // Erfolgs-Pfade (Entscheidungsüberdeckung displayName-Fallback)
  // ────────────────────────────────────────────────────────────

  it('gibt displayName zurück wenn in API-Antwort vorhanden', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ displayName: 'Max Mustermann' }) }));

    const res = await POST(makeRequest({ baseUrl: 'https://test.atlassian.net', email: 'a@b.com', apiToken: 'tok' }));

    expect(res.status).toBe(200);
    expect((await res.json()).displayName).toBe('Max Mustermann');
  });

  it('fällt auf emailAddress zurück wenn displayName fehlt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ emailAddress: 'max@example.com' }) }));

    const res = await POST(makeRequest({ baseUrl: 'https://test.atlassian.net', email: 'a@b.com', apiToken: 'tok' }));

    expect((await res.json()).displayName).toBe('max@example.com');
  });

  it('gibt Standardtext zurück wenn weder displayName noch emailAddress vorhanden', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));

    const res = await POST(makeRequest({ baseUrl: 'https://test.atlassian.net', email: 'a@b.com', apiToken: 'tok' }));

    expect((await res.json()).displayName).toBe('Erfolgreich verbunden');
  });

  // ────────────────────────────────────────────────────────────
  // White-Box: Authorization-Header-Format
  // ────────────────────────────────────────────────────────────

  it('setzt Authorization-Header als Base64-kodierten Basic-Auth-String', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ displayName: 'Test' }) });
    vi.stubGlobal('fetch', mockFetch);

    await POST(makeRequest({ baseUrl: 'https://test.atlassian.net', email: 'user@example.com', apiToken: 'mytoken' }));

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    const expectedAuth = 'Basic ' + Buffer.from('user@example.com:mytoken').toString('base64');
    expect(options.headers['Authorization']).toBe(expectedAuth);
  });

  // ────────────────────────────────────────────────────────────
  // Fehler-Pfade
  // ────────────────────────────────────────────────────────────

  it('gibt 401 zurück wenn Jira-Authentifizierung fehlschlägt (response.ok = false)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const res = await POST(makeRequest({ baseUrl: 'https://test.atlassian.net', email: 'a@b.com', apiToken: 'tok' }));

    expect(res.status).toBe(401);
    expect((await res.json()).error).toContain('Authentifizierung fehlgeschlagen');
  });

  it('gibt 502 zurück bei Netzwerkfehler (fetch wirft)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const res = await POST(makeRequest({ baseUrl: 'https://test.atlassian.net', email: 'a@b.com', apiToken: 'tok' }));

    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain('Verbindung zu Jira fehlgeschlagen');
  });
});
