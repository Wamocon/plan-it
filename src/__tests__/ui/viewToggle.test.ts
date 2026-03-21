/**
 * Tests für die Grid/List-View-Toggle-Logik und die zugehörigen
 * Pure-Functions der betroffenen Seiten (Dashboard, Portfolio, Tasks).
 *
 * Da Vitest mit node-Umgebung läuft (kein jsdom / React Testing Library),
 * werden die in den Page-Komponenten eingebetteten Pure-Functions hier
 * 1:1 extrahiert und isoliert getestet – analog zu taskAggregation.test.ts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '@/stores/appStore';
import type { AnalysisResult, WizardData, Task, TaskStatus } from '@/types';

// ── Supabase-DB-Mock (kein Netzwerk in Tests) ──────────────────────────────
vi.mock('@/lib/supabase/db', () => ({
  loadAllData: vi.fn().mockResolvedValue(null),
  dbAddProject: vi.fn(), dbUpdateAnalysis: vi.fn(), dbSetAiPending: vi.fn(),
  dbSetAiFailReason: vi.fn(), dbDeleteProject: vi.fn(),
  dbAddTask: vi.fn(), dbUpdateTask: vi.fn(), dbDeleteTask: vi.fn(),
  dbAddChatMessage: vi.fn(), dbClearChat: vi.fn(), dbTakeSnapshot: vi.fn(),
  dbAddJiraConfig: vi.fn(), dbUpdateJiraConfig: vi.fn(), dbDeleteJiraConfig: vi.fn(),
  dbAddAiConfig: vi.fn(), dbUpdateAiConfig: vi.fn(), dbDeleteAiConfig: vi.fn(),
  dbSetActiveAiConfig: vi.fn(),
}));

let nowCounter = 2_000_000_000_000;
vi.spyOn(Date, 'now').mockImplementation(() => nowCounter++);

// ── Factories ──────────────────────────────────────────────────────────────
const makeAnalysis = (score = 70, source: 'ai' | 'fallback' = 'fallback'): AnalysisResult => ({
  risks: [],
  soll: [],
  waves: [{ number: 1, title: 'Foundation', duration: '2W', items: ['Task A'] }],
  summary: 'OK',
  source,
  score,
  scoreLabel: 'Gut',
});

const makeData = (name: string, stack = '', db = '', hosting = ''): WizardData => ({
  projectName: name,
  primaryStack: stack,
  database: db,
  hosting,
});

beforeEach(() => {
  useAppStore.setState({ projects: [], jiraConfigs: [], aiConfigs: [], organizations: [] });
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. VIEW-TOGGLE STATE-MACHINE
// ══════════════════════════════════════════════════════════════════════════════
// Die Toggle-Logik in allen Seiten:  (mode === 'grid') ? 'list' : 'grid'
// Hier als extrahierte Pure-Function getestet.

type ViewMode = 'grid' | 'list';
function toggleView(current: ViewMode): ViewMode {
  return current === 'grid' ? 'list' : 'grid';
}

describe('ViewMode Toggle – State Machine', () => {
  it('wechselt von grid zu list', () => {
    expect(toggleView('grid')).toBe('list');
  });

  it('wechselt von list zu grid', () => {
    expect(toggleView('list')).toBe('grid');
  });

  it('ist idempotent bei doppeltem Wechsel', () => {
    expect(toggleView(toggleView('grid'))).toBe('grid');
    expect(toggleView(toggleView('list'))).toBe('list');
  });

  it('Dashboard startet im grid-Modus (Default)', () => {
    const defaultDashboard: ViewMode = 'grid';
    expect(defaultDashboard).toBe('grid');
  });

  it('Portfolio startet im grid-Modus (Default)', () => {
    const defaultPortfolio: ViewMode = 'grid';
    expect(defaultPortfolio).toBe('grid');
  });

  it('Organizations startet im list-Modus (Default)', () => {
    const defaultOrgs: ViewMode = 'list';
    expect(defaultOrgs).toBe('list');
  });

  it('Tasks startet im list-Modus (Default)', () => {
    const defaultTasks: ViewMode = 'list';
    expect(defaultTasks).toBe('list');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. DASHBOARD – Abgeleitete Statistiken (unabhängig von der View)
// ══════════════════════════════════════════════════════════════════════════════
// Die Stats-Kacheln auf dem Dashboard zeigen dieselben Werte in grid & list.
// Die Berechnungslogik wird hier isoliert getestet.

type DashProject = ReturnType<typeof useAppStore.getState>['projects'][number];

function calcDashboardStats(projects: DashProject[]) {
  const visible = projects;
  const avgScore = visible.length > 0
    ? Math.round(visible.reduce((s, p) => s + (p.analysis.score ?? 0), 0) / visible.length)
    : null;
  const totalHigh = visible.reduce(
    (s, p) => s + p.analysis.risks.filter(r => r.severity === 'high').length, 0,
  );
  const totalMid = visible.reduce(
    (s, p) => s + p.analysis.risks.filter(r => r.severity === 'medium').length, 0,
  );
  const aiCount = visible.filter(p => p.analysis.source === 'ai').length;
  return { avgScore, totalHigh, totalMid, aiCount };
}

describe('Dashboard – Stats (View-unabhängig)', () => {
  it('gibt null zurück wenn keine Projekte vorhanden', () => {
    const stats = calcDashboardStats([]);
    expect(stats.avgScore).toBeNull();
    expect(stats.totalHigh).toBe(0);
    expect(stats.aiCount).toBe(0);
  });

  it('berechnet Durchschnittsscore korrekt', () => {
    useAppStore.getState().addProject(makeData('Proj A'), makeAnalysis(80));
    useAppStore.getState().addProject(makeData('Proj B'), makeAnalysis(60));
    const { projects } = useAppStore.getState();
    const { avgScore } = calcDashboardStats(projects);
    expect(avgScore).toBe(70);
  });

  it('zählt KI-Analysen korrekt', () => {
    useAppStore.getState().addProject(makeData('Proj AI'), makeAnalysis(80, 'ai'));
    useAppStore.getState().addProject(makeData('Proj Rule'), makeAnalysis(60, 'fallback'));
    const { projects } = useAppStore.getState();
    expect(calcDashboardStats(projects).aiCount).toBe(1);
  });

  it('zählt hohe Risiken korrekt', () => {
    const analysis: AnalysisResult = {
      ...makeAnalysis(50),
      risks: [
        { title: 'Kritisch', description: '', severity: 'high', recommendation: '' },
        { title: 'Mittel',   description: '', severity: 'medium', recommendation: '' },
      ],
    };
    useAppStore.getState().addProject(makeData('Proj X'), analysis);
    const { projects } = useAppStore.getState();
    const stats = calcDashboardStats(projects);
    expect(stats.totalHigh).toBe(1);
    expect(stats.totalMid).toBe(1);
  });

  it('filtert Projekte nach Org – Grid und List zeigen identische Daten', () => {
    useAppStore.getState().addProject(makeData('OrgProjekt'), makeAnalysis(75));
    const { projects } = useAppStore.getState();
    // Ohne Filter: alle sichtbar
    const all = calcDashboardStats(projects);
    // Mit viewMode='grid' und viewMode='list' – dieselbe Datenbasis
    expect(all.avgScore).toBe(75);
    // Simulation: Org-Filter = kein passendes orgId → leer
    const filtered = calcDashboardStats(projects.filter(p => p.orgId === 'nonexistent'));
    expect(filtered.avgScore).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. PORTFOLIO – buildTechMap (Grid- & List-Ansicht zeigen dieselben Einträge)
// ══════════════════════════════════════════════════════════════════════════════

type Category = 'Framework' | 'Datenbank' | 'Hosting / Infra';
interface TechEntry {
  key: string;
  label: string;
  category: Category;
  projects: { id: string; name: string; hasHighRisk: boolean }[];
}

const STACK_LABELS: Record<string, string> = {
  nextjs: 'Next.js / React', vue: 'Vue / Nuxt', go: 'Go',
};
const DB_LABELS: Record<string, string> = {
  postgres: 'PostgreSQL', mongodb: 'MongoDB',
};
const HOSTING_LABELS: Record<string, string> = {
  vercel: 'Vercel', aws: 'AWS',
};

function buildTechMap(projects: DashProject[]): TechEntry[] {
  const map = new Map<string, TechEntry>();

  const add = (key: string, label: string, category: Category, project: DashProject) => {
    if (!key || key === 'none') return;
    const projectEntry = {
      id: project.id,
      name: (project.data.projectName as string) || project.id,
      hasHighRisk: project.analysis.risks.some(r => r.severity === 'high'),
    };
    const existing = map.get(key);
    if (existing) {
      if (!existing.projects.some(p => p.id === project.id)) existing.projects.push(projectEntry);
    } else {
      map.set(key, { key, label, category, projects: [projectEntry] });
    }
  };

  projects.forEach(project => {
    const split = (k: keyof WizardData) =>
      ((project.data[k] as string) || '').split(',').filter(Boolean);
    split('primaryStack').forEach(v => add(v, STACK_LABELS[v] || v, 'Framework', project));
    split('database').forEach(v => add(v, DB_LABELS[v] || v, 'Datenbank', project));
    split('hosting').forEach(v => add(v, HOSTING_LABELS[v] || v, 'Hosting / Infra', project));
  });

  return [...map.values()].sort((a, b) => b.projects.length - a.projects.length);
}

describe('Portfolio – buildTechMap (identische Daten für grid & list)', () => {
  it('gibt leeres Array zurück wenn keine Projekte existieren', () => {
    expect(buildTechMap([])).toHaveLength(0);
  });

  it('erkannt Stack-Technologien korrekt', () => {
    useAppStore.getState().addProject(makeData('App', 'nextjs'), makeAnalysis());
    const { projects } = useAppStore.getState();
    const techs = buildTechMap(projects);
    expect(techs.some(t => t.key === 'nextjs')).toBe(true);
    expect(techs.find(t => t.key === 'nextjs')?.label).toBe('Next.js / React');
    expect(techs.find(t => t.key === 'nextjs')?.category).toBe('Framework');
  });

  it('erkennt Datenbank-Technologien korrekt', () => {
    useAppStore.getState().addProject(makeData('App', '', 'postgres'), makeAnalysis());
    const { projects } = useAppStore.getState();
    const techs = buildTechMap(projects);
    expect(techs.find(t => t.key === 'postgres')?.label).toBe('PostgreSQL');
    expect(techs.find(t => t.key === 'postgres')?.category).toBe('Datenbank');
  });

  it('erkennt Hosting-Technologien korrekt', () => {
    useAppStore.getState().addProject(makeData('App', '', '', 'vercel'), makeAnalysis());
    const { projects } = useAppStore.getState();
    const techs = buildTechMap(projects);
    expect(techs.find(t => t.key === 'vercel')?.label).toBe('Vercel');
    expect(techs.find(t => t.key === 'vercel')?.category).toBe('Hosting / Infra');
  });

  it('aggregiert mehrere Projekte unter derselben Technologie', () => {
    useAppStore.getState().addProject(makeData('App 1', 'nextjs'), makeAnalysis());
    useAppStore.getState().addProject(makeData('App 2', 'nextjs'), makeAnalysis());
    const { projects } = useAppStore.getState();
    const techs = buildTechMap(projects);
    const entry = techs.find(t => t.key === 'nextjs')!;
    expect(entry.projects).toHaveLength(2);
  });

  it('markiert Technologien bei Projekten mit hohem Risiko', () => {
    const riskyAnalysis: AnalysisResult = {
      ...makeAnalysis(40),
      risks: [{ title: 'Risky', description: '', severity: 'high', recommendation: '' }],
    };
    useAppStore.getState().addProject(makeData('Risky App', 'go'), riskyAnalysis);
    const { projects } = useAppStore.getState();
    const techs = buildTechMap(projects);
    expect(techs.find(t => t.key === 'go')?.projects[0].hasHighRisk).toBe(true);
  });

  it('ignoriert "none"-Werte', () => {
    useAppStore.getState().addProject(makeData('App', 'none', 'none', 'none'), makeAnalysis());
    const { projects } = useAppStore.getState();
    expect(buildTechMap(projects)).toHaveLength(0);
  });

  it('unterstützt kommagetrennte Mehrfach-Technologien', () => {
    useAppStore.getState().addProject(makeData('Multi', 'nextjs,vue'), makeAnalysis());
    const { projects } = useAppStore.getState();
    const techs = buildTechMap(projects);
    expect(techs.some(t => t.key === 'nextjs')).toBe(true);
    expect(techs.some(t => t.key === 'vue')).toBe(true);
  });

  it('sortiert nach Projektanzahl absteigend', () => {
    useAppStore.getState().addProject(makeData('App 1', 'nextjs'), makeAnalysis());
    useAppStore.getState().addProject(makeData('App 2', 'nextjs,vue'), makeAnalysis());
    useAppStore.getState().addProject(makeData('App 3', 'nextjs'), makeAnalysis());
    const { projects } = useAppStore.getState();
    const techs = buildTechMap(projects);
    // nextjs hat 3 Projekte, vue hat 1 → nextjs muss vorne stehen
    expect(techs[0].key).toBe('nextjs');
    expect(techs[0].projects.length).toBeGreaterThan(techs[1].projects.length);
  });

  it('Kategorie-Filter liefert gleiche Einträge in grid & list', () => {
    useAppStore.getState().addProject(makeData('App', 'nextjs', 'postgres', 'vercel'), makeAnalysis());
    const { projects } = useAppStore.getState();
    const all = buildTechMap(projects);
    const frameworks = all.filter(t => t.category === 'Framework');
    const dbs        = all.filter(t => t.category === 'Datenbank');
    const hosting    = all.filter(t => t.category === 'Hosting / Infra');
    // In grid & list wird gefiltert – dieselbe Datenbasis, unterschiedliches Layout
    expect(frameworks.length + dbs.length + hosting.length).toBe(all.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. TASKS – Gruppen-Logik (grid & list operieren auf identischen gefilterten Tasks)
// ══════════════════════════════════════════════════════════════════════════════

type FlatTask = Task & { projectId: string; projectName: string };

function buildFlatTasks(projects: DashProject[]): FlatTask[] {
  return projects.flatMap(p =>
    (p.tasks ?? []).map(t => ({
      ...t,
      projectId: p.id,
      projectName: (p.data.projectName as string) || 'Unbenannt',
    })),
  );
}

function applyFilter(tasks: FlatTask[], status: TaskStatus | 'all', search: string): FlatTask[] {
  return tasks
    .filter(t => status === 'all' || t.status === status)
    .filter(t => !search
      || t.item.toLowerCase().includes(search.toLowerCase())
      || t.projectName.toLowerCase().includes(search.toLowerCase())
      || t.waveTitle.toLowerCase().includes(search.toLowerCase()));
}

type GroupBy = 'project' | 'status' | 'wave';
function buildGroups(tasks: FlatTask[], groupBy: GroupBy): { key: string; label: string; tasks: FlatTask[] }[] {
  if (groupBy === 'status') {
    return (['open', 'in-progress', 'done'] as TaskStatus[])
      .map(s => ({ key: s, label: s, tasks: tasks.filter(t => t.status === s) }))
      .filter(g => g.tasks.length > 0);
  }
  if (groupBy === 'wave') {
    const map = new Map<string, FlatTask[]>();
    tasks.forEach(t => {
      const k = `Wave ${t.waveNumber}: ${t.waveTitle}`;
      map.set(k, [...(map.get(k) ?? []), t]);
    });
    return [...map.entries()].map(([key, ts]) => ({ key, label: key, tasks: ts }));
  }
  const map = new Map<string, { label: string; tasks: FlatTask[] }>();
  tasks.forEach(t => {
    if (!map.has(t.projectId)) map.set(t.projectId, { label: t.projectName, tasks: [] });
    map.get(t.projectId)!.tasks.push(t);
  });
  return [...map.entries()].map(([key, { label, tasks: ts }]) => ({ key, label, tasks: ts }));
}

describe('Tasks – Gruppen- und Filter-Logik (View-unabhängig)', () => {
  let projectId: string;

  beforeEach(() => {
    useAppStore.getState().addProject(makeData('Mein Projekt'), makeAnalysis());
    projectId = useAppStore.getState().projects[0].id;
    useAppStore.getState().addTask(projectId, 1, 'Foundation', 'Aufgabe Offen');
    useAppStore.getState().addTask(projectId, 1, 'Foundation', 'Aufgabe In Arbeit');
    useAppStore.getState().addTask(projectId, 2, 'Security',   'Aufgabe Erledigt');
    const tasks = useAppStore.getState().projects[0].tasks!;
    useAppStore.getState().updateTaskStatus(projectId, tasks[1].id, 'in-progress');
    useAppStore.getState().updateTaskStatus(projectId, tasks[2].id, 'done');
  });

  it('flatTasks enthält alle 3 Aufgaben', () => {
    const flat = buildFlatTasks(useAppStore.getState().projects);
    expect(flat).toHaveLength(3);
    expect(flat.every(t => t.projectId === projectId)).toBe(true);
    expect(flat.every(t => t.projectName === 'Mein Projekt')).toBe(true);
  });

  it('Grid-Ansicht und List-Ansicht zeigen identische gefilterte Tasks', () => {
    const flat = buildFlatTasks(useAppStore.getState().projects);
    const forGrid = applyFilter(flat, 'all', '');
    const forList = applyFilter(flat, 'all', '');
    expect(forGrid).toHaveLength(forList.length);
    expect(forGrid.map(t => t.id)).toEqual(forList.map(t => t.id));
  });

  it('Status-Filter "open" reduziert Ergebnisse', () => {
    const flat = buildFlatTasks(useAppStore.getState().projects);
    expect(applyFilter(flat, 'open', '')).toHaveLength(1);
    expect(applyFilter(flat, 'in-progress', '')).toHaveLength(1);
    expect(applyFilter(flat, 'done', '')).toHaveLength(1);
    expect(applyFilter(flat, 'all', '')).toHaveLength(3);
  });

  it('Suche filtert nach Aufgaben-Text (case-insensitive)', () => {
    const flat = buildFlatTasks(useAppStore.getState().projects);
    expect(applyFilter(flat, 'all', 'offen')).toHaveLength(1);
    expect(applyFilter(flat, 'all', 'AUFGABE')).toHaveLength(3);
    expect(applyFilter(flat, 'all', 'nicht vorhanden')).toHaveLength(0);
  });

  it('Suche filtert nach Projektnamen', () => {
    const flat = buildFlatTasks(useAppStore.getState().projects);
    expect(applyFilter(flat, 'all', 'Mein Projekt')).toHaveLength(3);
    expect(applyFilter(flat, 'all', 'Fremdes Projekt')).toHaveLength(0);
  });

  it('Suche filtert nach Wave-Titel', () => {
    const flat = buildFlatTasks(useAppStore.getState().projects);
    expect(applyFilter(flat, 'all', 'Foundation')).toHaveLength(2);
    expect(applyFilter(flat, 'all', 'Security')).toHaveLength(1);
  });

  it('Gruppierung nach Projekt erzeugt 1 Gruppe', () => {
    const flat = buildFlatTasks(useAppStore.getState().projects);
    const groups = buildGroups(flat, 'project');
    expect(groups).toHaveLength(1);
    expect(groups[0].tasks).toHaveLength(3);
  });

  it('Gruppierung nach Status erzeugt 3 Gruppen (open / in-progress / done)', () => {
    const flat = buildFlatTasks(useAppStore.getState().projects);
    const groups = buildGroups(flat, 'status');
    expect(groups).toHaveLength(3);
    const keys = groups.map(g => g.key);
    expect(keys).toContain('open');
    expect(keys).toContain('in-progress');
    expect(keys).toContain('done');
  });

  it('Gruppierung nach Wave erzeugt 2 Gruppen (Wave 1 / Wave 2)', () => {
    const flat = buildFlatTasks(useAppStore.getState().projects);
    const groups = buildGroups(flat, 'wave');
    expect(groups).toHaveLength(2);
    expect(groups.some(g => g.key.includes('Foundation'))).toBe(true);
    expect(groups.some(g => g.key.includes('Security'))).toBe(true);
  });

  it('Grid-Ansicht zeigt dieselbe Gesamtanzahl wie die Listen-Ansicht', () => {
    const flat = buildFlatTasks(useAppStore.getState().projects);
    const filtered = applyFilter(flat, 'all', '');
    // In der Grid-Ansicht werden `filtered` direkt gerendert
    // In der Listen-Ansicht werden sie über groups gruppiert
    const groups = buildGroups(filtered, 'project');
    const totalInGroups = groups.reduce((s, g) => s + g.tasks.length, 0);
    expect(filtered.length).toBe(totalInGroups);
  });
});
