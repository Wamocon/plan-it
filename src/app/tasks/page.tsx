'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/stores/appStore';
import { TaskStatus, Task, Project } from '@/types';
import {
  CheckCircle2, Circle, Clock, ChevronDown, ChevronRight,
  ArrowLeft, FolderOpen, Filter, Search, StickyNote,
  ExternalLink, Trash2, BarChart3, Building2,
} from 'lucide-react';

// ── Typen ────────────────────────────────────────────────────────────────────
type GroupBy = 'project' | 'status' | 'wave';
type FilterStatus = 'all' | TaskStatus;

interface FlatTask extends Task {
  projectId: string;
  projectName: string;
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TaskStatus, { icon: typeof Circle; color: string; bg: string; label: string }> = {
  open:          { icon: Circle,       color: 'text-white/35',  bg: 'bg-white/5',      label: 'Offen' },
  'in-progress': { icon: Clock,        color: 'text-amber-400', bg: 'bg-amber-400/8',  label: 'In Arbeit' },
  done:          { icon: CheckCircle2, color: 'text-[#22aa66]', bg: 'bg-[#22aa66]/8',  label: 'Erledigt' },
};

function statusOrder(s: TaskStatus) { return s === 'open' ? 0 : s === 'in-progress' ? 1 : 2; }

// ── Haupt-Komponente ──────────────────────────────────────────────────────────
export default function TasksPage() {
  const projects        = useAppStore(s => s.projects);
  const organizations   = useAppStore(s => s.organizations);
  const loadOrganizations = useAppStore(s => s.loadOrganizations);
  const updateTaskStatus = useAppStore(s => s.updateTaskStatus);
  const deleteTask       = useAppStore(s => s.deleteTask);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [groupBy,      setGroupBy]      = useState<GroupBy>('project');
  const [search,       setSearch]       = useState('');
  const [collapsed,    setCollapsed]    = useState<Set<string>>(new Set());
  const [filterOrgId,  setFilterOrgId]  = useState<string | null>(null);

  useEffect(() => { loadOrganizations(); }, [loadOrganizations]);

  // Projekte nach Org filtern
  const visibleProjects = filterOrgId
    ? projects.filter(p => p.orgId === filterOrgId)
    : projects;

  // Alle Tasks aus allen Projekten flach zusammenführen
  const allTasks = useMemo<FlatTask[]>(() => {
    return visibleProjects.flatMap(p =>
      (p.tasks ?? []).map(t => ({
        ...t,
        projectId: p.id,
        projectName: p.data.projectName as string || 'Unbenannt',
      }))
    );
  }, [visibleProjects]);

  // Filter + Suche
  const filtered = useMemo(() => {
    return allTasks
      .filter(t => filterStatus === 'all' || t.status === filterStatus)
      .filter(t => !search || t.item.toLowerCase().includes(search.toLowerCase()) ||
                   t.projectName.toLowerCase().includes(search.toLowerCase()) ||
                   t.waveTitle.toLowerCase().includes(search.toLowerCase()));
  }, [allTasks, filterStatus, search]);

  // Statistiken (immer auf allen Tasks, nicht nur gefilterten)
  const stats = useMemo(() => ({
    total:      allTasks.length,
    open:       allTasks.filter(t => t.status === 'open').length,
    inProgress: allTasks.filter(t => t.status === 'in-progress').length,
    done:       allTasks.filter(t => t.status === 'done').length,
    progress:   allTasks.length > 0
      ? Math.round(allTasks.filter(t => t.status === 'done').length / allTasks.length * 100)
      : 0,
  }), [allTasks]);

  // Beschreibungstext für Header
  const orgName = filterOrgId ? organizations.find(o => o.id === filterOrgId)?.name : null;

  // Gruppierung
  const groups = useMemo<{ key: string; label: string; tasks: FlatTask[] }[]>(() => {
    if (groupBy === 'status') {
      return (['open', 'in-progress', 'done'] as TaskStatus[]).map(s => ({
        key: s,
        label: STATUS_CONFIG[s].label,
        tasks: filtered.filter(t => t.status === s),
      })).filter(g => g.tasks.length > 0);
    }
    if (groupBy === 'wave') {
      const map = new Map<string, FlatTask[]>();
      filtered.forEach(t => {
        const k = `Wave ${t.waveNumber}: ${t.waveTitle}`;
        map.set(k, [...(map.get(k) ?? []), t]);
      });
      return [...map.entries()]
        .sort((a, b) => {
          const na = parseInt(a[0].match(/\d+/)?.[0] ?? '0');
          const nb = parseInt(b[0].match(/\d+/)?.[0] ?? '0');
          return na - nb;
        })
        .map(([key, tasks]) => ({ key, label: key, tasks }));
    }
    // default: project
    const map = new Map<string, { label: string; tasks: FlatTask[] }>();
    filtered.forEach(t => {
      if (!map.has(t.projectId)) map.set(t.projectId, { label: t.projectName, tasks: [] });
      map.get(t.projectId)!.tasks.push(t);
    });
    return [...map.entries()].map(([key, { label, tasks }]) => ({
      key, label,
      tasks: [...tasks].sort((a, b) => statusOrder(a.status) - statusOrder(b.status)),
    }));
  }, [filtered, groupBy]);

  const toggleCollapse = (key: string) =>
    setCollapsed(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });

  const cycleStatus = (projectId: string, taskId: string, current: TaskStatus) => {
    const next: TaskStatus = current === 'open' ? 'in-progress' : current === 'in-progress' ? 'done' : 'open';
    updateTaskStatus(projectId, taskId, next);
  };

  if (allTasks.length === 0) {
    return (
      <div className="px-6 py-12 max-w-lg">
        <Link href="/" className="inline-flex items-center gap-1.5 text-white/40 text-xs mb-6 no-underline hover:text-white/70">
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-white font-bold text-lg mb-1">Noch keine Aufgaben</h3>
          <p className="text-white/35 text-sm">Erstelle zunächst ein Projekt und führe eine Analyse durch,<br />dann werden hier die Maßnahmen angezeigt.</p>
          <Link href="/wizard" className="inline-block mt-4 bg-[#ff1a1a] text-white px-5 py-2 rounded-lg text-sm font-medium no-underline hover:opacity-90 transition-opacity">
            Neues Projekt anlegen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-white/40 text-xs mb-4 no-underline hover:text-white/70">
        <ArrowLeft size={12} /> Dashboard
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Steuerung</p>
          <h2 className="text-2xl font-black text-white leading-tight">Aufgabensteuerung</h2>
          <p className="text-white/35 text-sm mt-0.5">
            {stats.total} Aufgabe{stats.total !== 1 ? 'n' : ''} aus {visibleProjects.length} Projekt{visibleProjects.length !== 1 ? 'en' : ''}
            {orgName && <span className="text-blue-300/70"> · 🏢 {orgName}</span>}
          </p>
        </div>
        <BarChart3 size={28} className="text-white/10 shrink-0 mt-1" />
      </div>

      {/* Org-Filter */}
      {organizations.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
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
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                filterOrgId === org.id
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                  : 'bg-transparent text-white/40 border-white/10 hover:border-blue-500/30 hover:text-blue-300/70'
              }`}>
              <Building2 size={11} />
              {org.name}
              <span className="text-[10px] opacity-60">
                {projects.filter(p => p.orgId === org.id).reduce((s, p) => s + (p.tasks ?? []).length, 0)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Stats-Karten */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Gesamt',    value: stats.total,      color: 'text-white' },
          { label: 'Offen',     value: stats.open,       color: 'text-white/50' },
          { label: 'In Arbeit', value: stats.inProgress, color: 'text-amber-400' },
          { label: 'Erledigt',  value: stats.done,       color: 'text-[#22aa66]' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] p-4" style={{ background: 'rgba(22,10,10,0.7)' }}>
            <div className={`text-2xl font-black leading-none ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-white/30 mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Fortschrittsbalken */}
      <div className="mb-6">
        <div className="flex justify-between text-[10px] text-white/35 mb-1.5">
          <span>Gesamtfortschritt</span>
          <span>{stats.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#22aa66] transition-all duration-500"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Suche */}
        <div className="relative flex-1 min-w-[160px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            placeholder="Suchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-sm rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 outline-none focus:border-[#ff1a1a]/40"
          />
        </div>

        {/* Status-Filter */}
        <div className="flex gap-1">
          {(['all', 'open', 'in-progress', 'done'] as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-2.5 py-1.5 text-xs rounded-lg transition-colors"
              style={filterStatus === s
                ? { background: 'rgba(255,26,26,0.15)', color: '#ff6060', border: '1px solid rgba(255,26,26,0.25)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {s === 'all' ? 'Alle' : STATUS_CONFIG[s as TaskStatus].label}
            </button>
          ))}
        </div>

        {/* Gruppierung */}
        <div className="flex gap-1">
          <Filter size={12} className="self-center text-white/25 mr-1" />
          {(['project', 'wave', 'status'] as GroupBy[]).map(g => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className="px-2.5 py-1.5 text-xs rounded-lg transition-colors"
              style={groupBy === g
                ? { background: 'rgba(255,26,26,0.12)', color: '#ff6060', border: '1px solid rgba(255,26,26,0.22)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {g === 'project' ? 'Projekt' : g === 'wave' ? 'Wave' : 'Status'}
            </button>
          ))}
        </div>
      </div>

      {/* Ergebniszahl */}
      {filtered.length !== allTasks.length && (
        <p className="text-xs text-white/30 mb-3">{filtered.length} von {allTasks.length} Aufgaben</p>
      )}

      {/* Gruppe-Liste */}
      <div className="flex flex-col gap-3">
        {groups.map(group => {
          const isOpen = !collapsed.has(group.key);
          const doneCount = group.tasks.filter(t => t.status === 'done').length;
          return (
            <div key={group.key} className="rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(18,6,6,0.6)' }}>
              {/* Gruppen-Header */}
              <button
                onClick={() => toggleCollapse(group.key)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
              >
                {isOpen ? <ChevronDown size={13} className="text-white/30 shrink-0" /> : <ChevronRight size={13} className="text-white/30 shrink-0" />}
                {groupBy === 'project' && <FolderOpen size={13} className="text-white/30 shrink-0" />}
                <span className="text-sm font-semibold text-white/80 truncate">{group.label}</span>
                <span className="ml-auto text-[10px] text-white/30 shrink-0">
                  {doneCount}/{group.tasks.length}
                </span>
                {/* Mini-Fortschrittsbalken */}
                <div className="w-16 h-1 rounded-full bg-white/[0.08] overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full bg-[#22aa66]"
                    style={{ width: group.tasks.length > 0 ? `${(doneCount / group.tasks.length) * 100}%` : '0%' }}
                  />
                </div>
              </button>

              {/* Aufgaben-Rows */}
              {isOpen && (
                <div className="border-t border-white/[0.05]">
                  {group.tasks.map(task => {
                    const cfg = STATUS_CONFIG[task.status];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Status-Toggle */}
                        <button
                          onClick={() => cycleStatus(task.projectId, task.id, task.status)}
                          className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                          title={`Status: ${cfg.label} → klicken zum Wechseln`}
                        >
                          <Icon size={16} className={cfg.color} />
                        </button>

                        {/* Aufgaben-Text */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${task.status === 'done' ? 'line-through text-white/30' : 'text-white/80'}`}>
                            {task.item}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            {groupBy !== 'project' && (
                              <Link
                                href={`/project/${task.projectId}`}
                                className="text-[10px] text-white/30 hover:text-white/55 no-underline inline-flex items-center gap-1"
                              >
                                <FolderOpen size={9} /> {task.projectName}
                              </Link>
                            )}
                            {groupBy !== 'wave' && (
                              <span className="text-[10px] text-white/25">Wave {task.waveNumber}: {task.waveTitle}</span>
                            )}
                            {groupBy !== 'status' && (
                              <span className={`text-[10px] ${cfg.color} inline-flex items-center gap-1`}>
                                <Icon size={9} /> {cfg.label}
                              </span>
                            )}
                            {task.note && (
                              <span className="text-[10px] text-amber-400/60 inline-flex items-center gap-1">
                                <StickyNote size={9} /> Notiz
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rechte Aktionen */}
                        <div className="flex items-center gap-2 shrink-0">
                          {task.jiraIssueKey && (
                            <a
                              href={task.jiraIssueUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-400/60 hover:text-blue-400 inline-flex items-center gap-1 no-underline"
                              title="Jira-Ticket öffnen"
                            >
                              <ExternalLink size={11} />
                              {task.jiraIssueKey}
                            </a>
                          )}
                          <Link
                            href={`/project/${task.projectId}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/60 no-underline"
                            title="Zum Projekt"
                          >
                            <ArrowLeft size={12} className="rotate-180" />
                          </Link>
                          <button
                            onClick={() => deleteTask(task.projectId, task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/25 hover:text-red-400"
                            title="Aufgabe löschen"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="text-center py-10 text-white/30 text-sm">
            Keine Aufgaben gefunden
          </div>
        )}
      </div>
    </div>
  );
}
