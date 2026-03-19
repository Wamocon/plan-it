import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '@/stores/appStore';
import type { AnalysisResult, WizardData, Task, TaskStatus } from '@/types';

vi.mock('@/lib/appwrite/db', () => ({
  dbAddProject: vi.fn(), dbUpdateAnalysis: vi.fn(), dbSetAiPending: vi.fn(),
  dbSetAiFailReason: vi.fn(), dbDeleteProject: vi.fn(),
  dbAddTask: vi.fn(), dbUpdateTask: vi.fn(), dbDeleteTask: vi.fn(),
  dbAddChatMessage: vi.fn(), dbClearChat: vi.fn(), dbTakeSnapshot: vi.fn(),
  dbAddJiraConfig: vi.fn(), dbUpdateJiraConfig: vi.fn(), dbDeleteJiraConfig: vi.fn(),
  dbAddAiConfig: vi.fn(), dbUpdateAiConfig: vi.fn(), dbDeleteAiConfig: vi.fn(),
  dbSetActiveAiConfig: vi.fn(),
}));

// â”€â”€ Date.now-Mock: gibt bei jedem Aufruf einen inkrementellen Wert zurÃ¼ck â”€â”€â”€â”€â”€â”€
let nowCounter = 1_000_000_000_000;
vi.spyOn(Date, 'now').mockImplementation(() => nowCounter++);

// â”€â”€ Hilfsfaktories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const makeAnalysis = (score = 60): AnalysisResult => ({
  risks: [],
  soll: [],
  waves: [
    { number: 1, title: 'Foundation', duration: '2W', items: ['CI/CD aufsetzen', 'Tests schreiben'] },
    { number: 2, title: 'Security',   duration: '1W', items: ['Auth hÃ¤rtens'] },
  ],
  summary: 'OK',
  source: 'fallback',
  score,
  scoreLabel: 'Mittel',
});

const makeData = (name: string): WizardData => ({ projectName: name });

// â”€â”€ Aggregierungslogik (1:1 wie in der Page-Komponente) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildAllTasks(projects: ReturnType<typeof useAppStore.getState>['projects']) {
  return projects.flatMap(p =>
    (p.tasks ?? []).map(t => ({ ...t, projectId: p.id, projectName: (p.data.projectName as string) || 'Unbenannt' }))
  );
}

function calcStats(allTasks: Task[]) {
  return {
    total:      allTasks.length,
    open:       allTasks.filter(t => t.status === 'open').length,
    inProgress: allTasks.filter(t => t.status === 'in-progress').length,
    done:       allTasks.filter(t => t.status === 'done').length,
    progress:   allTasks.length > 0
      ? Math.round(allTasks.filter(t => t.status === 'done').length / allTasks.length * 100)
      : 0,
  };
}

function filterTasks(allTasks: ReturnType<typeof buildAllTasks>, status: TaskStatus | 'all', search: string) {
  return allTasks
    .filter(t => status === 'all' || t.status === status)
    .filter(t => !search
      || t.item.toLowerCase().includes(search.toLowerCase())
      || t.projectName.toLowerCase().includes(search.toLowerCase())
    );
}

function cycleStatus(current: TaskStatus): TaskStatus {
  if (current === 'open') return 'in-progress';
  if (current === 'in-progress') return 'done';
  return 'open';
}

// Hilfsfunktion: Task hinzufÃ¼gen und sofort die ID zurÃ¼ckgeben
function addTaskAndGetId(projectId: string, waveNum: number, waveTitle: string, item: string): string {
  useAppStore.getState().addTask(projectId, waveNum, waveTitle, item);
  const tasks = useAppStore.getState().getProject(projectId)!.tasks!;
  return tasks[tasks.length - 1].id;
}

// â”€â”€ Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
beforeEach(() => {
  useAppStore.setState({ projects: [], jiraConfigs: [], aiConfigs: [] });
});

describe('Task-Aggregierung Ã¼ber Projekte', () => {
  it('gibt leere Liste zurÃ¼ck wenn keine Projekte', () => {
    const tasks = buildAllTasks([]);
    expect(tasks).toHaveLength(0);
  });

  it('aggregiert Tasks aus mehreren Projekten', () => {
    const p1 = useAppStore.getState().addProject(makeData('Projekt A'), makeAnalysis());
    const p2 = useAppStore.getState().addProject(makeData('Projekt B'), makeAnalysis());
    addTaskAndGetId(p1.id, 1, 'Foundation', 'Task A1');
    addTaskAndGetId(p1.id, 1, 'Foundation', 'Task A2');
    addTaskAndGetId(p2.id, 1, 'Foundation', 'Task B1');

    const projects = useAppStore.getState().projects;
    const tasks = buildAllTasks(projects);
    expect(tasks).toHaveLength(3);
  });

  it('enthÃ¤lt projectId und projectName im flachen Task', () => {
    const p = useAppStore.getState().addProject(makeData('Mein Projekt'), makeAnalysis());
    addTaskAndGetId(p.id, 1, 'Foundation', 'Irgendwas');

    const tasks = buildAllTasks(useAppStore.getState().projects);
    expect(tasks[0].projectId).toBe(p.id);
    expect(tasks[0].projectName).toBe('Mein Projekt');
  });

  it('verwendet "Unbenannt" wenn kein Projektname gesetzt', () => {
    const p = useAppStore.getState().addProject({}, makeAnalysis());
    addTaskAndGetId(p.id, 1, 'Foundation', 'Task');

    const tasks = buildAllTasks(useAppStore.getState().projects);
    expect(tasks[0].projectName).toBe('Unbenannt');
  });
});

describe('Statistik-Berechnung', () => {
  it('gibt Nullwerte bei leerer Taskliste zurÃ¼ck', () => {
    const stats = calcStats([]);
    expect(stats.total).toBe(0);
    expect(stats.open).toBe(0);
    expect(stats.inProgress).toBe(0);
    expect(stats.done).toBe(0);
    expect(stats.progress).toBe(0);
  });

  it('berechnet Fortschritt korrekt (2 von 3 erledigt â†’ 67%)', () => {
    const p = useAppStore.getState().addProject(makeData('X'), makeAnalysis());
    const t1Id = addTaskAndGetId(p.id, 1, 'F', 'T1');
    const t2Id = addTaskAndGetId(p.id, 1, 'F', 'T2');
    addTaskAndGetId(p.id, 1, 'F', 'T3'); // bleibt offen
    useAppStore.getState().updateTaskStatus(p.id, t1Id, 'done');
    useAppStore.getState().updateTaskStatus(p.id, t2Id, 'done');

    const tasks = buildAllTasks(useAppStore.getState().projects);
    const stats = calcStats(tasks);
    expect(stats.done).toBe(2);
    expect(stats.open).toBe(1);
    expect(stats.progress).toBe(67);
  });

  it('berechnet in-progress korrekt', () => {
    const p = useAppStore.getState().addProject(makeData('X'), makeAnalysis());
    const t1Id = addTaskAndGetId(p.id, 1, 'F', 'T1');
    useAppStore.getState().updateTaskStatus(p.id, t1Id, 'in-progress');

    const tasks = buildAllTasks(useAppStore.getState().projects);
    const stats = calcStats(tasks);
    expect(stats.inProgress).toBe(1);
    expect(stats.open).toBe(0);
    expect(stats.done).toBe(0);
    expect(stats.progress).toBe(0);
  });
});

describe('Filterung nach Status', () => {
  it('filter "all" gibt alle Tasks zurÃ¼ck', () => {
    const p = useAppStore.getState().addProject(makeData('X'), makeAnalysis());
    const t1Id = addTaskAndGetId(p.id, 1, 'F', 'T1');
    addTaskAndGetId(p.id, 1, 'F', 'T2');
    useAppStore.getState().updateTaskStatus(p.id, t1Id, 'done');

    const tasks = buildAllTasks(useAppStore.getState().projects);
    expect(filterTasks(tasks, 'all', '')).toHaveLength(2);
  });

  it('filter "open" gibt nur offene Tasks zurÃ¼ck', () => {
    const p = useAppStore.getState().addProject(makeData('X'), makeAnalysis());
    const t1Id = addTaskAndGetId(p.id, 1, 'F', 'T1');
    addTaskAndGetId(p.id, 1, 'F', 'T2');
    useAppStore.getState().updateTaskStatus(p.id, t1Id, 'done');

    const tasks = buildAllTasks(useAppStore.getState().projects);
    expect(filterTasks(tasks, 'open', '')).toHaveLength(1);
    expect(filterTasks(tasks, 'open', '')[0].item).toBe('T2');
  });

  it('filter "done" gibt nur erledigte Tasks zurÃ¼ck', () => {
    const p = useAppStore.getState().addProject(makeData('X'), makeAnalysis());
    const t1Id = addTaskAndGetId(p.id, 1, 'F', 'T1');
    const t2Id = addTaskAndGetId(p.id, 1, 'F', 'T2');
    useAppStore.getState().updateTaskStatus(p.id, t1Id, 'done');
    useAppStore.getState().updateTaskStatus(p.id, t2Id, 'done');

    const tasks = buildAllTasks(useAppStore.getState().projects);
    expect(filterTasks(tasks, 'done', '')).toHaveLength(2);
    expect(filterTasks(tasks, 'open', '')).toHaveLength(0);
  });

  it('filter "in-progress" gibt nur Tasks in Arbeit zurÃ¼ck', () => {
    const p = useAppStore.getState().addProject(makeData('X'), makeAnalysis());
    const t1Id = addTaskAndGetId(p.id, 1, 'F', 'T1');
    addTaskAndGetId(p.id, 1, 'F', 'T2');
    useAppStore.getState().updateTaskStatus(p.id, t1Id, 'in-progress');

    const tasks = buildAllTasks(useAppStore.getState().projects);
    expect(filterTasks(tasks, 'in-progress', '')).toHaveLength(1);
  });
});

describe('Suchtextfilter', () => {
  it('findet Tasks anhand der Aufgaben-Beschreibung (case-insensitive)', () => {
    const p = useAppStore.getState().addProject(makeData('ProjektX'), makeAnalysis());
    addTaskAndGetId(p.id, 1, 'Foundation', 'CI/CD aufsetzen');
    addTaskAndGetId(p.id, 1, 'Foundation', 'Dokumentation verfassen');

    const tasks = buildAllTasks(useAppStore.getState().projects);
    expect(filterTasks(tasks, 'all', 'ci/cd')).toHaveLength(1);
    expect(filterTasks(tasks, 'all', 'DOKU')).toHaveLength(1);
  });

  it('findet Tasks anhand des Projektnamens', () => {
    const p1 = useAppStore.getState().addProject(makeData('AlphaProjekt'), makeAnalysis());
    const p2 = useAppStore.getState().addProject(makeData('BetaProjekt'), makeAnalysis());
    addTaskAndGetId(p1.id, 1, 'F', 'Aufgabe eins');
    addTaskAndGetId(p2.id, 1, 'F', 'Aufgabe zwei');

    const tasks = buildAllTasks(useAppStore.getState().projects);
    expect(filterTasks(tasks, 'all', 'alphaprojekt')).toHaveLength(1);
    expect(filterTasks(tasks, 'all', 'betaprojekt')).toHaveLength(1);
    expect(filterTasks(tasks, 'all', 'xyz')).toHaveLength(0);
  });

  it('gibt leere Liste zurÃ¼ck wenn kein Treffer', () => {
    const p = useAppStore.getState().addProject(makeData('X'), makeAnalysis());
    addTaskAndGetId(p.id, 1, 'F', 'Irgendwas');

    const tasks = buildAllTasks(useAppStore.getState().projects);
    expect(filterTasks(tasks, 'all', 'XXXNICHTVORHANDEN')).toHaveLength(0);
  });

  it('kombiniert Status-Filter und Suchtext', () => {
    const p = useAppStore.getState().addProject(makeData('TestProjekt'), makeAnalysis());
    const t1Id = addTaskAndGetId(p.id, 1, 'F', 'Security-Check');
    addTaskAndGetId(p.id, 1, 'F', 'Security-Audit');
    useAppStore.getState().updateTaskStatus(p.id, t1Id, 'done');

    const tasks = buildAllTasks(useAppStore.getState().projects);
    // Nur offene Security-Tasks
    const result = filterTasks(tasks, 'open', 'security');
    expect(result).toHaveLength(1);
    expect(result[0].item).toBe('Security-Audit');
  });
});

describe('Status-Zyklus-Logik', () => {
  it('open â†’ in-progress', () => {
    expect(cycleStatus('open')).toBe('in-progress');
  });

  it('in-progress â†’ done', () => {
    expect(cycleStatus('in-progress')).toBe('done');
  });

  it('done â†’ open (ZurÃ¼cksetzen)', () => {
    expect(cycleStatus('done')).toBe('open');
  });

  it('vollstÃ¤ndiger Zyklus: open â†’ in-progress â†’ done â†’ open', () => {
    let status: TaskStatus = 'open';
    status = cycleStatus(status); expect(status).toBe('in-progress');
    status = cycleStatus(status); expect(status).toBe('done');
    status = cycleStatus(status); expect(status).toBe('open');
  });
});

describe('Offene Aufgaben fÃ¼r Sidebar-Badge', () => {
  it('zÃ¤hlt alle nicht-erledigten Tasks projektÃ¼bergreifend', () => {
    const p1 = useAppStore.getState().addProject(makeData('A'), makeAnalysis());
    const p2 = useAppStore.getState().addProject(makeData('B'), makeAnalysis());
    const t1Id = addTaskAndGetId(p1.id, 1, 'F', 'T1');
    addTaskAndGetId(p1.id, 1, 'F', 'T2'); // bleibt offen
    addTaskAndGetId(p2.id, 1, 'F', 'T3'); // bleibt offen
    useAppStore.getState().updateTaskStatus(p1.id, t1Id, 'done');

    const projects = useAppStore.getState().projects;
    const openCount = projects.reduce(
      (s, p) => s + (p.tasks ?? []).filter(t => t.status !== 'done').length, 0
    );
    expect(openCount).toBe(2); // T2 (open) + T3 (open)
  });

  it('gibt 0 zurÃ¼ck wenn alle Tasks erledigt', () => {
    const p = useAppStore.getState().addProject(makeData('X'), makeAnalysis());
    const t1Id = addTaskAndGetId(p.id, 1, 'F', 'T1');
    useAppStore.getState().updateTaskStatus(p.id, t1Id, 'done');

    const projects = useAppStore.getState().projects;
    const openCount = projects.reduce(
      (s, p) => s + (p.tasks ?? []).filter(t => t.status !== 'done').length, 0
    );
    expect(openCount).toBe(0);
  });
});

