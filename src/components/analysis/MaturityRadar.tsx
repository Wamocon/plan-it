'use client';
import { WizardData, AnalysisResult } from '@/types';

type DimKey = 'Architektur' | 'Sicherheit' | 'Prozesse' | 'Testing' | 'Monitoring' | 'Dokumentation';
const DIMS: DimKey[] = ['Architektur', 'Sicherheit', 'Prozesse', 'Testing', 'Monitoring', 'Dokumentation'];

const DIM_COLORS: Record<DimKey, string> = {
  Architektur:   '#a29bfe',
  Sicherheit:    '#ff7675',
  Prozesse:      '#74b9ff',
  Testing:       '#55efc4',
  Monitoring:    '#fdcb6e',
  Dokumentation: '#81ecec',
};

const DIM_ICONS: Record<DimKey, string> = {
  Architektur:   '🏗️',
  Sicherheit:    '🔐',
  Prozesse:      '🔄',
  Testing:       '🧪',
  Monitoring:    '📡',
  Dokumentation: '📚',
};

interface Scores { Architektur: number; Sicherheit: number; Prozesse: number; Testing: number; Monitoring: number; Dokumentation: number; }

function calcScores(data: WizardData, analysis: AnalysisResult): Scores {
  const split = (key: string): string[] => ((data[key] as string) || '').split(',').filter(Boolean);

  // Sicherheit – Maßnahmen + Auth-Stärke + Review-Prozess
  const secCount = split('security').filter(v => v !== 'none').length;
  const authS = ({ managed: 90, saml: 76, oauth: 62, jwt: 42, selfbuilt: 20, none: 5 } as Record<string, number>)[data.authStrategy as string] ?? 5;
  const revS  = ({ formal: 90, 'pr-review': 70, informal: 30, none: 5 } as Record<string, number>)[data.reviewProcess as string] ?? 5;
  const sicherheit = (secCount / 5) * 44 + authS * 0.3 + revS * 0.26;

  // Testing – Testarten
  const testT = split('testing');
  const noTest = testT.includes('none') || testT.length === 0;
  const testing = noTest ? 5 : Math.min(93,
    (testT.includes('unit')          ? 28 : 0) +
    (testT.includes('integration')   ? 22 : 0) +
    (testT.includes('e2e')           ? 22 : 0) +
    (testT.includes('comprehensive') ? 18 : 5));

  // Dokumentation – Arten minus Abzug für veraltete Doku
  const docT = split('documentation');
  const noDocs = docT.includes('none') || docT.length === 0;
  const validDocs = docT.filter(d => !['none', 'outdated'].includes(d)).length;
  const dokumentation = noDocs ? 5 : Math.max(5, validDocs * 23 - (docT.includes('outdated') ? 18 : 0));

  // Prozesse – CI/CD + Branching
  const cicdT = split('cicd');
  const noCicd = cicdT.includes('none') || cicdT.length === 0;
  const cicdS = noCicd ? 5 : Math.min(92,
    (cicdT.includes('standardized') ? 36 : 16) + cicdT.filter(v => v !== 'none').length * 11);
  const branchS = ({ trunk: 92, gitflow: 76, basic: 50, none: 8 } as Record<string, number>)[data.branching as string] ?? 8;
  const prozesse = cicdS * 0.62 + branchS * 0.38;

  // Monitoring – Arten
  const monT = split('monitoring');
  const noMon = monT.includes('none') || monT.length === 0;
  const monitoring = noMon ? 5 : Math.min(92, monT.filter(v => v !== 'none').length * 21);

  // Architektur-Reife – abgeleitet aus Score und Risikoanzahl
  const highRisks = analysis.risks.filter(r => r.severity === 'high').length;
  const midRisks  = analysis.risks.filter(r => r.severity === 'medium').length;
  const architektur = Math.max(5, (analysis.score ?? 50) - highRisks * 5 - midRisks * 1.5);

  const c = (v: number) => Math.max(5, Math.min(93, Math.round(v)));
  return { Architektur: c(architektur), Sicherheit: c(sicherheit), Prozesse: c(prozesse), Testing: c(testing), Monitoring: c(monitoring), Dokumentation: c(dokumentation) };
}

const RECS: Record<DimKey, [string, string, string]> = {
  Sicherheit:    ['Keine Maßnahmen erkannt → Dependency Scanning, PR-Pflicht und Auth-Framework jetzt einführen.', 'Basisabsicherung vorhanden → Secrets Management, SAST-Analyse und Penetration Tests ergänzen.', 'Gut abgesichert → Regelmäßige Security Audits und Zero-Trust-Konzepte als nächste Stufe.'],
  Testing:       ['Kein Testkonzept → Unit Tests einrichten, dann Integration- & E2E-Tests aufbauen.', 'Erste Tests vorhanden → Abdeckung erhöhen, Coverage-Reports (Vitest/Istanbul) einrichten.', 'Gute Teststrategie → Mutation Testing und Lasttest-Szenarien zur Vervollständigung.'],
  Dokumentation: ['Dokumentation fehlt → READMEs und ADRs (Architecture Decision Records) anlegen.', 'Basis vorhanden → API-Docs, Storybook und zentrales Wiki (Notion/Confluence) aufbauen.', 'Gute Dokubasis → Living Documentation und automatisierte Changelog-Generierung.'],
  Prozesse:      ['CI/CD fehlt → GitHub Actions oder GitLab CI als ersten konkreten Schritt einrichten.', 'CI/CD teilweise vorhanden → Standardisierung auf alle Repos und Trunk-Based Development.', 'Gut aufgestellt → Release Automation, Feature Flags und GitOps-Workflows ergänzen.'],
  Monitoring:    ['Kein Monitoring → Uptime-Monitoring und Error Tracking (Sentry) sofort einrichten.', 'Basis-Monitoring vorhanden → Zentrales Logging, Dashboards und Alerting ausbauen.', 'Gutes Monitoring → APM, Distributed Tracing und SLO-basiertes Incident-Management.'],
  Architektur:   ['Viele kritische Risiken → Technische Schulden abbauen, Architektur-Review gezielt durchführen.', 'Mittlere Reife → Kritische Risiken adressieren und Soll-Architektur schriftlich fixieren.', 'Gute Qualität → Fitness Functions und kontinuierliche ADRs zur Qualitätssicherung einführen.'],
};

function level(s: number) {
  if (s >= 65) return { label: 'Gut',         color: '#22aa66' };
  if (s >= 35) return { label: 'Ausbaufähig', color: '#f59e0b' };
  return         { label: 'Kritisch',         color: '#ef4444' };
}

// ── SVG Radar ────────────────────────────────────────────────
const W = 420, H = 400, CX = 210, CY = 196, R = 125, N = 6;

function ang(i: number) { return (i * 2 * Math.PI) / N - Math.PI / 2; }
function pt(i: number, r: number) { const a = ang(i); return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }; }
function hexPts(frac: number) { return Array.from({ length: N }, (_, i) => { const p = pt(i, R * frac); return `${p.x},${p.y}`; }).join(' '); }
function scorePoly(scores: Scores) { return DIMS.map((d, i) => { const p = pt(i, (scores[d] / 100) * R); return `${p.x},${p.y}`; }).join(' '); }
function anchor(i: number) { return Math.abs(Math.cos(ang(i))) < 0.25 ? 'middle' : Math.cos(ang(i)) > 0 ? 'start' : 'end'; }

export function MaturityRadar({ data, analysis }: { data: WizardData; analysis: AnalysisResult }) {
  const scores = calcScores(data, analysis);
  const vals   = DIMS.map(d => scores[d]);
  const overall = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  const ovLvl   = level(overall);

  return (
    <div>
      {/* Gesamt-Reifegrad */}
      <div className="flex items-center gap-4 mb-5 p-4 rounded-xl border border-white/[0.06]" style={{ background: 'rgba(14,6,6,0.75)' }}>
        <div className="text-center shrink-0 w-16">
          <div className="text-3xl font-black" style={{ color: ovLvl.color }}>{overall}%</div>
          <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Reifegrad</div>
        </div>
        <div>
          <div className="text-sm font-bold text-white">{ovLvl.label}</div>
          <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
            Gemittelt über alle 6 Architektur-Dimensionen (basierend auf Wizard-Eingaben + Analyse)
          </p>
        </div>
      </div>

      {/* SVG Radar Chart */}
      <div className="flex justify-center mb-5">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: 420, maxHeight: 380 }}>
          {/* Grid hexagons */}
          {[0.25, 0.5, 0.75, 1.0].map((f, gi) => (
            <polygon key={gi} points={hexPts(f)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          ))}
          {/* Grid % labels */}
          {[25, 50, 75].map(pct => {
            const p = pt(0, (pct / 100) * R);
            return <text key={pct} x={p.x + 3} y={p.y} fill="rgba(255,255,255,0.15)" fontSize="7.5" fontFamily="monospace">{pct}%</text>;
          })}
          {/* Axis lines */}
          {DIMS.map((_, i) => { const o = pt(i, R); return <line key={i} x1={CX} y1={CY} x2={o.x} y2={o.y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />; })}
          {/* Score polygon */}
          <polygon points={scorePoly(scores)} fill="rgba(99,102,241,0.14)" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
          {/* Score dots + glow */}
          {DIMS.map((dim, i) => {
            const p = pt(i, (scores[dim] / 100) * R);
            const col = DIM_COLORS[dim];
            return (
              <g key={dim}>
                <circle cx={p.x} cy={p.y} r={9}  fill={col} opacity={0.14} />
                <circle cx={p.x} cy={p.y} r={4.5} fill={col} opacity={0.90} />
              </g>
            );
          })}
          {/* Labels */}
          {DIMS.map((dim, i) => {
            const lr = R * 1.26;
            const a  = ang(i);
            const lx = CX + lr * Math.cos(a);
            const ly = CY + lr * Math.sin(a);
            const ta = anchor(i);
            const col = DIM_COLORS[dim];
            return (
              <g key={dim}>
                <text x={lx} y={ly - 2} textAnchor={ta} fontSize="10" fontWeight="bold" fill={col} fontFamily="system-ui">
                  {DIM_ICONS[dim]} {dim}
                </text>
                <text x={lx} y={ly + 11} textAnchor={ta} fontSize="9" fill="rgba(255,255,255,0.4)" fontFamily="monospace">
                  {scores[dim]}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Per-Dimension Karten */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {DIMS.map(dim => {
          const s   = scores[dim];
          const lv  = level(s);
          const idx = s < 35 ? 0 : s < 65 ? 1 : 2;
          return (
            <div key={dim} className="rounded-lg p-3 border border-white/[0.06]" style={{ background: 'rgba(14,6,6,0.65)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white/80">{DIM_ICONS[dim]} {dim}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: lv.color, background: lv.color + '18' }}>
                  {lv.label} · {s}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] mb-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s}%`, background: lv.color }} />
              </div>
              <p className="text-[11px] text-white/38 leading-relaxed">{RECS[dim][idx]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
