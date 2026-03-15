'use client';
import { useState } from 'react';
import { Project, Task, Wave, TaskStatus } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { CheckCircle2, Circle, Clock, Plus, Trash2, ChevronDown, ChevronRight, StickyNote, Link2, ExternalLink, X } from 'lucide-react';

const STATUS_CONFIG: Record<TaskStatus, { icon: typeof Circle; color: string; label: string; next: TaskStatus }> = {
  open:        { icon: Circle,       color: 'text-white/30',   label: 'Offen',         next: 'in-progress' },
  'in-progress':{ icon: Clock,       color: 'text-amber-400',  label: 'In Arbeit',     next: 'done' },
  done:        { icon: CheckCircle2, color: 'text-[#22aa66]',  label: 'Erledigt',      next: 'open' },
};

export function TaskTracker({ project }: { project: Project }) {
  const addTask = useAppStore(s => s.addTask);
  const updateTaskStatus = useAppStore(s => s.updateTaskStatus);
  const updateTaskNote = useAppStore(s => s.updateTaskNote);
  const deleteTask = useAppStore(s => s.deleteTask);
  const setTaskJiraIssue = useAppStore(s => s.setTaskJiraIssue);
  const jiraConfigs = useAppStore(s => s.jiraConfigs);

  const tasks = project.tasks || [];
  const [expandedWaves, setExpandedWaves] = useState<Set<number>>(new Set([1]));
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [jiraLoading, setJiraLoading] = useState<Set<string>>(new Set());
  const [jiraError, setJiraError] = useState<Record<string, string>>({});
  const [jiraConfigSelecting, setJiraConfigSelecting] = useState<string | null>(null);
  const [selectedConfigIds, setSelectedConfigIds] = useState<Record<string, string>>({})

  const toggleWave = (n: number) => {
    setExpandedWaves(prev => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  };

  const addAllFromWave = (wave: Wave) => {
    wave.items.forEach(item => {
      if (!tasks.find(t => t.item === item && t.waveNumber === wave.number)) {
        addTask(project.id, wave.number, wave.title, item);
      }
    });
  };

  const progress = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const done = tasks.filter(t => t.status === 'done').length;

  const pushToJira = async (task: Task, configId: string) => {
    const cfg = jiraConfigs.find(c => c.id === configId);
    if (!cfg) return;
    setJiraLoading(prev => new Set(prev).add(task.id));
    setJiraError(prev => ({ ...prev, [task.id]: '' }));
    try {
      const res = await fetch('/api/jira/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: cfg,
          task: { item: task.item, waveNumber: task.waveNumber, waveTitle: task.waveTitle },
          projectName: project.data.projectName,
        }),
      });
      const data = await res.json() as Record<string, string>;
      if (res.ok) {
        setTaskJiraIssue(project.id, task.id, data.issueKey, data.issueUrl, cfg.id);
      } else {
        setJiraError(prev => ({ ...prev, [task.id]: data.error || 'Jira-Fehler' }));
      }
    } catch {
      setJiraError(prev => ({ ...prev, [task.id]: 'Netzwerkfehler' }));
    }
    setJiraLoading(prev => { const next = new Set(prev); next.delete(task.id); return next; });
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      {tasks.length > 0 && (
        <div className="rounded-xl border border-white/[0.07] p-4" style={{ background: 'rgba(22,10,10,0.6)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/60">Gesamtfortschritt</span>
            <span className="text-xs font-bold text-white">{progress}% · {done}/{tasks.length} erledigt</span>
          </div>
          <div className="h-2 bg-white/[0.07] rounded-full overflow-hidden">
            <div className="h-full bg-[#22aa66] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
          <div className="flex gap-4 mt-2.5">
            {[
              { label: 'Offen', value: tasks.filter(t => t.status === 'open').length, color: 'text-white/40' },
              { label: 'In Arbeit', value: inProgress, color: 'text-amber-400' },
              { label: 'Erledigt', value: done, color: 'text-[#22aa66]' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-lg font-black leading-none ${s.color}`}>{s.value}</div>
                <div className="text-[9px] text-white/25 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waves */}
      {project.analysis.waves.map(wave => {
        const waveTasks = tasks.filter(t => t.waveNumber === wave.number);
        const waveDone = waveTasks.filter(t => t.status === 'done').length;
        const isExpanded = expandedWaves.has(wave.number);

        return (
          <div key={wave.number} className="rounded-xl border border-white/[0.07] overflow-hidden">
            {/* Wave Header */}
            <div
              className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
              style={{ background: 'rgba(22,10,10,0.7)' }}
              onClick={() => toggleWave(wave.number)}
            >
              <div className="flex items-center gap-2.5">
                {isExpanded ? <ChevronDown size={14} className="text-white/30" /> : <ChevronRight size={14} className="text-white/30" />}
                <span className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">Welle {wave.number}</span>
                <span className="text-white font-bold text-sm">{wave.title}</span>
                <span className="text-white/30 text-[10px] bg-white/5 px-1.5 py-0.5 rounded">{wave.duration}</span>
              </div>
              <div className="flex items-center gap-3">
                {waveTasks.length > 0 && (
                  <span className="text-[10px] text-white/40">{waveDone}/{waveTasks.length}</span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); addAllFromWave(wave); }}
                  className="text-[10px] text-blue-400/60 hover:text-blue-400 flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors"
                >
                  <Plus size={10} /> Alle hinzufügen
                </button>
              </div>
            </div>

            {/* Wave Items */}
            {isExpanded && (
              <div className="divide-y divide-white/[0.04]" style={{ background: 'rgba(14,6,6,0.5)' }}>
                {wave.items.map((item, j) => {
                  const task = waveTasks.find(t => t.item === item);
                  const cfg = task ? STATUS_CONFIG[task.status] : null;
                  const Icon = cfg?.icon;

                  return (
                    <div key={j} className="px-4 py-2 flex items-start gap-3 group hover:bg-white/[0.02] transition-colors">
                      {/* Status Toggle */}
                      {task && Icon ? (
                        <button
                          onClick={() => updateTaskStatus(project.id, task.id, cfg!.next)}
                          className={`mt-0.5 border-none bg-transparent cursor-pointer shrink-0 ${cfg!.color} hover:opacity-80 transition-opacity`}
                        >
                          <Icon size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => addTask(project.id, wave.number, wave.title, item)}
                          className="mt-0.5 border-none bg-transparent cursor-pointer shrink-0 text-white/15 hover:text-blue-400 transition-colors"
                        >
                          <Plus size={15} />
                        </button>
                      )}

                      {/* Item Text */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs leading-snug ${task?.status === 'done' ? 'line-through text-white/30' : 'text-white/70'}`}>
                          {item}
                        </div>
                        {/* Note */}
                        {task && editingNote === task.id ? (
                          <div className="mt-1.5 flex gap-1.5">
                            <input
                              autoFocus
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') { updateTaskNote(project.id, task.id, noteText); setEditingNote(null); }
                                if (e.key === 'Escape') setEditingNote(null);
                              }}
                              placeholder="Notiz... (Enter zum Speichern)"
                              className="flex-1 text-[11px] rounded px-2 py-1"
                              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                          </div>
                        ) : task?.note ? (
                          <div
                            onClick={() => { setEditingNote(task.id); setNoteText(task.note || ''); }}
                            className="mt-0.5 text-[10px] text-amber-400/60 cursor-pointer hover:text-amber-400/80 transition-colors"
                          >
                            📝 {task.note}
                          </div>
                        ) : null}
                        {/* Jira error */}
                        {task && jiraError[task.id] && (
                          <div className="mt-0.5 text-[10px] text-red-400/70 flex items-center gap-1">
                            ⚠ {jiraError[task.id]}
                          </div>
                        )}
                      </div>

                      {/* Jira badge – always visible when linked */}
                      {task?.jiraIssueKey && (
                        <a
                          href={task.jiraIssueUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-[#2684FF] hover:text-blue-300 text-[9px] font-bold flex items-center gap-0.5 transition-colors rounded px-1.5 py-0.5"
                          style={{ border: '1px solid rgba(38,132,255,0.3)', background: 'rgba(38,132,255,0.08)' }}
                          title={task.jiraIssueUrl}
                        >
                          {task.jiraIssueKey}
                          <ExternalLink size={7} />
                        </a>
                      )}

                      {/* Actions */}
                      {task && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => { setEditingNote(task.id); setNoteText(task.note || ''); }}
                            className="text-white/20 hover:text-amber-400 border-none bg-transparent cursor-pointer transition-colors p-0.5"
                          >
                            <StickyNote size={11} />
                          </button>

                          {/* Jira push button */}
                          {jiraConfigs.length > 0 && !task.jiraIssueKey && (
                            jiraConfigSelecting === task.id && jiraConfigs.length > 1 ? (
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <select
                                  value={selectedConfigIds[task.id] || jiraConfigs[0].id}
                                  onChange={e => setSelectedConfigIds(prev => ({ ...prev, [task.id]: e.target.value }))}
                                  className="text-[9px] rounded px-1 py-0.5"
                                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', outline: 'none' }}
                                >
                                  {jiraConfigs.map(c => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => { pushToJira(task, selectedConfigIds[task.id] || jiraConfigs[0].id); setJiraConfigSelecting(null); }}
                                  className="text-[#2684FF] hover:text-blue-300 border-none bg-transparent cursor-pointer transition-colors text-[9px] font-bold p-0.5"
                                >OK</button>
                                <button
                                  onClick={() => setJiraConfigSelecting(null)}
                                  className="text-white/20 hover:text-white/50 border-none bg-transparent cursor-pointer p-0.5"
                                ><X size={9} /></button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  if (jiraConfigs.length === 1) {
                                    pushToJira(task, jiraConfigs[0].id);
                                  } else {
                                    setJiraConfigSelecting(task.id);
                                  }
                                }}
                                title={jiraConfigs.length === 1 ? `Nach Jira pushen (${jiraConfigs[0].label})` : 'Jira-Instanz wählen'}
                                disabled={jiraLoading.has(task.id)}
                                className={`border-none bg-transparent cursor-pointer transition-colors p-0.5 ${
                                  jiraLoading.has(task.id) ? 'text-white/20 cursor-wait' : 'text-white/20 hover:text-[#2684FF]'
                                }`}
                              >
                                {jiraLoading.has(task.id)
                                  ? <span className="text-[9px] leading-none">…</span>
                                  : <Link2 size={11} />}
                              </button>
                            )
                          )}

                          <button
                            onClick={() => deleteTask(project.id, task.id)}
                            className="text-white/20 hover:text-red-400 border-none bg-transparent cursor-pointer transition-colors p-0.5"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="text-center py-10 text-white/25 text-sm">
          <div className="text-3xl mb-2">✅</div>
          Klicke auf <strong className="text-white/40">+ Alle hinzufügen</strong> bei einer Welle um Aufgaben zu erstellen.
        </div>
      )}
    </div>
  );
}
