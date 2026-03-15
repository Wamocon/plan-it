/**
 * Unit-Tests für src/stores/appStore.ts
 *
 * Abdeckungsstrategie:
 *  - White-Box: alle Store-Aktionen werden direkt getestet.
 *  - Entscheidungsüberdeckung: updateAnalysis mit/ohne bestehendem Score (→
 *    Snapshot-Erzeugung), addAiConfig erste vs. weitere Konfigurationen,
 *    deleteAiConfig mit/ohne verbleibende aktive Konfiguration.
 *  - Pfadüberdeckung: Task-Status-Übergänge, setTaskJiraIssue, Chat-Verlauf.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAppStore } from '@/stores/appStore';
import type { AnalysisResult, WizardData } from '@/types';

// Alle Supabase-DB-Aufrufe mocken – der Store-Test prüft nur den Zustand-State,
// nicht die Datenbank-Persistenz (die wird in supabase-db.test.ts getestet).
vi.mock('@/lib/supabase/db', () => ({
  dbAddProject: vi.fn(),
  dbUpdateAnalysis: vi.fn(),
  dbSetAiPending: vi.fn(),
  dbSetAiFailReason: vi.fn(),
  dbDeleteProject: vi.fn(),
  dbAddTask: vi.fn(),
  dbUpdateTask: vi.fn(),
  dbDeleteTask: vi.fn(),
  dbAddChatMessage: vi.fn(),
  dbClearChat: vi.fn(),
  dbTakeSnapshot: vi.fn(),
  dbAddJiraConfig: vi.fn(),
  dbUpdateJiraConfig: vi.fn(),
  dbDeleteJiraConfig: vi.fn(),
  dbAddAiConfig: vi.fn(),
  dbUpdateAiConfig: vi.fn(),
  dbDeleteAiConfig: vi.fn(),
  dbSetActiveAiConfig: vi.fn(),
}));

// ── Hilfsobjekte ─────────────────────────────────────────────
const sampleAnalysis: AnalysisResult = {
  risks: [
    { title: 'R1', severity: 'high', description: 'Beschreibung', recommendation: 'Empfehlung' },
  ],
  soll: [{ area: 'Testing', target: 'Vitest einrichten' }],
  waves: [{ number: 1, title: 'Foundation', duration: '2 Wochen', items: ['CI/CD'] }],
  summary: 'Analyse abgeschlossen.',
  source: 'fallback',
  score: 60,
  scoreLabel: 'Mittel',
};

const sampleData: WizardData = { projectName: 'TestProjekt', teamSize: '5-15' };

// ── Tests ────────────────────────────────────────────────────
describe('useAppStore', () => {
  beforeEach(() => {
    // Store-Zustand vor jedem Test zurücksetzen
    useAppStore.setState({ projects: [], jiraConfigs: [], aiConfigs: [] });
    // Fake-Timer verhindern Date.now()-ID-Kollisionen bei schnell aufeinanderfolgenden Aufrufen.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ────────────────────────────────────────────────────────────
  // Projekte
  // ────────────────────────────────────────────────────────────

  describe('addProject()', () => {
    it('fügt ein neues Projekt zur Liste hinzu', () => {
      useAppStore.getState().addProject(sampleData, sampleAnalysis);
      expect(useAppStore.getState().projects).toHaveLength(1);
    });

    it('stellt neuste Projekte an den Anfang der Liste', () => {
      useAppStore.getState().addProject({ projectName: 'Erstes' }, sampleAnalysis);
      useAppStore.getState().addProject({ projectName: 'Zweites' }, sampleAnalysis);
      expect(useAppStore.getState().projects[0].data.projectName).toBe('Zweites');
    });

    it('gibt das neu erstellte Projekt zurück', () => {
      const project = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      expect(project.data).toEqual(sampleData);
      expect(project.analysis).toEqual(sampleAnalysis);
    });

    it('initialisiert tasks, chatHistory und snapshots als leere Arrays', () => {
      const project = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      expect(project.tasks).toEqual([]);
      expect(project.chatHistory).toEqual([]);
      expect(project.snapshots).toEqual([]);
    });
  });

  describe('getProject()', () => {
    it('gibt das Projekt mit der gesuchten ID zurück', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      expect(useAppStore.getState().getProject(p.id)?.id).toBe(p.id);
    });

    it('gibt undefined zurück wenn ID nicht gefunden', () => {
      expect(useAppStore.getState().getProject('nicht-vorhanden')).toBeUndefined();
    });
  });

  describe('updateAnalysis()', () => {
    it('aktualisiert die Analyse eines Projekts', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      const newAnalysis: AnalysisResult = { ...sampleAnalysis, summary: 'Neue Zusammenfassung', score: 75 };

      useAppStore.getState().updateAnalysis(p.id, newAnalysis);

      expect(useAppStore.getState().getProject(p.id)?.analysis.summary).toBe('Neue Zusammenfassung');
    });

    it('erstellt einen Snapshot wenn die alte Analyse einen Score hatte', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis); // score: 60

      useAppStore.getState().updateAnalysis(p.id, { ...sampleAnalysis, score: 75 });

      const snapshots = useAppStore.getState().getProject(p.id)?.snapshots ?? [];
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].score).toBe(60); // der ALTE Score wird gespeichert
    });

    it('erstellt keinen Snapshot wenn die alte Analyse keinen Score hatte', () => {
      const analysisNoScore: AnalysisResult = { ...sampleAnalysis, score: undefined };
      const p = useAppStore.getState().addProject(sampleData, analysisNoScore);

      useAppStore.getState().updateAnalysis(p.id, sampleAnalysis);

      expect(useAppStore.getState().getProject(p.id)?.snapshots).toHaveLength(0);
    });

    it('setzt aiPending auf false nach der Aktualisierung', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().setAiPending(p.id, true);
      useAppStore.getState().updateAnalysis(p.id, sampleAnalysis);

      expect(useAppStore.getState().getProject(p.id)?.aiPending).toBe(false);
    });
  });

  describe('setAiPending() / setAiFailReason()', () => {
    it('setzt aiPending korrekt', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().setAiPending(p.id, true);
      expect(useAppStore.getState().getProject(p.id)?.aiPending).toBe(true);
    });

    it('setzt aiFailReason und setzt aiPending zurück auf false', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().setAiPending(p.id, true);
      useAppStore.getState().setAiFailReason(p.id, 'limit');

      const proj = useAppStore.getState().getProject(p.id);
      expect(proj?.aiFailReason).toBe('limit');
      expect(proj?.aiPending).toBe(false);
    });
  });

  describe('deleteProject()', () => {
    it('entfernt das Projekt mit der angegebenen ID', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().deleteProject(p.id);
      expect(useAppStore.getState().getProject(p.id)).toBeUndefined();
    });

    it('lässt andere Projekte unberührt', () => {
      const p1 = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      vi.advanceTimersByTime(1); // unique Date.now() für p2
      const p2 = useAppStore.getState().addProject({ projectName: 'Anderes' }, sampleAnalysis);
      useAppStore.getState().deleteProject(p1.id);
      expect(useAppStore.getState().getProject(p2.id)).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  // Aufgaben (Tasks)
  // ────────────────────────────────────────────────────────────

  describe('addTask()', () => {
    it('fügt eine neue Aufgabe mit Status "open" hinzu', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().addTask(p.id, 1, 'Foundation', 'CI/CD aufsetzen');

      const tasks = useAppStore.getState().getProject(p.id)?.tasks ?? [];
      expect(tasks).toHaveLength(1);
      expect(tasks[0].status).toBe('open');
      expect(tasks[0].item).toBe('CI/CD aufsetzen');
    });
  });

  describe('updateTaskStatus()', () => {
    it('ändert den Status einer Aufgabe (open → in-progress → done)', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().addTask(p.id, 1, 'Foundation', 'Test');
      const taskId = useAppStore.getState().getProject(p.id)!.tasks![0].id;

      useAppStore.getState().updateTaskStatus(p.id, taskId, 'in-progress');
      expect(useAppStore.getState().getProject(p.id)?.tasks?.[0].status).toBe('in-progress');

      useAppStore.getState().updateTaskStatus(p.id, taskId, 'done');
      expect(useAppStore.getState().getProject(p.id)?.tasks?.[0].status).toBe('done');
    });
  });

  describe('updateTaskNote()', () => {
    it('speichert eine Notiz zur Aufgabe', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().addTask(p.id, 1, 'Foundation', 'Test');
      const taskId = useAppStore.getState().getProject(p.id)!.tasks![0].id;

      useAppStore.getState().updateTaskNote(p.id, taskId, 'Meine Notiz');
      expect(useAppStore.getState().getProject(p.id)?.tasks?.[0].note).toBe('Meine Notiz');
    });
  });

  describe('deleteTask()', () => {
    it('entfernt eine Aufgabe', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().addTask(p.id, 1, 'Foundation', 'Remove me');
      const taskId = useAppStore.getState().getProject(p.id)!.tasks![0].id;

      useAppStore.getState().deleteTask(p.id, taskId);
      expect(useAppStore.getState().getProject(p.id)?.tasks).toHaveLength(0);
    });
  });

  describe('setTaskJiraIssue()', () => {
    it('speichert Jira-Ticket-Daten an der Aufgabe', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().addTask(p.id, 1, 'Foundation', 'Test');
      const taskId = useAppStore.getState().getProject(p.id)!.tasks![0].id;

      useAppStore.getState().setTaskJiraIssue(p.id, taskId, 'TEST-42', 'https://jira.example.com/browse/TEST-42', 'config-1');

      const task = useAppStore.getState().getProject(p.id)?.tasks?.[0];
      expect(task?.jiraIssueKey).toBe('TEST-42');
      expect(task?.jiraIssueUrl).toBe('https://jira.example.com/browse/TEST-42');
      expect(task?.jiraConfigId).toBe('config-1');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Chat
  // ────────────────────────────────────────────────────────────

  describe('addChatMessage()', () => {
    it('fügt eine Chat-Nachricht hinzu', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().addChatMessage(p.id, { role: 'user', content: 'Hallo!' });

      const history = useAppStore.getState().getProject(p.id)?.chatHistory ?? [];
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('Hallo!');
      expect(history[0].role).toBe('user');
    });

    it('weist automatisch id und createdAt zu', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().addChatMessage(p.id, { role: 'assistant', content: 'Hi!' });

      const msg = useAppStore.getState().getProject(p.id)?.chatHistory?.[0];
      expect(msg?.id).toBeDefined();
      expect(msg?.createdAt).toBeDefined();
    });
  });

  describe('clearChat()', () => {
    it('löscht die gesamte Chat-Historie eines Projekts', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().addChatMessage(p.id, { role: 'user', content: 'Frage 1' });
      useAppStore.getState().addChatMessage(p.id, { role: 'assistant', content: 'Antwort 1' });

      useAppStore.getState().clearChat(p.id);

      expect(useAppStore.getState().getProject(p.id)?.chatHistory).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Snapshots
  // ────────────────────────────────────────────────────────────

  describe('takeSnapshot()', () => {
    it('speichert den aktuellen Analyse-Stand als Snapshot', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().takeSnapshot(p.id);

      const snapshots = useAppStore.getState().getProject(p.id)?.snapshots ?? [];
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].score).toBe(60);
      expect(snapshots[0].riskCount).toBe(1);
      expect(snapshots[0].highCount).toBe(1);
    });

    it('häuft mehrere Snapshots an', () => {
      const p = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().takeSnapshot(p.id);
      useAppStore.getState().takeSnapshot(p.id);

      expect(useAppStore.getState().getProject(p.id)?.snapshots).toHaveLength(2);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Jira-Konfigurationen
  // ────────────────────────────────────────────────────────────

  describe('Jira-Konfigurationen', () => {
    const jiraConfigInput = {
      label: 'Firma XY',
      baseUrl: 'https://xy.atlassian.net',
      email: 'dev@xy.com',
      apiToken: 'token',
      projectKey: 'XY',
      issueType: 'Task',
    };

    it('addJiraConfig() fügt Konfiguration hinzu und gibt sie zurück', () => {
      const cfg = useAppStore.getState().addJiraConfig(jiraConfigInput);
      expect(useAppStore.getState().jiraConfigs).toHaveLength(1);
      expect(cfg.id).toBeDefined();
      expect(cfg.createdAt).toBeDefined();
    });

    it('updateJiraConfig() aktualisiert ein Feld', () => {
      const cfg = useAppStore.getState().addJiraConfig(jiraConfigInput);
      useAppStore.getState().updateJiraConfig(cfg.id, { label: 'Neuer Name' });
      expect(useAppStore.getState().jiraConfigs[0].label).toBe('Neuer Name');
    });

    it('deleteJiraConfig() entfernt die Konfiguration', () => {
      const cfg = useAppStore.getState().addJiraConfig(jiraConfigInput);
      useAppStore.getState().deleteJiraConfig(cfg.id);
      expect(useAppStore.getState().jiraConfigs).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // AI-Konfigurationen (Entscheidungsüberdeckung)
  // ────────────────────────────────────────────────────────────

  describe('AI-Konfigurationen', () => {
    // Dieser describe-Block hat bereits eigene fake-Timer aus dem äußeren beforeEach.
    // Die nested beforeEach/afterEach hier überschreiben nur den setSystemTime-Wert.
    beforeEach(() => {
      vi.setSystemTime(new Date('2024-06-01T00:00:00.000Z')); // anderer Startwert als outer
    });
    afterEach(() => {
      // vi.useRealTimers wird vom äußeren afterEach übernommen
    });

    const aiConfigInput = {
      provider: 'gemini' as const,
      label: 'Google Gemini',
      apiKey: 'key-abc',
      isActive: false,
    };

    it('addAiConfig() setzt erste Konfiguration automatisch auf aktiv', () => {
      const cfg = useAppStore.getState().addAiConfig(aiConfigInput);
      expect(cfg.isActive).toBe(true);
    });

    it('addAiConfig() setzt weitere Konfiguration nicht automatisch auf aktiv', () => {
      useAppStore.getState().addAiConfig(aiConfigInput);
      vi.advanceTimersByTime(1);
      const second = useAppStore.getState().addAiConfig({ ...aiConfigInput, label: 'Zweite' });
      expect(second.isActive).toBe(false);
    });

    it('addAiConfig() mit isActive=true deaktiviert vorherige aktive Konfiguration', () => {
      useAppStore.getState().addAiConfig(aiConfigInput); // wird erste → isActive=true
      vi.advanceTimersByTime(1);
      useAppStore.getState().addAiConfig({ ...aiConfigInput, label: 'Neue aktive', isActive: true });

      const configs = useAppStore.getState().aiConfigs;
      const activeCount = configs.filter(c => c.isActive).length;
      expect(activeCount).toBe(1);
      expect(configs.find(c => c.isActive)?.label).toBe('Neue aktive');
    });

    it('updateAiConfig() mit isActive=true deaktiviert alle anderen', () => {
      const c1 = useAppStore.getState().addAiConfig(aiConfigInput);
      vi.advanceTimersByTime(1);
      const c2 = useAppStore.getState().addAiConfig({ ...aiConfigInput, label: 'Zweite' });

      useAppStore.getState().updateAiConfig(c2.id, { isActive: true });

      const configs = useAppStore.getState().aiConfigs;
      expect(configs.find(c => c.id === c1.id)?.isActive).toBe(false);
      expect(configs.find(c => c.id === c2.id)?.isActive).toBe(true);
    });

    it('updateAiConfig() ohne isActive=true lässt andere unberührt', () => {
      const c1 = useAppStore.getState().addAiConfig(aiConfigInput); // isActive = true
      vi.advanceTimersByTime(1);
      useAppStore.getState().addAiConfig({ ...aiConfigInput, label: 'Zweite' });

      useAppStore.getState().updateAiConfig(c1.id, { label: 'Umbenannt' });

      expect(useAppStore.getState().aiConfigs.find(c => c.id === c1.id)?.label).toBe('Umbenannt');
      expect(useAppStore.getState().aiConfigs.find(c => c.id === c1.id)?.isActive).toBe(true);
    });

    it('deleteAiConfig() aktiviert die erste verbleibende Konfiguration wenn die aktive gelöscht wird', () => {
      const c1 = useAppStore.getState().addAiConfig(aiConfigInput); // isActive = true
      vi.advanceTimersByTime(1);
      const c2 = useAppStore.getState().addAiConfig({ ...aiConfigInput, label: 'Zweite' });

      useAppStore.getState().deleteAiConfig(c1.id);

      expect(useAppStore.getState().aiConfigs.find(c => c.id === c2.id)?.isActive).toBe(true);
    });

    it('deleteAiConfig() lässt isActive unangetastet wenn es eine aktive gibt', () => {
      useAppStore.getState().addAiConfig(aiConfigInput); // isActive = true
      vi.advanceTimersByTime(1);
      const c2 = useAppStore.getState().addAiConfig({ ...aiConfigInput, label: 'Zweite', isActive: false });

      useAppStore.getState().deleteAiConfig(c2.id);

      expect(useAppStore.getState().aiConfigs).toHaveLength(1);
      expect(useAppStore.getState().aiConfigs[0].isActive).toBe(true);
    });

    it('setActiveAiConfig() aktiviert nur die angegebene Konfiguration', () => {
      const c1 = useAppStore.getState().addAiConfig(aiConfigInput);
      vi.advanceTimersByTime(1);
      const c2 = useAppStore.getState().addAiConfig({ ...aiConfigInput, label: 'Zweite' });

      useAppStore.getState().setActiveAiConfig(c2.id);

      const configs = useAppStore.getState().aiConfigs;
      expect(configs.find(c => c.id === c1.id)?.isActive).toBe(false);
      expect(configs.find(c => c.id === c2.id)?.isActive).toBe(true);
    });

    it('getActiveAiConfig() gibt die aktive Konfiguration zurück', () => {
      const c1 = useAppStore.getState().addAiConfig(aiConfigInput);
      expect(useAppStore.getState().getActiveAiConfig()?.id).toBe(c1.id);
    });

    it('getActiveAiConfig() gibt undefined zurück wenn keine Konfiguration vorhanden', () => {
      expect(useAppStore.getState().getActiveAiConfig()).toBeUndefined();
    });
  });
});
