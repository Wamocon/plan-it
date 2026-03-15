'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { LayoutDashboard, PlusCircle, Settings, FolderOpen, GitCompare } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const projects = useAppStore(s => s.projects);

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: '/wizard', icon: PlusCircle, label: 'Neues Projekt', exact: true },
    { href: '/compare', icon: GitCompare, label: 'Vergleich', exact: true },
  ];

  const recent = [...projects].reverse().slice(0, 5);

  const avgScore = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + (p.analysis.score ?? 0), 0) / projects.length)
    : null;

  const totalHighRisks = projects.reduce((s, p) =>
    s + p.analysis.risks.filter(r => r.severity === 'high').length, 0);

  return (
    <aside
      className="hidden md:flex flex-col w-52 shrink-0 border-r border-white/[0.06] overflow-y-auto"
      style={{ background: 'rgba(8,3,3,0.85)' }}
    >
      {/* Navigation */}
      <nav className="p-3 flex flex-col gap-0.5">
        <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-2 pt-3 pb-1.5">
          Navigation
        </div>
        {navItems.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium no-underline transition-all duration-150 ${
                active
                  ? 'bg-[#ff1a1a]/12 text-white border border-[#ff1a1a]/20'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/[0.05]'
              }`}
              style={active ? { boxShadow: '0 0 12px rgba(255,26,26,0.08)' } : {}}
            >
              <item.icon size={14} className="shrink-0" />
              <span>{item.label}</span>
              {item.href === '/' && projects.length > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-white/8 text-white/35 px-1.5 py-0.5 rounded-full">
                  {projects.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Stats */}
      {projects.length > 0 && (
        <div className="mx-3 mt-1 rounded-xl border border-white/[0.06] p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2.5">Übersicht</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-lg font-black text-white leading-none">{projects.length}</div>
              <div className="text-[9px] text-white/30 mt-0.5">Projekte</div>
            </div>
            <div>
              <div className={`text-lg font-black leading-none ${
                avgScore == null ? 'text-white/20' :
                avgScore >= 71 ? 'text-[#22aa66]' :
                avgScore >= 51 ? 'text-amber-400' : 'text-red-400'
              }`}>{avgScore ?? '–'}</div>
              <div className="text-[9px] text-white/30 mt-0.5">Ø Score</div>
            </div>
            <div>
              <div className="text-lg font-black text-red-400 leading-none">{totalHighRisks}</div>
              <div className="text-[9px] text-white/30 mt-0.5">Hohe Risiken</div>
            </div>
            <div>
              <div className="text-lg font-black text-purple-400 leading-none">
                {projects.filter(p => p.analysis.source === 'ai').length}
              </div>
              <div className="text-[9px] text-white/30 mt-0.5">KI-Analysen</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Projects */}
      {recent.length > 0 && (
        <div className="p-3 mt-2">
          <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-2 pb-1.5 flex items-center gap-2">
            <FolderOpen size={10} className="opacity-50" />
            Zuletzt
          </div>
          <div className="flex flex-col gap-0.5">
            {recent.map(p => {
              const score = p.analysis.score ?? 0;
              const active = pathname === `/project/${p.id}`;
              return (
                <Link
                  key={p.id}
                  href={`/project/${p.id}`}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg no-underline transition-all group ${
                    active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    score >= 71 ? 'bg-[#22aa66]' :
                    score >= 51 ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                  <span className="text-[11px] text-white/40 group-hover:text-white/65 transition-colors truncate">
                    {p.data.projectName || 'Unbenannt'}
                  </span>
                  <span className={`ml-auto text-[10px] font-bold shrink-0 ${
                    score >= 71 ? 'text-[#22aa66]/70' :
                    score >= 51 ? 'text-amber-400/70' : 'text-red-400/70'
                  }`}>{score}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto p-3 border-t border-white/[0.04]">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium no-underline transition-all duration-150 ${
            pathname === '/settings'
              ? 'bg-[#ff1a1a]/12 text-white border border-[#ff1a1a]/20'
              : 'text-white/45 hover:text-white/80 hover:bg-white/[0.05]'
          }`}
          style={pathname === '/settings' ? { boxShadow: '0 0 12px rgba(255,26,26,0.08)' } : {}}
        >
          <Settings size={14} className="shrink-0" />
          <span>Einstellungen</span>
        </Link>
      </div>
    </aside>
  );
}
