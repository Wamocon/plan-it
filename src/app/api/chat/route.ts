import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Project } from '@/types';
import { fallbackAnalysis } from '@/lib/fallback-analysis';

export async function POST(request: NextRequest) {
  try {
    const { project, question, history } = (await request.json()) as {
      project: Project;
      question: string;
      history: { role: 'user' | 'model'; text: string }[];
    };

    // Input validierung
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Keine Frage angegeben' }, { status: 400 });
    }
    if (question.length > 1000) {
      return NextResponse.json({ error: 'Frage zu lang (max. 1000 Zeichen)' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ answer: fallbackChatAnswer(question, project) });
    }

    const { analysis, data } = project;
    const systemPrompt = `Du bist ein IT-Architektur-Berater und hilfst dabei, eine Architektur-Analyse zu verstehen und umzusetzen.

PROJEKT-KONTEXT:
Projektname: ${data.projectName || 'Unbekannt'}
Team: ${data.teamSize || '–'} Entwickler
Apps: ${data.appCount || '–'} bestehend, Ziel: ${data.targetApps || '–'}
Tech Stack: ${data.primaryStack || '–'}
Hosting: ${data.hosting || '–'}
CI/CD: ${data.cicd || '–'}
Testing: ${data.testing || '–'}
Monitoring: ${data.monitoring || '–'}
Dokumentation: ${data.documentation || '–'}
Legacy: ${data.legacyApps === 'yes' ? 'Ja' : 'Nein'}

ANALYSE-ERGEBNIS:
Score: ${analysis.score ?? '–'}/100 (${analysis.scoreLabel ?? '–'})
Quelle: ${analysis.source === 'ai' ? 'KI-Analyse' : 'Regelbasierte Analyse'}
Zusammenfassung: ${analysis.summary}
Risiken (${analysis.risks.length}):
${analysis.risks.map((r, i) => `${i + 1}. [${r.severity.toUpperCase()}] ${r.title}: ${r.description} → ${r.recommendation}`).join('\n')}
Soll-Zustand:
${analysis.soll.map(s => `- ${s.area}: ${s.target}`).join('\n')}
Umsetzungswellen:
${analysis.waves.map(w => `Welle ${w.number} (${w.duration}): ${w.title}\n  ${w.items.join('\n  ')}`).join('\n')}

Beantworte Fragen zu dieser Analyse auf Deutsch. Sei präzise und praktisch. Wenn du Code-Beispiele gibst, verwende Markdown-Blöcke. Halte Antworten unter 400 Wörtern.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
      systemInstruction: { role: 'model', parts: [{ text: systemPrompt }] },
    });

    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    });

    const result = await chat.sendMessage(question);
    const answer = result.response.text();

    return NextResponse.json({ answer });
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({ error: 'KI-Limit erreicht. Bitte später erneut versuchen.' }, { status: 429 });
    }
    console.error('Chat error:', e);
    return NextResponse.json({ error: 'Fehler bei der KI-Anfrage' }, { status: 500 });
  }
}

// Einfache Fallback-Antworten ohne API-Key
function fallbackChatAnswer(question: string, project: Project): string {
  const q = question.toLowerCase();
  const { analysis } = project;

  if (q.includes('score') || q.includes('bewertung') || q.includes('punkte')) {
    const s = analysis.score ?? 0;
    return `Der Architektur-Score von **${s}/100** (${analysis.scoreLabel}) bewertet die technische Reife anhand von 8 Kriterien: Testing, CI/CD, Monitoring, Dokumentation, Code-Sharing, Design System, Branching-Strategie und Legacy-Anteil. Ein Score über 70 gilt als gut, unter 50 besteht dringender Handlungsbedarf.`;
  }
  if (q.includes('risiko') || q.includes('risk')) {
    const high = analysis.risks.filter(r => r.severity === 'high');
    if (high.length === 0) return 'Es wurden keine hohen Risiken identifiziert – das ist ein gutes Zeichen!';
    return `Die ${high.length} kritischsten Risiken sind:\n${high.map((r, i) => `${i + 1}. **${r.title}**: ${r.recommendation}`).join('\n')}`;
  }
  if (q.includes('welle') || q.includes('umsetzung') || q.includes('anfangen') || q.includes('start')) {
    const w1 = analysis.waves.find(w => w.number === 1);
    return w1 ? `Mit **Welle 1 "${w1.title}"** (${w1.duration}) anfangen:\n${w1.items.map(i => `▸ ${i}`).join('\n')}` : 'Keine Wellen-Daten vorhanden.';
  }
  if (q.includes('soll') || q.includes('ziel') || q.includes('zustand')) {
    return `Der Soll-Zustand umfasst ${analysis.soll.length} Bereiche:\n${analysis.soll.slice(0, 4).map(s => `▸ **${s.area}**: ${s.target}`).join('\n')}`;
  }
  return 'Für detaillierte KI-Antworten wird ein Google AI API-Key benötigt. Die Analyse-Daten sind in den Tabs "Risiken", "Soll" und "Umsetzung" vollständig einsehbar.';
}
