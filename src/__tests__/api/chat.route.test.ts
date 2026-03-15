/**
 * Unit-Tests für src/app/api/chat/route.ts
 *
 * Abdeckungsstrategie:
 *  - White-Box: alle Validierungspfade, fallbackChatAnswer()-Verzweigungen
 *    (score, risiko, welle, soll, default).
 *  - Entscheidungsüberdeckung: question leer, zu lang, Grenzwert 1000 Zeichen;
 *    kein API-Key; verschiedene Fehlertypen (429/quota/auth/generic).
 *  - Pfadüberdeckung: fallbackChatAnswer → 6 Zweige, KI-Erfolgsfall,
 *    History-Weitergabe.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/chat/route';

// ── Hoisted Mocks ────────────────────────────────────────────
const { mockSendMessage, mockStartChat, mockGetGenerativeModel } = vi.hoisted(() => {
  const mockSendMessage = vi.fn();
  const mockStartChat = vi.fn().mockReturnValue({ sendMessage: mockSendMessage });
  const mockGetGenerativeModel = vi.fn().mockReturnValue({ startChat: mockStartChat });
  return { mockSendMessage, mockStartChat, mockGetGenerativeModel };
});

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

// ── Hilfsfunktionen ──────────────────────────────────────────
function makeRequest(body: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextRequest } = require('next/server');
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const mockProject = {
  id: '1',
  data: {
    projectName: 'Test',
    teamSize: '5-15',
    targetApps: '20',
    legacyApps: 'no',
    primaryStack: 'nextjs',
    hosting: 'vercel',
    cicd: 'github-actions',
    testing: 'unit',
    monitoring: 'sentry',
    documentation: 'readme',
  },
  analysis: {
    risks: [
      { title: 'R1', severity: 'high' as const, description: 'Beschreibung', recommendation: 'Empfehlung' },
    ],
    soll: [{ area: 'Bereich A', target: 'Ziel A' }],
    waves: [{ number: 1, title: 'Foundation', duration: '2 Wochen', items: ['CI/CD einrichten'] }],
    summary: 'Architekturanalyse abgeschlossen.',
    source: 'ai' as const,
    score: 60,
    scoreLabel: 'Mittel',
  },
  createdAt: new Date().toISOString(),
};

// ── Tests ────────────────────────────────────────────────────
describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GOOGLE_AI_API_KEY;
  });

  // ────────────────────────────────────────────────────────────
  // Input-Validierung (Entscheidungsüberdeckung)
  // ────────────────────────────────────────────────────────────

  it('gibt 400 zurück wenn question leer ist', async () => {
    const res = await POST(makeRequest({ project: mockProject, question: '', history: [] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Keine Frage angegeben');
  });

  it('gibt 400 zurück wenn question nur Whitespace enthält', async () => {
    const res = await POST(makeRequest({ project: mockProject, question: '   \t\n', history: [] }));
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück wenn question kein String ist (Typprüfung)', async () => {
    const res = await POST(makeRequest({ project: mockProject, question: 42, history: [] }));
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück wenn question undefined ist', async () => {
    const res = await POST(makeRequest({ project: mockProject, history: [] }));
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurück wenn question länger als 1000 Zeichen ist', async () => {
    const res = await POST(makeRequest({ project: mockProject, question: 'x'.repeat(1001), history: [] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('1000');
  });

  it('akzeptiert Frage mit exakt 1000 Zeichen (Grenzwert-Test)', async () => {
    mockSendMessage.mockResolvedValue({ response: { text: () => 'Antwort' } });
    const res = await POST(makeRequest({ project: mockProject, question: 'x'.repeat(1000), history: [], apiKey: 'key' }));
    expect(res.status).toBe(200);
  });

  // ────────────────────────────────────────────────────────────
  // Pfad: kein API-Key → fallbackChatAnswer (6 Zweige)
  // ────────────────────────────────────────────────────────────

  it('fallback: antwortet auf Score-Frage mit Score-Wert', async () => {
    const res = await POST(makeRequest({ project: mockProject, question: 'Was ist der aktuelle Score?', history: [] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.answer).toContain('60/100');
  });

  it('fallback: antwortet auf Bewertungs-Frage mit Score-Details', async () => {
    const res = await POST(makeRequest({ project: mockProject, question: 'Wie ist die Bewertung?', history: [] }));
    expect((await res.json()).answer).toContain('60/100');
  });

  it('fallback: antwortet auf Risiko-Frage und listet hohe Risiken auf', async () => {
    // Frage muss 'risiko' oder 'risk' enthalten (nicht 'risiken' – kein Substring-Match)
    const body = await (await POST(makeRequest({ project: mockProject, question: 'Was ist das größte Risiko?', history: [] }))).json();
    expect(body.answer).toContain('R1');
    expect(body.answer).toContain('Empfehlung');
  });

  it('fallback: antwortet auf Risiko-Frage mit positivem Ergebnis wenn keine hohen Risiken', async () => {
    const projectNoHigh = {
      ...mockProject,
      analysis: { ...mockProject.analysis, risks: [{ title: 'R1', severity: 'low' as const, description: 'd', recommendation: 'r' }] },
    };
    const body = await (await POST(makeRequest({ project: projectNoHigh, question: 'Risiko anzeigen', history: [] }))).json();
    expect(body.answer).toContain('keine hohen Risiken');
  });

  it('fallback: antwortet auf Wellen-Frage mit Welle 1', async () => {
    const body = await (await POST(makeRequest({ project: mockProject, question: 'Wo anfangen?', history: [] }))).json();
    expect(body.answer).toContain('Welle 1');
    expect(body.answer).toContain('Foundation');
  });

  it('fallback: gibt Hinweis wenn Welle-1-Frage ohne vorhandene Welle 1 gestellt wird', async () => {
    const projectNoWave = { ...mockProject, analysis: { ...mockProject.analysis, waves: [] } };
    const body = await (await POST(makeRequest({ project: projectNoWave, question: 'Umsetzung?', history: [] }))).json();
    // route.ts gibt 'Keine Wellen-Daten vorhanden.' zurück (Großbuchstabe K)
    expect(body.answer).toContain('Wellen-Daten');
  });

  it('fallback: antwortet auf Soll-Zustand-Frage', async () => {
    const body = await (await POST(makeRequest({ project: mockProject, question: 'Was ist der Soll-Zustand?', history: [] }))).json();
    expect(body.answer).toContain('Soll-Zustand');
  });

  it('fallback: gibt Default-Antwort bei nicht erkannter Frage', async () => {
    const body = await (await POST(makeRequest({ project: mockProject, question: 'Wie viele Planeten hat das Sonnensystem?', history: [] }))).json();
    expect(body.answer).toContain('API-Key');
  });

  // ────────────────────────────────────────────────────────────
  // Pfad: KI-Erfolgsfall
  // ────────────────────────────────────────────────────────────

  it('gibt KI-Antwort zurück bei gültigem API-Key', async () => {
    mockSendMessage.mockResolvedValue({ response: { text: () => 'Die Optimierung erfolgt schrittweise.' } });

    const res = await POST(makeRequest({ project: mockProject, question: 'Wie optimiere ich?', history: [], apiKey: 'valid-key' }));

    expect(res.status).toBe(200);
    expect((await res.json()).answer).toBe('Die Optimierung erfolgt schrittweise.');
  });

  it('übergibt Chat-History korrekt an die KI', async () => {
    mockSendMessage.mockResolvedValue({ response: { text: () => 'Antwort' } });
    const history = [
      { role: 'user' as const, text: 'Erste Frage' },
      { role: 'model' as const, text: 'Erste Antwort' },
    ];

    await POST(makeRequest({ project: mockProject, question: 'Zweite Frage', history, apiKey: 'key' }));

    expect(mockStartChat).toHaveBeenCalledWith({
      history: [
        { role: 'user', parts: [{ text: 'Erste Frage' }] },
        { role: 'model', parts: [{ text: 'Erste Antwort' }] },
      ],
    });
  });

  it('übergibt Env-Key wenn kein Client-Key vorhanden', async () => {
    process.env.GOOGLE_AI_API_KEY = 'env-key-test';
    mockSendMessage.mockResolvedValue({ response: { text: () => 'ok' } });

    await POST(makeRequest({ project: mockProject, question: 'Frage', history: [] }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    expect(vi.mocked(GoogleGenerativeAI).mock.calls[0][0]).toBe('env-key-test');
  });

  it('trimmt den übergebenen API-Key vor der Nutzung', async () => {
    mockSendMessage.mockResolvedValue({ response: { text: () => 'ok' } });

    await POST(makeRequest({ project: mockProject, question: 'Frage', history: [], apiKey: '  trimmed-key  ' }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    expect(vi.mocked(GoogleGenerativeAI).mock.calls[0][0]).toBe('trimmed-key');
  });

  // ────────────────────────────────────────────────────────────
  // Fehler-Pfade (Entscheidungsüberdeckung Fehlertypen)
  // ────────────────────────────────────────────────────────────

  it('gibt 429 zurück bei 429-Fehler', async () => {
    mockSendMessage.mockRejectedValue(new Error('429 Too Many Requests'));
    const res = await POST(makeRequest({ project: mockProject, question: 'Test', history: [], apiKey: 'key' }));
    expect(res.status).toBe(429);
  });

  it('gibt 429 zurück bei quota-Fehler', async () => {
    mockSendMessage.mockRejectedValue(new Error('quota exceeded'));
    const res = await POST(makeRequest({ project: mockProject, question: 'Test', history: [], apiKey: 'key' }));
    expect(res.status).toBe(429);
  });

  it('gibt 429 zurück bei RESOURCE_EXHAUSTED', async () => {
    mockSendMessage.mockRejectedValue(new Error('RESOURCE_EXHAUSTED'));
    const res = await POST(makeRequest({ project: mockProject, question: 'Test', history: [], apiKey: 'key' }));
    expect(res.status).toBe(429);
  });

  it('gibt 401 zurück bei API_KEY_INVALID', async () => {
    mockSendMessage.mockRejectedValue(new Error('API_KEY_INVALID'));
    const res = await POST(makeRequest({ project: mockProject, question: 'Test', history: [], apiKey: 'bad' }));
    expect(res.status).toBe(401);
  });

  it('gibt 401 zurück bei HTTP-401-Fehler', async () => {
    mockSendMessage.mockRejectedValue(new Error('401 Unauthorized'));
    const res = await POST(makeRequest({ project: mockProject, question: 'Test', history: [], apiKey: 'key' }));
    expect(res.status).toBe(401);
  });

  it('gibt 401 zurück bei HTTP-403-Fehler', async () => {
    mockSendMessage.mockRejectedValue(new Error('403 Forbidden'));
    const res = await POST(makeRequest({ project: mockProject, question: 'Test', history: [], apiKey: 'key' }));
    expect(res.status).toBe(401);
  });

  it('gibt 500 zurück bei unbekanntem Fehler', async () => {
    mockSendMessage.mockRejectedValue(new Error('Netzwerkfehler'));
    const res = await POST(makeRequest({ project: mockProject, question: 'Test', history: [], apiKey: 'key' }));
    expect(res.status).toBe(500);
  });
});
