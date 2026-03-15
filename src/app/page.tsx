'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';

export default function DashboardPage() {
  const router = useRouter();
  const projects = useAppStore(s => s.projects);
  const deleteProject = useAppStore(s => s.deleteProject);

  const avgScore = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + (p.analysis.score ?? 0), 0) / projects.length)
    : null;
  const totalHigh = projects.reduce((s, p) => s + p.analysis.risks.filter(r => r.severity === 'high').length, 0);
  const totalMid  = projects.reduce((s, p) => s + p.analysis.risks.filter(r => r.severity === 'medium').length, 0);
  const aiCount   = projects.filter(p => p.analysis.source === 'ai').length;

  return (
    <div className="px-6 py-8 max-w-6xl">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Übersicht</p>
          <h2 className="text-2xl font-black text-white leading-tight">Projekte</h2>
          <p className="text-white/35 text-sm mt-0.5">{projects.length} Projekt{projects.length !== 1 ? 'e' : ''} gespeichert</p>
        </div>
        <Link href="/wizard"
          className="bg-[#ff1a1a] text-white px-5 py-2.5 rounded-xl font-bold text-sm no-underline hover:opacity-90 transition-opacity"
          style={{ boxShadow: '0 4px 18px rgba(255,26,26,0.3)' }}>
          + Neues Projekt
        </Link>
      </div>

      {/* Stats Row */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Projekte gesamt', value: projects.length, color: 'text-white' },
            { label: 'Ø Architektur-Score', value: avgScore ?? '–', color: avgScore == null ? 'text-white/30' : avgScore >= 71 ? 'text-[#22aa66]' : avgScore >= 51 ? 'text-amber-400' : 'text-red-400' },
            { label: 'Hohe Risiken', value: totalHigh, color: totalHigh > 0 ? 'text-red-400' : 'text-[#22aa66]' },
            { label: 'KI-Analysen', value: `${aiCount}/${projects.length}`, color: 'text-purple-400' },
          ].map(stat => (
            <div key={stat.label}
              className="rounded-xl border border-white/[0.06] p-4"
              style={{ background: 'rgba(22,10,10,0.7)' }}>
              <div className={`text-2xl font-black leading-none ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] text-white/30 mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-white/10"
          style={{ background: 'rgba(255,26,26,0.02)' }}>
          <div className="text-5xl mb-4">📐</div>
          <h3 className="text-white font-bold text-lg mb-1">Noch keine Projekte</h3>
          <p className="text-white/35 text-sm mb-6">Erstelle dein erstes Architektur-Projekt.</p>
          <Link href="/wizard"
            className="inline-block bg-[#ff1a1a] text-white px-6 py-2.5 rounded-xl font-bold text-sm no-underline hover:opacity-90 transition-opacity"
            style={{ boxShadow: '0 4px 18px rgba(255,26,26,0.3)' }}>
            Jetzt starten
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const hi = p.analysis.risks.filter(r => r.severity === 'high').length;
            const mi = p.analysis.risks.filter(r => r.severity === 'medium').length;
            const lo = p.analysis.risks.filter(r => r.severity === 'low').length;
            const score = p.analysis.score;

            return (
              <div key={p.id}
                onClick={() => router.push(`/project/${p.id}`)}
                className="card-shimmer rounded-2xl border cursor-pointer transition-all duration-300 group"
                style={{
                  background: 'rgba(22,10,10,0.9)',
                  borderColor: 'rgba(255,255,255,0.07)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,26,26,0.25)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(255,26,26,0.1), 0 2px 8px rgba(0,0,0,0.3)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                  (e.currentTarget as HTMLElement).style.transform = '';
                }}>

                {/* Card top */}
                <div className="p-4 pb-3">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      p.analysis.source === 'ai'
                        ? 'bg-purple-900/50 text-purple-300 border-purple-500/20'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}>
                      {p.analysis.source === 'ai' ? '🤖 KI' : '✅ Regel'}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteProject(p.id); }}
                      className="bg-transparent border-none text-white/15 cursor-pointer text-xl leading-none hover:text-[#ff1a1a] transition-colors">
                      ×
                    </button>
                  </div>

                  <div className="font-black text-white text-base leading-tight mb-0.5">{p.data.projectName || 'Unbenannt'}</div>
                  <div className="text-white/35 text-xs">{p.data.clientName || ''}</div>
                </div>

                {/* KPI divider */}
                <div className="border-t border-white/[0.05] mx-4" />

                {/* KPI numbers */}
                <div className="p-4 pt-3">
                  {score !== undefined && (
                    <div className="mb-3">
                      <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-0.5">Architektur-Score</div>
                      <div className={`text-2xl font-black leading-none ${score >= 71 ? 'text-[#22aa66]' : score >= 51 ? 'text-amber-400' : 'text-[#ff1a1a]'}`}>
                        {score}<span className="text-sm font-bold opacity-50">/100</span>
                      </div>
                    </div>
                  )}
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Risiken</div>
                  <div className="flex gap-3">
                    <div className="text-center">
                      <div className="text-lg font-black text-red-400 leading-none">{hi}</div>
                      <div className="text-[9px] text-white/25 mt-0.5">Hoch</div>
                    </div>
                    <div className="w-px bg-white/[0.06]" />
                    <div className="text-center">
                      <div className="text-lg font-black text-amber-400 leading-none">{mi}</div>
                      <div className="text-[9px] text-white/25 mt-0.5">Mittel</div>
                    </div>
                    <div className="w-px bg-white/[0.06]" />
                    <div className="text-center">
                      <div className="text-lg font-black text-blue-400 leading-none">{lo}</div>
                      <div className="text-[9px] text-white/25 mt-0.5">Niedrig</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
