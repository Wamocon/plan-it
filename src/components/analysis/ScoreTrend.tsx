'use client';
import { AnalysisSnapshot } from '@/types';

const scoreColor = (s?: number) =>
  !s ? '#666' : s >= 71 ? '#22aa66' : s >= 51 ? '#f59e0b' : '#ef4444';

export function ScoreTrend({ snapshots, currentScore }: { snapshots: AnalysisSnapshot[]; currentScore?: number }) {
  const all = [
    ...snapshots,
    ...(currentScore != null ? [{ id: 'current', takenAt: new Date().toISOString(), score: currentScore, riskCount: 0, highCount: 0, source: 'fallback' as const }] : []),
  ].filter(s => s.score != null);

  if (all.length < 2) {
    return (
      <div className="text-center py-10 text-white/25 text-sm rounded-xl border border-white/[0.06]"
        style={{ background: 'rgba(14,6,6,0.5)' }}>
        <div className="text-3xl mb-2">📈</div>
        Der Trend wird sichtbar sobald die Analyse mindestens <strong className="text-white/40">zweimal</strong> gespeichert wurde.<br/>
        <span className="text-[11px]">Führe eine erneute KI-Analyse durch um den Verlauf zu erfassen.</span>
      </div>
    );
  }

  const W = 500; const H = 180;
  const PAD = { top: 20, right: 20, bottom: 36, left: 40 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const scores = all.map(s => s.score!);
  const minS = Math.max(0, Math.min(...scores) - 10);
  const maxS = Math.min(100, Math.max(...scores) + 10);

  const toX = (i: number) => PAD.left + (i / (all.length - 1)) * plotW;
  const toY = (s: number) => PAD.top + plotH - ((s - minS) / (maxS - minS)) * plotH;

  const pathD = all.map((s, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(s.score!)}`).join(' ');
  const areaD = `${pathD} L ${toX(all.length - 1)} ${PAD.top + plotH} L ${toX(0)} ${PAD.top + plotH} Z`;

  const diff = scores[scores.length - 1] - scores[0];

  return (
    <div className="rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(14,6,6,0.7)' }}>
      <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Score-Verlauf</span>
        <span className={`text-xs font-bold ${diff > 0 ? 'text-[#22aa66]' : diff < 0 ? 'text-red-400' : 'text-white/40'}`}>
          {diff > 0 ? `▲ +${diff}` : diff < 0 ? `▼ ${diff}` : '–'} seit Start
        </span>
      </div>
      <div className="p-4 overflow-x-auto">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="max-w-full">
          <defs>
            <linearGradient id="st-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22aa66" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#22aa66" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal grid */}
          {[0.25, 0.5, 0.75, 1].map(t => {
            const yv = minS + t * (maxS - minS);
            return (
              <g key={t}>
                <line x1={PAD.left} y1={toY(yv)} x2={PAD.left + plotW} y2={toY(yv)}
                  stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x={PAD.left - 6} y={toY(yv) + 4} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="9">
                  {Math.round(yv)}
                </text>
              </g>
            );
          })}

          {/* Area */}
          <path d={areaD} fill="url(#st-area)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="#22aa66" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {/* Points */}
          {all.map((s, i) => (
            <g key={i}>
              <circle cx={toX(i)} cy={toY(s.score!)} r={5} fill={scoreColor(s.score)} stroke="#0d0809" strokeWidth="2" />
              <text x={toX(i)} y={toY(s.score!) - 10} textAnchor="middle" fill={scoreColor(s.score)} fontSize="10" fontWeight="bold">
                {s.score}
              </text>
            </g>
          ))}

          {/* X-Axis dates */}
          {all.map((s, i) => (
            <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9">
              {s.id === 'current' ? 'Jetzt' : new Date(s.takenAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
            </text>
          ))}
        </svg>
      </div>

      {/* Snapshot Table */}
      <div className="px-4 pb-4">
        <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">Analyse-Verlauf</div>
        <div className="space-y-1">
          {all.map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: scoreColor(s.score) }} />
              <span className="text-white/35 w-20 shrink-0">
                {s.id === 'current' ? 'Aktuell' : new Date(s.takenAt).toLocaleDateString('de-DE')}
              </span>
              <span className="font-bold" style={{ color: scoreColor(s.score) }}>{s.score}/100</span>
              <span className="text-white/25 ml-auto text-[10px]">
                {s.source === 'ai' ? '🤖 KI' : '📊 Regel'}
                {s.riskCount > 0 && ` · ${s.riskCount} Risiken (${s.highCount} hoch)`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
