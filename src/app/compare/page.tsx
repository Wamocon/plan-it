'use client';
import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const scoreColor = (s?: number) =>
  !s ? 'text-white/30' : s >= 71 ? 'text-[#22aa66]' : s >= 51 ? 'text-amber-400' : 'text-red-400';

const sevBg = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-blue-400' };

export default function ComparePage() {
  const projects = useAppStore(s => s.projects);
  const [a, setA] = useState<string>('');
  const [b, setB] = useState<string>('');

  const pA = projects.find(p => p.id === a);
  const pB = projects.find(p => p.id === b);

  if (projects.length < 2) {
    return (
      <div className="px-6 py-12 max-w-lg">
        <Link href="/" className="inline-flex items-center gap-1.5 text-white/40 text-xs mb-6 no-underline hover:text-white/70">
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
          <div className="text-4xl mb-3">⚖️</div>
          <h3 className="text-white font-bold text-lg mb-1">Mindestens 2 Projekte nötig</h3>
          <p className="text-white/35 text-sm">Erstelle ein weiteres Projekt um den Vergleich zu nutzen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-6xl">
      <Link href="/" className="inline-flex items-center gap-1.5 text-white/40 text-xs mb-4 no-underline hover:text-white/70">
        <ArrowLeft size={12} /> Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-0.5">Analyse</p>
          <h2 className="text-2xl font-black text-white">Projektvergleich</h2>
        </div>
      </div>

      {/* Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[{ label: 'Projekt A', value: a, set: setA, other: b },
          { label: 'Projekt B', value: b, set: setB, other: a }].map(sel => (
          <div key={sel.label}>
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">{sel.label}</label>
            <select value={sel.value} onChange={e => sel.set(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm">
              <option value="">-- Projekt auswählen --</option>
              {projects.filter(p => p.id !== sel.other).map(p => (
                <option key={p.id} value={p.id}>{p.data.projectName || 'Unbenannt'} ({p.analysis.score ?? '?'}/100)</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {pA && pB && (
        <div className="space-y-4">
          {/* Score Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <ScoreCard project={pA} label="A" />
            <div className="text-white/20 font-black text-2xl text-center hidden sm:block">VS</div>
            <ScoreCard project={pB} label="B" />
          </div>

          {/* Metric Table */}
          <div className="rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(14,6,6,0.7)' }}>
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Kennzahlen</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {[
                { label: 'Architektur-Score', a: `${pA.analysis.score ?? '–'}/100`, b: `${pB.analysis.score ?? '–'}/100`,
                  winner: (pA.analysis.score ?? 0) > (pB.analysis.score ?? 0) ? 'a' : (pB.analysis.score ?? 0) > (pA.analysis.score ?? 0) ? 'b' : 'tie' },
                { label: 'Gesamt-Risiken', a: pA.analysis.risks.length, b: pB.analysis.risks.length,
                  winner: pA.analysis.risks.length < pB.analysis.risks.length ? 'a' : pB.analysis.risks.length < pA.analysis.risks.length ? 'b' : 'tie' },
                { label: 'Hohe Risiken', a: pA.analysis.risks.filter(r=>r.severity==='high').length, b: pB.analysis.risks.filter(r=>r.severity==='high').length,
                  winner: pA.analysis.risks.filter(r=>r.severity==='high').length < pB.analysis.risks.filter(r=>r.severity==='high').length ? 'a' : pB.analysis.risks.filter(r=>r.severity==='high').length < pA.analysis.risks.filter(r=>r.severity==='high').length ? 'b' : 'tie' },
                { label: 'Team-Größe', a: pA.data.teamSize || '–', b: pB.data.teamSize || '–', winner: 'tie' as const },
                { label: 'Besteh. Apps', a: pA.data.appCount || '–', b: pB.data.appCount || '–', winner: 'tie' as const },
                { label: 'Ziel-Apps', a: pA.data.targetApps || '–', b: pB.data.targetApps || '–', winner: 'tie' as const },
                { label: 'Analyse-Typ', a: pA.analysis.source === 'ai' ? '🤖 KI' : '📊 Regel', b: pB.analysis.source === 'ai' ? '🤖 KI' : '📊 Regel', winner: 'tie' as const },
              ].map(row => (
                <div key={row.label} className="grid grid-cols-[1fr_140px_1fr] items-center px-4 py-2">
                  <div className={`text-sm ${row.winner === 'a' ? 'text-[#22aa66] font-bold' : 'text-white/70'}`}>{String(row.a)}</div>
                  <div className="text-[10px] text-white/25 text-center font-medium uppercase tracking-wider">{row.label}</div>
                  <div className={`text-sm text-right ${row.winner === 'b' ? 'text-[#22aa66] font-bold' : 'text-white/70'}`}>{String(row.b)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[{ project: pA, label: 'A' }, { project: pB, label: 'B' }].map(({ project, label }) => (
              <div key={label} className="rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(14,6,6,0.7)' }}>
                <div className="px-4 py-2.5 border-b border-white/[0.06]">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    Risiken – Projekt {label}: {project.data.projectName}
                  </span>
                </div>
                <div className="p-3 space-y-1.5">
                  {project.analysis.risks.length === 0
                    ? <p className="text-white/25 text-xs text-center py-3">Keine Risiken 🎉</p>
                    : project.analysis.risks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className={`${sevBg[r.severity]} text-white text-[8px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0`}>
                          {r.severity === 'high' ? 'H' : r.severity === 'medium' ? 'M' : 'N'}
                        </div>
                        <span className="text-xs text-white/60">{r.title}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tech Stack Diff */}
          <div className="rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(14,6,6,0.7)' }}>
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Tech-Stack Vergleich</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-white/[0.06]">
              {[{ project: pA, label: 'A' }, { project: pB, label: 'B' }].map(({ project, label }) => {
                const stack = (project.data.primaryStack || '').split(',').filter(Boolean);
                const db = (project.data.database || '').split(',').filter(Boolean);
                const hosting = (project.data.hosting || '').split(',').filter(Boolean);
                return (
                  <div key={label} className="p-4 space-y-3">
                    <div className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Projekt {label}: {project.data.projectName}</div>
                    {[['Stack', stack], ['Datenbank', db], ['Hosting', hosting]].map(([title, items]) => (
                      <div key={title as string}>
                        <div className="text-[9px] text-white/30 mb-1">{title as string}</div>
                        <div className="flex flex-wrap gap-1">
                          {(items as string[]).map(item => (
                            <span key={item} className="text-[10px] bg-white/8 border border-white/10 text-white/60 px-2 py-0.5 rounded-full">{item}</span>
                          ))}
                          {(items as string[]).length === 0 && <span className="text-white/20 text-[10px]">–</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {(!pA || !pB) && (
        <div className="text-center py-16 text-white/25 text-sm">
          <div className="text-4xl mb-2">⚖️</div>
          Wähle zwei Projekte aus um den Vergleich zu starten.
        </div>
      )}
    </div>
  );
}

function ScoreCard({ project, label }: { project: ReturnType<typeof useAppStore.getState>['projects'][0]; label: string }) {
  const s = project.analysis.score;
  const high = project.analysis.risks.filter(r => r.severity === 'high').length;
  return (
    <div className="rounded-xl border border-white/[0.07] p-5 text-center" style={{ background: 'rgba(22,10,10,0.7)' }}>
      <div className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">Projekt {label}</div>
      <div className="text-white font-black text-lg mb-1 truncate">{project.data.projectName}</div>
      <div className={`text-4xl font-black ${scoreColor(s)}`}>{s ?? '–'}<span className="text-lg text-white/30">/100</span></div>
      <div className="text-[10px] text-white/40 mt-1">{project.analysis.scoreLabel ?? '–'}</div>
      <div className="mt-3 flex justify-center gap-4 text-center">
        <div>
          <div className="text-lg font-black text-red-400 leading-none">{high}</div>
          <div className="text-[9px] text-white/25">Hoch</div>
        </div>
        <div>
          <div className="text-lg font-black text-white/50 leading-none">{project.analysis.risks.length}</div>
          <div className="text-[9px] text-white/25">Gesamt</div>
        </div>
      </div>
      <Link href={`/project/${project.id}`}
        className="mt-3 inline-block text-[10px] text-white/30 hover:text-white/60 no-underline transition-colors">
        → Zur Analyse
      </Link>
    </div>
  );
}
