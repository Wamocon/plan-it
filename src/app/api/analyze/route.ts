import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { WizardData, AnalysisResult } from '@/types';
import { fallbackAnalysis } from '@/lib/fallback-analysis';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Google Gemini-Anfrage mit Smart-Wait (bis zu 5 Versuche)
async function ask(phase: string, systemPrompt: string, userPrompt: string, apiKey: string, retryCount = 0): Promise<any> {
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    console.log(`${phase} [Google]: Sende Anfrage... (Versuch ${retryCount + 1})`);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
      systemInstruction: { role: 'model', parts: [{ text: systemPrompt }] },
    });
    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Kein JSON gefunden');
    return JSON.parse(text.substring(start, end + 1));
  } catch (e: any) {
    const msg = e.message || '';
    if ((msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) && retryCount < 4) {
      const match = msg.match(/retry in (\d+\.?\d*)s/);
      const waitSeconds = match ? parseFloat(match[1]) : 30;
      console.warn(`${phase} [Google]: Limit erreicht. Warte ${waitSeconds}s...`);
      await delay((waitSeconds + 2) * 1000);
      return ask(phase, systemPrompt, userPrompt, apiKey, retryCount + 1);
    }
    throw e;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { data: WizardData; apiKey?: string; provider?: string };
    const { data } = body;

    // API Key: vom Client (bevorzugt) oder Fallback auf Umgebungsvariable
    const resolvedKey = body.apiKey?.trim() || process.env.GOOGLE_AI_API_KEY;

    if (!resolvedKey) {
      return NextResponse.json(fallbackAnalysis(data));
    }

    const promptData = Object.entries(data)
      .filter(([, v]) => v)
      .map(([k, v]) => k + ': ' + v)
      .join('\n');
    const finalResult: Partial<AnalysisResult> = { source: 'ai' };

    try {
      // Phase 1: Summary & Kern-Risiken
      const p1 = await ask(
        'Phase 1/5',
        'Antworte NUR JSON: {"summary":"...","risks":[{"title":"...","severity":"...","description":"...","recommendation":"..."}]}. Gib nur die 2 kritischsten Risiken an. Deutsch.',
        `Analysiere Kern-Risiken für:\n${promptData}`,
        resolvedKey,
      );
      Object.assign(finalResult, p1);
      await delay(1000);

      // Phase 2: Technische Risiken
      const p2 = await ask(
        'Phase 2/5',
        'Antworte NUR JSON: {"risks":[{"title":"...","severity":"...","description":"...","recommendation":"..."}]}. Weitere 2 technische Risiken. Deutsch.',
        `Analysiere technische Risiken für:\n${promptData}`,
        resolvedKey,
      );
      if (p2.risks) finalResult.risks = [...(finalResult.risks || []), ...p2.risks];
      await delay(1000);

      // Phase 3: Soll-Zustand
      const p3 = await ask(
        'Phase 3/5',
        'Antworte NUR JSON: {"soll":[{"area":"...","target":"..."}]}. Max 5 Punkte. Deutsch.',
        `Definiere Soll-Zustand für:\n${promptData}`,
        resolvedKey,
      );
      Object.assign(finalResult, p3);
      await delay(1000);

      // Phase 4: Wellen 1-3
      const p4 = await ask(
        'Phase 4/5',
        'Antworte NUR JSON: {"waves":[{"number":1,"title":"...","duration":"...","items":["..."]},{"number":2,"title":"...","duration":"...","items":["..."]},{"number":3,"title":"...","duration":"...","items":["..."]}]}. Deutsch.',
        `Erstelle Wellen 1-3 für:\n${promptData}`,
        resolvedKey,
      );
      Object.assign(finalResult, p4);
      await delay(1000);

      // Phase 5: Wellen 4-5
      const p5 = await ask(
        'Phase 5/5',
        'Antworte NUR JSON: {"waves":[{"number":4,"title":"...","duration":"...","items":["..."]},{"number":5,"title":"...","duration":"...","items":["..."]}]}. Deutsch.',
        `Erstelle Wellen 4-5 für:\n${promptData}`,
        resolvedKey,
      );
      if (p5.waves) finalResult.waves = [...(finalResult.waves || []), ...p5.waves];

      console.log('Analyse erfolgreich abgeschlossen!');
      const fb = fallbackAnalysis(data);
      return NextResponse.json({ ...finalResult, score: fb.score, scoreLabel: fb.scoreLabel } as AnalysisResult);
    } catch (e: any) {
      console.error('Analyse endgültig gescheitert:', e);
      const isQuota = e.message?.includes('429') || e.message?.includes('quota');
      if (isQuota) {
        return NextResponse.json(
          { error: 'LIMIT_EXCEEDED', message: 'KI-Limit erreicht. Bitte später erneut versuchen.' },
          { status: 429 }
        );
      }
      const isAuth = e.message?.includes('API_KEY_INVALID') || e.message?.includes('401') || e.message?.includes('403');
      if (isAuth) {
        return NextResponse.json(
          { error: 'INVALID_KEY', message: 'Ungültiger API-Schlüssel. Bitte in den Einstellungen prüfen.' },
          { status: 401 }
        );
      }
      return NextResponse.json(fallbackAnalysis(data));
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

