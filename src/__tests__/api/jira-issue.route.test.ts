/**
 * Unit-Tests für src/app/api/jira/issue/route.ts
 *
 * Abdeckungsstrategie:
 *  - Pfadüberdeckung: Validierung aller Pflichtfelder, URL-Bereinigung,
 *    Erfolgsfall, alle Fehler-Rückgabepfade.
 *  - Entscheidungsüberdeckung: errorMessages vs. errors-Objekt vs. leere
 *    Fehlermeldung; waveNumber/waveTitle vorhanden vs. undefined;
 *    projectName vorhanden vs. fehlend; issueType vorhanden vs. default.
 *  - White-Box: Payload-Struktur (ADF-Format), summary-Kürzung auf 255 Zeichen,
 *    projectKey-Großschreibung.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/jira/issue/route';

// ── Hilfsfunktionen ──────────────────────────────────────────
function makeRequest(body: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextRequest } = require('next/server');
  return new NextRequest('http://localhost/api/jira/issue', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const validConfig = {
  baseUrl: 'https://test.atlassian.net',
  email: 'a@b.com',
  apiToken: 'token',
  projectKey: 'TEST',
  issueType: 'Task',
};

const validTask = { item: 'CI/CD Pipeline aufsetzen', waveNumber: 1, waveTitle: 'Foundation' };

// ── Tests ────────────────────────────────────────────────────
describe('POST /api/jira/issue', () => {
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
    const req = new NextRequest('http://localhost/api/jira/issue', { method: 'POST', body: '{KEIN_JSON' });
    req.json = async () => {
      throw new SyntaxError('Invalid JSON');
    };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück wenn config.baseUrl fehlt', async () => {
    const { baseUrl: _, ...configWithout } = validConfig;
    const res = await POST(makeRequest({ config: configWithout, task: validTask }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('unvollständig');
  });

  it('gibt 400 zurück wenn config.email fehlt', async () => {
    const res = await POST(makeRequest({ config: { ...validConfig, email: '' }, task: validTask }));
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück wenn config.apiToken fehlt', async () => {
    const res = await POST(makeRequest({ config: { ...validConfig, apiToken: '' }, task: validTask }));
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück wenn config.projectKey fehlt', async () => {
    const res = await POST(makeRequest({ config: { ...validConfig, projectKey: '' }, task: validTask }));
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück wenn task.item fehlt', async () => {
    const res = await POST(makeRequest({ config: validConfig, task: { waveNumber: 1 } }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('Aufgabentitel');
  });

  it('gibt 400 zurück bei HTTP-URL (HTTPS erforderlich)', async () => {
    const res = await POST(makeRequest({ config: { ...validConfig, baseUrl: 'http://test.atlassian.net' }, task: validTask }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('HTTPS');
  });

  // ────────────────────────────────────────────────────────────
  // White-Box: Payload-Korrektheit
  // ────────────────────────────────────────────────────────────

  it('konvertiert projectKey zu Großbuchstaben', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ key: 'lower-1' }) });
    vi.stubGlobal('fetch', mockFetch);

    await POST(makeRequest({ config: { ...validConfig, projectKey: 'lower' }, task: validTask }));

    const payload = JSON.parse((mockFetch.mock.calls[0] as [string, { body: string }])[1].body);
    expect(payload.fields.project.key).toBe('LOWER');
  });

  it('kürzt summary auf maximal 255 Zeichen', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ key: 'TEST-1' }) });
    vi.stubGlobal('fetch', mockFetch);

    await POST(makeRequest({ config: validConfig, task: { ...validTask, item: 'x'.repeat(300) } }));

    const payload = JSON.parse((mockFetch.mock.calls[0] as [string, { body: string }])[1].body);
    expect(payload.fields.summary.length).toBe(255);
  });

  it('entfernt trailing slashes aus der baseUrl', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ key: 'TEST-1' }) });
    vi.stubGlobal('fetch', mockFetch);

    await POST(makeRequest({ config: { ...validConfig, baseUrl: 'https://test.atlassian.net///' }, task: validTask }));

    expect((mockFetch.mock.calls[0] as [string])[0]).toBe('https://test.atlassian.net/rest/api/3/issue');
  });

  it('verwendet "?" als Fallback für fehlende waveNumber', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ key: 'TEST-1' }) });
    vi.stubGlobal('fetch', mockFetch);

    await POST(makeRequest({ config: validConfig, task: { item: 'Aufgabe ohne Welle' } }));

    const payload = JSON.parse((mockFetch.mock.calls[0] as [string, { body: string }])[1].body);
    const welleText = payload.fields.description.content[1].content[1].text as string;
    expect(welleText).toContain('Welle ? –');
  });

  it('verwendet "Unbekannt" als Fallback wenn projectName fehlt', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ key: 'TEST-1' }) });
    vi.stubGlobal('fetch', mockFetch);

    await POST(makeRequest({ config: validConfig, task: validTask }));

    const payload = JSON.parse((mockFetch.mock.calls[0] as [string, { body: string }])[1].body);
    const projektText = payload.fields.description.content[0].content[1].text as string;
    expect(projektText).toBe('Unbekannt');
  });

  it('setzt projectName korrekt in die Beschreibung', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ key: 'TEST-1' }) });
    vi.stubGlobal('fetch', mockFetch);

    await POST(makeRequest({ config: validConfig, task: validTask, projectName: 'Mein Architekturprojekt' }));

    const payload = JSON.parse((mockFetch.mock.calls[0] as [string, { body: string }])[1].body);
    expect(payload.fields.description.content[0].content[1].text).toBe('Mein Architekturprojekt');
  });

  it('verwendet Standard-IssueType "Task" wenn issueType nicht angegeben', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ key: 'TEST-1' }) });
    vi.stubGlobal('fetch', mockFetch);

    const { issueType: _, ...configWithoutType } = validConfig;
    await POST(makeRequest({ config: configWithoutType, task: validTask }));

    const payload = JSON.parse((mockFetch.mock.calls[0] as [string, { body: string }])[1].body);
    expect(payload.fields.issuetype.name).toBe('Task');
  });

  it('überträgt benutzerdefinierten IssueType (z.B. Story)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ key: 'TEST-1' }) });
    vi.stubGlobal('fetch', mockFetch);

    await POST(makeRequest({ config: { ...validConfig, issueType: 'Story' }, task: validTask }));

    const payload = JSON.parse((mockFetch.mock.calls[0] as [string, { body: string }])[1].body);
    expect(payload.fields.issuetype.name).toBe('Story');
  });

  // ────────────────────────────────────────────────────────────
  // Erfolgs-Pfad
  // ────────────────────────────────────────────────────────────

  it('gibt issueKey und issueUrl bei Erfolg zurück', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ key: 'TEST-42' }) }));

    const res = await POST(makeRequest({ config: validConfig, task: validTask, projectName: 'Projekt' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.issueKey).toBe('TEST-42');
    expect(body.issueUrl).toBe('https://test.atlassian.net/browse/TEST-42');
  });

  // ────────────────────────────────────────────────────────────
  // Fehler-Pfade (Entscheidungsüberdeckung)
  // ────────────────────────────────────────────────────────────

  it('gibt Fehler aus errorMessages-Array zurück', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ errorMessages: ['Projekt nicht gefunden', 'Ungültiger Typ'] }),
    }));

    const res = await POST(makeRequest({ config: validConfig, task: validTask }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Projekt nicht gefunden, Ungültiger Typ');
  });

  it('fällt auf errors-Objekt zurück wenn errorMessages leer ist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ errorMessages: [], errors: { summary: 'Pflichtfeld fehlt', assignee: 'Ungültig' } }),
    }));

    const res = await POST(makeRequest({ config: validConfig, task: validTask }));

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toContain('Pflichtfeld fehlt');
  });

  it('gibt "Jira-Fehler" zurück wenn weder errorMessages noch errors vorhanden', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));

    const res = await POST(makeRequest({ config: validConfig, task: validTask }));

    expect((await res.json()).error).toBe('Jira-Fehler');
  });

  it('gibt "Jira-Fehler" zurück wenn json()-Parsing fehlschlägt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('non-JSON response');
      },
    }));

    const res = await POST(makeRequest({ config: validConfig, task: validTask }));

    expect((await res.json()).error).toBe('Jira-Fehler');
  });

  it('gibt 502 zurück bei Netzwerkfehler (fetch wirft)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const res = await POST(makeRequest({ config: validConfig, task: validTask }));

    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain('Verbindung zu Jira fehlgeschlagen');
  });
});
