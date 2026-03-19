'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/components/ui/ThemeProvider';
import { LayoutDashboard, PlusCircle, Settings, FolderOpen, GitCompare, X, ClipboardList, ShieldCheck, Sun, Moon } from 'lucide-react';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const projects    = useAppStore(s => s.projects);
  const userProfile = useAppStore(s => s.userProfile);
  const isAdmin     = userProfile?.role === 'admin';
  const { theme, setTheme } = useTheme();

  const openTaskCount = projects.reduce((s, p) => s + (p.tasks ?? []).filter(t => t.status !== 'done').length, 0);

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: '/wizard', icon: PlusCircle, label: 'Neues Projekt', exact: true },
    { href: '/tasks', icon: ClipboardList, label: 'Aufgabensteuerung', exact: true },
    { href: '/compare', icon: GitCompare, label: 'Vergleich', exact: true },
  ];

  const recent = [...projects].reverse().slice(0, 5);

  const avgScore = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + (p.analysis.score ?? 0), 0) / projects.length)
    : null;

  const totalHighRisks = projects.reduce((s, p) =>
    s + p.analysis.risks.filter(r => r.severity === 'high').length, 0);

  const totalTasksDone = projects.reduce((s, p) =>
    s + (p.tasks ?? []).filter(t => t.status === 'done').length, 0);
  const totalTasks = projects.reduce((s, p) => s + (p.tasks ?? []).length, 0);

  return (
    <>
      {/* Navigation */}
      <nav className="p-3 flex flex-col gap-0.5">
        <div className="text-[9px] font-bold uppercase tracking-widest px-2 pt-3 pb-1.5 text-black/30 dark:text-white/20">
          Navigation
        </div>
        {navItems.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium no-underline transition-all duration-150 ${
                active
                  ? 'bg-[#ff1a1a]/12 dark:text-white text-gray-900 border border-[#ff1a1a]/20'
                  : 'dark:text-white/45 dark:hover:text-white/80 dark:hover:bg-white/[0.05] text-gray-600 hover:text-gray-900 hover:bg-black/[0.05]'
              }`}
              style={active ? { boxShadow: '0 0 12px rgba(255,26,26,0.08)' } : {}}
            >
              <item.icon size={14} className="shrink-0" />
              <span>{item.label}</span>
              {item.href === '/' && projects.length > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-black/5 dark:bg-white/8 text-gray-400 dark:text-white/35 px-1.5 py-0.5 rounded-full">
                  {projects.length}
                </span>
              )}
              {item.href === '/tasks' && openTaskCount > 0 && (
                <span className="ml-auto text-[9px] font-bold bg-amber-400/15 text-amber-400/80 px-1.5 py-0.5 rounded-full">
                  {openTaskCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Stats */}
      {projects.length > 0 && (
        <div
          className="mx-3 mt-1 rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-3"
          style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)' }}
        >
          <div className="text-[9px] font-bold uppercase tracking-widest mb-2.5 text-black/30 dark:text-white/20">Übersicht</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-lg font-black leading-none text-gray-800 dark:text-white">{projects.length}</div>
              <div className="text-[9px] mt-0.5 text-gray-400 dark:text-white/30">Projekte</div>
            </div>
            <div>
              <div className={`text-lg font-black leading-none ${
                avgScore == null ? 'text-gray-300 dark:text-white/20' :
                avgScore >= 71 ? 'text-[#22aa66]' :
                avgScore >= 51 ? 'text-amber-400' : 'text-red-400'
              }`}>{avgScore ?? '–'}</div>
              <div className="text-[9px] mt-0.5 text-gray-400 dark:text-white/30">Ø Score</div>
            </div>
            <div>
              <div className="text-lg font-black text-red-400 leading-none">{totalHighRisks}</div>
              <div className="text-[9px] mt-0.5 text-gray-400 dark:text-white/30">Hohe Risiken</div>
            </div>
            <div>
              <div className={`text-lg font-black leading-none ${openTaskCount > 0 ? 'text-amber-400' : 'text-[#22aa66]'}`}>
                {totalTasks > 0 ? `${totalTasksDone}/${totalTasks}` : '–'}
              </div>
              <div className="text-[9px] mt-0.5 text-gray-400 dark:text-white/30">Aufgaben</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Projects */}
      {recent.length > 0 && (
        <div className="p-3 mt-2">
          <div className="text-[9px] font-bold uppercase tracking-widest px-2 pb-1.5 flex items-center gap-2 text-black/30 dark:text-white/20">
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
                  onClick={onNavigate}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg no-underline transition-all group ${
                    active ? 'bg-black/[0.05] dark:bg-white/[0.06]' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    score >= 71 ? 'bg-[#22aa66]' :
                    score >= 51 ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                  <span className="text-[11px] text-gray-400 group-hover:text-gray-600 dark:text-white/40 dark:group-hover:text-white/65 transition-colors truncate">
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

      <div className="mt-auto p-3 border-t border-black/[0.05] dark:border-white/[0.04] flex flex-col gap-0.5">
        {/* Theme-Umschalter */}
        <div className="mb-2 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] flex">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
              theme === 'light'
                ? 'bg-white text-[#ff1a1a] shadow-sm'
                : 'text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/55'
            }`}
          >
            <Sun size={11} />
            <span>Hell</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
              theme === 'dark'
                ? 'bg-white/[0.12] text-[#ff1a1a]'
                : 'text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/55'
            }`}
          >
            <Moon size={11} />
            <span>Dunkel</span>
          </button>
        </div>

        {isAdmin && (
          <Link
            href="/admin/users"
            onClick={onNavigate}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium no-underline transition-all duration-150 ${
              pathname.startsWith('/admin')
                ? 'bg-[#ff1a1a]/12 text-gray-900 dark:text-white border border-[#ff1a1a]/20'
                : 'text-gray-500 hover:text-gray-800 hover:bg-black/[0.05] dark:text-white/45 dark:hover:text-white/80 dark:hover:bg-white/[0.05]'
            }`}
            style={pathname.startsWith('/admin') ? { boxShadow: '0 0 12px rgba(255,26,26,0.08)' } : {}}
          >
            <ShieldCheck size={14} className="shrink-0" />
            <span>Admin</span>
          </Link>
        )}
        <Link
          href="/settings"
          onClick={onNavigate}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium no-underline transition-all duration-150 ${
            pathname === '/settings'
              ? 'bg-[#ff1a1a]/12 text-gray-900 dark:text-white border border-[#ff1a1a]/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-black/[0.05] dark:text-white/45 dark:hover:text-white/80 dark:hover:bg-white/[0.05]'
          }`}
          style={pathname === '/settings' ? { boxShadow: '0 0 12px rgba(255,26,26,0.08)' } : {}}
        >
          <Settings size={14} className="shrink-0" />
          <span>Einstellungen</span>
        </Link>
      </div>
    </>
  );
}

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { theme } = useTheme();
  const sidebarBgDesktop = theme === 'dark' ? 'rgba(8,3,3,0.85)' : '#f9f9fb';
  const sidebarBgMobile  = theme === 'dark' ? 'rgba(10,3,3,0.98)' : '#ffffff';

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-52 shrink-0 border-r border-white/[0.06] dark:border-white/[0.06] overflow-y-auto"
        style={{ background: sidebarBgDesktop }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={onClose}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 md:hidden overflow-y-auto"
            style={{ background: sidebarBgMobile }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.06] shrink-0">
              <span className="text-[9px] font-bold text-black/30 dark:text-white/30 uppercase tracking-widest">Navigation</span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 dark:text-white/40 dark:hover:text-white bg-transparent border-none cursor-pointer p-1 rounded transition-colors"
                aria-label="Menü schließen"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent onNavigate={onClose} />
          </aside>
        </>
      )}
    </>
  );
}
