/**
 * Unit-Tests für src/app/api/analyze/route.ts
 *
 * Abdeckungsstrategie:
 *  - White-Box: alle internen Pfade der ask()-Funktion (JSON-Extraktion,
 *    Retry-Logik, Fehlertypen) werden über den POST-Handler getestet.
 *  - Pfadüberdeckung: kein API-Key → Fallback; Key vorhanden → alle 5 Phasen;
 *    Fehler in Phase → 429 / 401 / Fallback.
 *  - Entscheidungsüberdeckung: p2.risks fehlt, p5.waves fehlt, Retry-Zähler
 *    genau = 4, verschiedene 429-Fehlermuster.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/analyze/route';

// ── Hoisted Mocks ────────────────────────────────────────────
const { mockGenerateContent, mockGetGenerativeModel } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn();
  const mockGetGenerativeModel = vi.fn().mockReturnValue({ generateContent: mockGenerateContent });
  return { mockGenerateContent, mockGetGenerativeModel };
});

const mockFallbackAnalysis = vi.hoisted(() => vi.fn());

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

vi.mock('@/lib/fallback-analysis', () => ({
  fallbackAnalysis: mockFallbackAnalysis,
}));

// ── Test-Hilfsfunktionen ─────────────────────────────────────
function makeRequest(body: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextRequest } = require('next/server');
  return new NextRequest('http://localhost/api/analyze', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Erstellt ein Response-Objekt, das .text() als JSON zurückgibt. */
function mockTextResponse(data: Record<string, unknown>) {
  return { response: { text: () => JSON.stringify(data) } };
}

const minimalWizardData = { projectName: 'Test', teamSize: '5-15', targetApps: '20' };

const fallbackResult = {
  risks: [],
  soll: [],
  waves: [],
  summary: 'Fallback',
  source: 'fallback' as const,
  score: 45,
  scoreLabel: 'Mittel',
};

/** Konfiguriert alle 5 Phasen für einen Erfolgsfall. */
function setupSuccessfulPhases() {
  mockGenerateContent
    .mockResolvedValueOnce(
      mockTextResponse({ summary: 'Zusammenfassung', risks: [{ title: 'R1', severity: 'high', description: 'd', recommendation: 'r' }] }),
    )
    .mockResolvedValueOnce(
      mockTextResponse({ risks: [{ title: 'R2', severity: 'medium', description: 'd', recommendation: 'r' }] }),
    )
    .mockResolvedValueOnce(mockTextResponse({ soll: [{ area: 'A', target: 'T' }] }))
    .mockResolvedValueOnce(
      mockTextResponse({
        waves: [
          { number: 1, title: 'W1', duration: '1w', items: ['x'] },
          { number: 2, title: 'W2', duration: '2w', items: ['y'] },
          { number: 3, title: 'W3', duration: '3w', items: ['z'] },
        ],
      }),
    )
    .mockResolvedValueOnce(
      mockTextResponse({
        waves: [
          { number: 4, title: 'W4', duration: '4w', items: ['a'] },
          { number: 5, title: 'W5', duration: '5w', items: ['b'] },
        ],
      }),
    );
}

// ── Tests ────────────────────────────────────────────────────
describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Implementation nach clearAllMocks explizit wiederherstellen –
    // Vitest 2.1 löscht .mockReturnValue-Implementations beim clear.
    mockGetGenerativeModel.mockReturnValue({ generateContent: mockGenerateContent });
    mockFallbackAnalysis.mockReturnValue(fallbackResult);
    delete process.env.GOOGLE_AI_API_KEY;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ────────────────────────────────────────────────────────────
  // Pfad: Kein API-Key → Fallback
  // ────────────────────────────────────────────────────────────

  it('gibt fallbackAnalysis zurück wenn kein API-Key vorhanden ist', async () => {
    const req = makeRequest({ data: minimalWizardData });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(fallbackResult);
    expect(mockFallbackAnalysis).toHaveBeenCalledWith(minimalWizardData);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('nutzt GOOGLE_AI_API_KEY aus Umgebungsvariable als Fallback', async () => {
    process.env.GOOGLE_AI_API_KEY = 'env-key';
    vi.useFakeTimers();
    setupSuccessfulPhases();

    const resPromise = POST(makeRequest({ data: minimalWizardData }));
    await vi.runAllTimersAsync();
    const res = await resPromise;

    expect(res.status).toBe(200);
    expect(mockGetGenerativeModel).toHaveBeenCalled();
  });

  it('bevorzugt Client-API-Key und trimmt Leerzeichen', async () => {
    process.env.GOOGLE_AI_API_KEY = 'env-key';
    vi.useFakeTimers();
    setupSuccessfulPhases();

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: '  client-key  ' }));
    await vi.runAllTimersAsync();
    await resPromise;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    expect(vi.mocked(GoogleGenerativeAI).mock.calls[0][0]).toBe('client-key');
  });

  // ────────────────────────────────────────────────────────────
  // Pfad: Alle 5 Phasen erfolgreich
  // ────────────────────────────────────────────────────────────

  it('merged alle 5 Phasen korrekt zum Endergebnis zusammen', async () => {
    vi.useFakeTimers();
    setupSuccessfulPhases();

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'valid-key' }));
    await vi.runAllTimersAsync();
    const res = await resPromise;
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.source).toBe('ai');
    expect(body.summary).toBe('Zusammenfassung');
    expect(body.risks).toHaveLength(2);
    expect(body.risks[0].title).toBe('R1');
    expect(body.risks[1].title).toBe('R2');
    expect(body.soll).toHaveLength(1);
    expect(body.waves).toHaveLength(5);
    // Score kommt aus fallbackAnalysis
    expect(body.score).toBe(fallbackResult.score);
    expect(body.scoreLabel).toBe(fallbackResult.scoreLabel);
  });

  it('filtert leere Wizard-Felder aus dem Prompt heraus', async () => {
    vi.useFakeTimers();
    setupSuccessfulPhases();
    const dataWithEmpty = { projectName: 'Test', emptyField: '', undefinedField: undefined };

    const resPromise = POST(makeRequest({ data: dataWithEmpty, apiKey: 'key' }));
    await vi.runAllTimersAsync();
    await resPromise;

    const callArg = mockGenerateContent.mock.calls[0][0] as string;
    expect(callArg).toContain('projectName');
    expect(callArg).not.toContain('emptyField');
  });

  // ────────────────────────────────────────────────────────────
  // Entscheidungsüberdeckung: fehlende Felder in Phasen-Antworten
  // ────────────────────────────────────────────────────────────

  it('behält Phase-1-Risiken wenn Phase-2-Response kein "risks"-Feld enthält', async () => {
    vi.useFakeTimers();
    mockGenerateContent
      .mockResolvedValueOnce(mockTextResponse({ summary: 'S', risks: [{ title: 'R1', severity: 'high', description: 'd', recommendation: 'r' }] }))
      .mockResolvedValueOnce(mockTextResponse({ other: 'kein risks-Feld' })) // p2 ohne risks
      .mockResolvedValueOnce(mockTextResponse({ soll: [] }))
      .mockResolvedValueOnce(mockTextResponse({ waves: [] }))
      .mockResolvedValueOnce(mockTextResponse({ waves: [] }));

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'key' }));
    await vi.runAllTimersAsync();
    const body = await (await resPromise).json();

    expect(body.risks).toHaveLength(1);
    expect(body.risks[0].title).toBe('R1');
  });

  it('behält Phase-4-Wellen wenn Phase-5-Response kein "waves"-Feld enthält', async () => {
    vi.useFakeTimers();
    mockGenerateContent
      .mockResolvedValueOnce(mockTextResponse({ summary: 'S', risks: [] }))
      .mockResolvedValueOnce(mockTextResponse({ risks: [] }))
      .mockResolvedValueOnce(mockTextResponse({ soll: [] }))
      .mockResolvedValueOnce(mockTextResponse({ waves: [{ number: 1, title: 'W1', duration: '1w', items: [] }] }))
      .mockResolvedValueOnce(mockTextResponse({ noWaves: true })); // p5 ohne waves

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'key' }));
    await vi.runAllTimersAsync();
    const body = await (await resPromise).json();

    expect(body.waves).toHaveLength(1);
    expect(body.waves[0].title).toBe('W1');
  });

  // ────────────────────────────────────────────────────────────
  // Pfad: ask() JSON-Extraktion
  // ────────────────────────────────────────────────────────────

  it('extrahiert JSON korrekt aus Response mit Präfix- und Suffix-Text', async () => {
    vi.useFakeTimers();
    const noisyResponse = 'Hier ist die Analyse: {"summary":"ok","risks":[]} Fertig.';
    mockGenerateContent
      .mockResolvedValueOnce({ response: { text: () => noisyResponse } })
      .mockResolvedValueOnce(mockTextResponse({ risks: [] }))
      .mockResolvedValueOnce(mockTextResponse({ soll: [] }))
      .mockResolvedValueOnce(mockTextResponse({ waves: [] }))
      .mockResolvedValueOnce(mockTextResponse({ waves: [] }));

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'key' }));
    await vi.runAllTimersAsync();
    const body = await (await resPromise).json();

    expect(body.summary).toBe('ok');
  });

  it('wirft Fehler und fällt auf Fallback zurück wenn Response kein JSON enthält', async () => {
    vi.useFakeTimers();
    // Keine geschweifte Klammer → "Kein JSON gefunden" → generic error → fallback
    mockGenerateContent.mockResolvedValue({ response: { text: () => 'Keine Antwort möglich.' } });

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'key' }));
    await vi.runAllTimersAsync();
    const res = await resPromise;

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(fallbackResult);
  });

  // ────────────────────────────────────────────────────────────
  // Pfad: ask() Retry-Logik (Entscheidungsüberdeckung retryCount)
  // ────────────────────────────────────────────────────────────

  it('wiederholt ask() genau 5 Mal (0–4) bei 429 bevor es aufgibt', async () => {
    vi.useFakeTimers();
    mockGenerateContent.mockRejectedValue(new Error('429 Too Many Requests'));

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'key' }));
    await vi.runAllTimersAsync();
    await resPromise;

    // Phase 1 wird maximal 5× versucht (retryCount 0, 1, 2, 3, 4)
    expect(mockGenerateContent).toHaveBeenCalledTimes(5);
  });

  it('gibt 429-Response zurück nach erschöpften Retry-Versuchen', async () => {
    vi.useFakeTimers();
    mockGenerateContent.mockRejectedValue(new Error('429 Too Many Requests'));

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'key' }));
    await vi.runAllTimersAsync();
    const res = await resPromise;

    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe('LIMIT_EXCEEDED');
  });

  it('erkennt "quota" als 429-Trigger', async () => {
    vi.useFakeTimers();
    mockGenerateContent.mockRejectedValue(new Error('quota exceeded'));

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'key' }));
    await vi.runAllTimersAsync();
    const res = await resPromise;

    expect(res.status).toBe(429);
  });

  it('erkennt "RESOURCE_EXHAUSTED" als 429-Trigger und wiederholt', async () => {
    vi.useFakeTimers();
    mockGenerateContent.mockRejectedValue(new Error('RESOURCE_EXHAUSTED'));

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'key' }));
    await vi.runAllTimersAsync();
    await resPromise;

    expect(mockGenerateContent).toHaveBeenCalledTimes(5);
  });

  it('extrahiert Wartezeit in Sekunden aus der Fehlermeldung (retry in Xs)', async () => {
    vi.useFakeTimers();
    // White-Box: route.ts loggt `console.warn("... Warte Xs...")` mit der extrahierten Zeit
    const warnSpy = vi.spyOn(console, 'warn');
    mockGenerateContent.mockRejectedValue(new Error('429 retry in 45.5s'));

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'key' }));
    await vi.runAllTimersAsync();
    await resPromise;

    // Regex `retry in (\d+\.?\d*)s` extrahiert 45.5 → "Warte 45.5s..."
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Warte 45.5s'));
  });

  it('verwendet 30s Standardwartezeit wenn keine "retry in Xs"-Angabe vorhanden', async () => {
    vi.useFakeTimers();
    // Kein Regex-Match → Default 30s → "Warte 30s..."
    const warnSpy = vi.spyOn(console, 'warn');
    mockGenerateContent.mockRejectedValue(new Error('RESOURCE_EXHAUSTED ohne Zeitangabe'));

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'key' }));
    await vi.runAllTimersAsync();
    await resPromise;

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Warte 30s'));
  });

  it('beendet Retry sofort (ohne weiteren Versuch) wenn retryCount === 4', async () => {
    vi.useFakeTimers();
    // Nur 5 Aufrufe, nicht 6
    mockGenerateContent.mockRejectedValue(new Error('429'));

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'key' }));
    await vi.runAllTimersAsync();
    await resPromise;

    expect(mockGenerateContent).toHaveBeenCalledTimes(5);
  });

  // ────────────────────────────────────────────────────────────
  // Pfad: Auth-Fehler → 401
  // ────────────────────────────────────────────────────────────

  it('gibt 401 zurück bei API_KEY_INVALID', async () => {
    vi.useFakeTimers();
    mockGenerateContent.mockRejectedValue(new Error('API_KEY_INVALID'));

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'bad-key' }));
    await vi.runAllTimersAsync();
    const res = await resPromise;

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('INVALID_KEY');
  });

  it('gibt 401 zurück bei HTTP 401', async () => {
    vi.useFakeTimers();
    mockGenerateContent.mockRejectedValue(new Error('401 Unauthorized'));

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'bad-key' }));
    await vi.runAllTimersAsync();
    const res = await resPromise;

    expect(res.status).toBe(401);
  });

  it('gibt 401 zurück bei HTTP 403', async () => {
    vi.useFakeTimers();
    mockGenerateContent.mockRejectedValue(new Error('403 Forbidden'));

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'bad-key' }));
    await vi.runAllTimersAsync();
    const res = await resPromise;

    expect(res.status).toBe(401);
  });

  // ────────────────────────────────────────────────────────────
  // Pfad: Unbekannter Fehler → Fallback
  // ────────────────────────────────────────────────────────────

  it('fällt auf fallbackAnalysis zurück bei unbekanntem Fehler', async () => {
    vi.useFakeTimers();
    mockGenerateContent.mockRejectedValue(new Error('Netzwerkfehler'));

    const resPromise = POST(makeRequest({ data: minimalWizardData, apiKey: 'key' }));
    await vi.runAllTimersAsync();
    const res = await resPromise;

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(fallbackResult);
  });

  // ────────────────────────────────────────────────────────────
  // Pfad: Ungültiger Request-Body → 500
  // ────────────────────────────────────────────────────────────

  it('gibt 500 zurück wenn der Request-Body kein gültiges JSON ist', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NextRequest } = require('next/server');
    const req = new NextRequest('http://localhost/api/analyze', { method: 'POST', body: '{KEIN_JSON' });
    req.json = async () => {
      throw new SyntaxError('Unexpected token');
    };

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
