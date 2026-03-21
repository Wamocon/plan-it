'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';

export default function DashboardPage() {
  const router = useRouter();
  const projects        = useAppStore(s => s.projects);
  const organizations   = useAppStore(s => s.organizations);
  const deleteProject   = useAppStore(s => s.deleteProject);
  const assignProjectToOrg = useAppStore(s => s.assignProjectToOrg);
  const loadOrganizations  = useAppStore(s => s.loadOrganizations);

  const [filterOrgId, setFilterOrgId]     = useState<string | null>(null);
  const [assignModal, setAssignModal]     = useState<{ projectId: string; current: string | undefined } | null>(null);
  const [assignOrgId, setAssignOrgId]     = useState<string>('');
  const [assigning, setAssigning]         = useState(false);

  useEffect(() => { loadOrganizations(); }, [loadOrganizations]);

  const visibleProjects = filterOrgId
    ? projects.filter(p => p.orgId === filterOrgId)
    : projects;

  const avgScore = visibleProjects.length > 0
    ? Math.round(visibleProjects.reduce((s, p) => s + (p.analysis.score ?? 0), 0) / visibleProjects.length)
    : null;
  const totalHigh = visibleProjects.reduce((s, p) => s + p.analysis.risks.filter(r => r.severity === 'high').length, 0);
  const totalMid  = visibleProjects.reduce((s, p) => s + p.analysis.risks.filter(r => r.severity === 'medium').length, 0);
  const aiCount   = visibleProjects.filter(p => p.analysis.source === 'ai').length;

  function openAssignModal(projectId: string, current: string | undefined) {
    setAssignOrgId(current ?? '');
    setAssignModal({ projectId, current });
  }

  async function handleAssign() {
    if (!assignModal) return;
    setAssigning(true);
    await assignProjectToOrg(assignModal.projectId, assignOrgId || null);
    setAssigning(false);
    setAssignModal(null);
  }

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

      {/* Org-Filter */}
      {organizations.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setFilterOrgId(null)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
              filterOrgId === null
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-transparent text-white/40 border-white/10 hover:border-white/20 hover:text-white/60'
            }`}>
            Alle Projekte
          </button>
          {organizations.map(org => (
            <button
              key={org.id}
              onClick={() => setFilterOrgId(filterOrgId === org.id ? null : org.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                filterOrgId === org.id
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                  : 'bg-transparent text-white/40 border-white/10 hover:border-blue-500/30 hover:text-blue-300/70'
              }`}>
              🏢 {org.name}
              <span className="ml-1.5 text-[10px] opacity-60">
                {projects.filter(p => p.orgId === org.id).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Stats Row */}
      {visibleProjects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Projekte gesamt', value: visibleProjects.length, color: 'text-white' },
            { label: 'Ø Architektur-Score', value: avgScore ?? '–', color: avgScore == null ? 'text-white/30' : avgScore >= 71 ? 'text-[#22aa66]' : avgScore >= 51 ? 'text-amber-400' : 'text-red-400' },
            { label: 'Hohe Risiken', value: totalHigh, color: totalHigh > 0 ? 'text-red-400' : 'text-[#22aa66]' },
            { label: 'KI-Analysen', value: `${aiCount}/${visibleProjects.length}`, color: 'text-purple-400' },
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
      {visibleProjects.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-white/10"
          style={{ background: 'rgba(255,26,26,0.02)' }}>
          <div className="text-5xl mb-4">{filterOrgId ? '🏢' : '📐'}</div>
          <h3 className="text-white font-bold text-lg mb-1">
            {filterOrgId ? 'Keine Projekte in dieser Organisation' : 'Noch keine Projekte'}
          </h3>
          <p className="text-white/35 text-sm mb-6">
            {filterOrgId
              ? 'Weise Projekte über das Kontextmenü der Karte zu.'
              : 'Erstelle dein erstes Architektur-Projekt.'}
          </p>
          {!filterOrgId && (
            <Link href="/wizard"
              className="inline-block bg-[#ff1a1a] text-white px-6 py-2.5 rounded-xl font-bold text-sm no-underline hover:opacity-90 transition-opacity"
              style={{ boxShadow: '0 4px 18px rgba(255,26,26,0.3)' }}>
              Jetzt starten
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleProjects.map(p => {
            const hi = p.analysis.risks.filter(r => r.severity === 'high').length;
            const mi = p.analysis.risks.filter(r => r.severity === 'medium').length;
            const lo = p.analysis.risks.filter(r => r.severity === 'low').length;
            const score = p.analysis.score;
            const orgName = p.orgId ? organizations.find(o => o.id === p.orgId)?.name : undefined;

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
                    <div className="flex items-center gap-1">
                      {organizations.length > 0 && (
                        <button
                          title="Organisation zuweisen"
                          onClick={e => { e.stopPropagation(); openAssignModal(p.id, p.orgId); }}
                          className="bg-transparent border-none text-white/20 cursor-pointer text-base leading-none hover:text-blue-400 transition-colors px-1">
                          🏢
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); deleteProject(p.id); }}
                        className="bg-transparent border-none text-white/15 cursor-pointer text-xl leading-none hover:text-[#ff1a1a] transition-colors">
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="font-black text-white text-base leading-tight mb-0.5">{p.data.projectName || 'Unbenannt'}</div>
                  <div className="text-white/35 text-xs">{p.data.clientName || ''}</div>

                  {/* Org-Badge */}
                  {orgName && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-blue-300/70 bg-blue-900/20 border border-blue-500/15 px-2 py-0.5 rounded-full">
                      🏢 {orgName}
                    </div>
                  )}
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

      {/* Org-Zuweisungs-Modal */}
      {assignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setAssignModal(null)}>
          <div
            className="rounded-2xl border border-white/10 p-6 w-full max-w-sm"
            style={{ background: 'rgba(20,8,8,0.98)' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-black text-lg mb-1">Organisation zuweisen</h3>
            <p className="text-white/40 text-sm mb-5">Wähle die Organisation, der dieses Projekt zugeordnet werden soll.</p>
            <select
              value={assignOrgId}
              onChange={e => setAssignOrgId(e.target.value)}
              className="w-full rounded-xl border border-white/10 text-white text-sm px-4 py-2.5 mb-5 outline-none focus:border-blue-500/40"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <option value="">Keine Organisation</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setAssignModal(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm font-bold hover:text-white/80 transition-colors"
                style={{ background: 'transparent' }}>
                Abbrechen
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="px-5 py-2 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: '#2563eb' }}>
                {assigning ? 'Speichert…' : 'Zuweisen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
