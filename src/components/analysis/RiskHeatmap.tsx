'use client';
import { Risk, Severity } from '@/types';

const IMPACT_LABEL: Record<Severity, { x: number; label: string }> = {
  high:   { x: 0.75, label: 'Hoch' },
  medium: { x: 0.50, label: 'Mittel' },
  low:    { x: 0.25, label: 'Niedrig' },
};

// Wahrscheinlichkeit aus dem Titel / Beschreibung schätzen (heuristisch)
function estimateProbability(risk: Risk): number {
  const text = (risk.title + ' ' + risk.description).toLowerCase();
  if (text.includes('kein') || text.includes('fehlt') || text.includes('ohne') || text.includes('nie')) return 0.85;
  if (text.includes('inconsistent') || text.includes('inkonsist') || text.includes('fragmentiert')) return 0.70;
  if (text.includes('langsa') || text.includes('verzöger') || text.includes('komplex')) return 0.55;
  if (text.includes('risiko') || text.includes('potenziell') || text.includes('möglicherweise')) return 0.40;
  return risk.severity === 'high' ? 0.75 : risk.severity === 'medium' ? 0.55 : 0.35;
}

const SEV_COLOR: Record<Severity, string> = {
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#60a5fa',
};

export function RiskHeatmap({ risks }: { risks: Risk[] }) {
  if (risks.length === 0) {
    return <p className="text-center py-10 text-white/30 text-sm">Keine Risiken vorhanden 🎉</p>;
  }

  const W = 560; const H = 340;
  const PAD = { top: 20, right: 20, bottom: 48, left: 52 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Risiken auf Koordinaten mappen
  const points = risks.map(r => ({
    risk: r,
    x: PAD.left + IMPACT_LABEL[r.severity].x * plotW,
    y: PAD.top + (1 - estimateProbability(r)) * plotH,
    color: SEV_COLOR[r.severity],
  }));

  // Leicht jittern bei gleichen Positionen
  const jittered = points.map((p, i) => {
    const samePos = points.slice(0, i).filter(q => Math.abs(q.x - p.x) < 8 && Math.abs(q.y - p.y) < 8);
    return { ...p, x: p.x + samePos.length * 14, y: p.y + samePos.length * 6 };
  });

  return (
    <div className="rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(14,6,6,0.7)' }}>
      <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Risiko-Matrix</span>
        <div className="flex gap-3">
          {([['high','Hoch','#ef4444'],['medium','Mittel','#f59e0b'],['low','Niedrig','#60a5fa']] as [Severity,string,string][]).map(([,label,color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[10px] text-white/40">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="max-w-full">
          <defs>
            {/* Heatmap background gradients */}
            <linearGradient id="hm-x" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(96,165,250,0.05)" />
              <stop offset="50%" stopColor="rgba(245,158,11,0.08)" />
              <stop offset="100%" stopColor="rgba(239,68,68,0.14)" />
            </linearGradient>
            <linearGradient id="hm-y" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(239,68,68,0.12)" />
              <stop offset="100%" stopColor="rgba(96,165,250,0.03)" />
            </linearGradient>
          </defs>

          {/* Heatmap-Hintergrund */}
          <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} fill="url(#hm-x)" rx="4" />
          <rect x={PAD.left} y={PAD.top} width={plotW} height={plotH} fill="url(#hm-y)" rx="4" />

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(t => (
            <g key={t}>
              <line x1={PAD.left + t * plotW} y1={PAD.top} x2={PAD.left + t * plotW} y2={PAD.top + plotH}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4,4" />
              <line x1={PAD.left} y1={PAD.top + (1 - t) * plotH} x2={PAD.left + plotW} y2={PAD.top + (1 - t) * plotH}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4,4" />
            </g>
          ))}

          {/* Axes */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH + 6} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <line x1={PAD.left - 6} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

          {/* X-Axis Labels */}
          {[['Niedrig', 0.25], ['Mittel', 0.5], ['Hoch', 0.75]].map(([label, t]) => (
            <text key={label as string} x={PAD.left + (t as number) * plotW} y={PAD.top + plotH + 22}
              textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10">
              {label as string}
            </text>
          ))}
          <text x={PAD.left + plotW / 2} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" letterSpacing="2">
            AUSWIRKUNG (IMPACT)
          </text>

          {/* Y-Axis Labels */}
          {[['Hoch', 0.1], ['Mittel', 0.5], ['Niedrig', 0.9]].map(([label, t]) => (
            <text key={label as string} x={PAD.left - 8} y={PAD.top + (t as number) * plotH + 4}
              textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="10">
              {label as string}
            </text>
          ))}
          <text x={14} y={PAD.top + plotH / 2} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9"
            transform={`rotate(-90, 14, ${PAD.top + plotH / 2})`} letterSpacing="2">
            WAHRSCHEINLICHKEIT
          </text>

          {/* Risk Points */}
          {jittered.map((p, i) => (
            <g key={i}>
              {/* Glow */}
              <circle cx={p.x} cy={p.y} r={16} fill={p.color} opacity={0.08} />
              {/* Point */}
              <circle cx={p.x} cy={p.y} r={7} fill={p.color} opacity={0.85} />
              <circle cx={p.x} cy={p.y} r={7} fill="none" stroke={p.color} strokeWidth="1.5" opacity={0.5} />
              {/* Number */}
              <text x={p.x} y={p.y + 4} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4 space-y-1.5">
        {jittered.map((p, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: p.color, opacity: 0.85 }}>
              <span className="text-[8px] text-white font-bold">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-white/70 font-medium">{p.risk.title}</span>
              <span className="text-[10px] text-white/30 ml-2">→ {p.risk.recommendation.slice(0, 80)}{p.risk.recommendation.length > 80 ? '…' : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
