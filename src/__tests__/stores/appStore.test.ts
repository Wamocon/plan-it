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
  loadAllData: vi.fn().mockResolvedValue(null),
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
  dbGetUserProfile: vi.fn().mockResolvedValue(null),
  dbGetAllUserProfiles: vi.fn().mockResolvedValue([]),
  dbUpdateUserRole: vi.fn().mockResolvedValue(undefined),
  dbUpdateDisplayName: vi.fn().mockResolvedValue(undefined),
  // Organisationen
  dbGetMyOrganizations: vi.fn().mockResolvedValue([]),
  dbCreateOrganization: vi.fn().mockImplementation(async (org) => ({
    id: crypto.randomUUID(),
    name: org.name,
    slug: org.slug,
    description: org.description,
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
  })),
  dbUpdateOrganization: vi.fn().mockResolvedValue(undefined),
  dbDeleteOrganization: vi.fn().mockResolvedValue(undefined),
  dbGetOrgMembers: vi.fn().mockResolvedValue([]),
  dbAddOrgMember: vi.fn().mockResolvedValue(undefined),
  dbUpdateOrgMemberRole: vi.fn().mockResolvedValue(undefined),
  dbRemoveOrgMember: vi.fn().mockResolvedValue(undefined),
  dbGetOrgProjects: vi.fn().mockResolvedValue([]),
  dbAssignProjectToOrg: vi.fn().mockResolvedValue(undefined),
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

  // ────────────────────────────────────────────────────────────
  // Rollen
  // ────────────────────────────────────────────────────────────

  describe('hasMinRole()', () => {
    it('gibt false zurück wenn kein Profil geladen', () => {
      useAppStore.setState({ userProfile: null });
      expect(useAppStore.getState().hasMinRole('user')).toBe(false);
    });

    it('Admin hat mindestens jede Rolle', () => {
      useAppStore.setState({ userProfile: { id: '1', userId: 'u1', email: 'a@b.de', role: 'admin', createdAt: '' } });
      expect(useAppStore.getState().hasMinRole('admin')).toBe(true);
      expect(useAppStore.getState().hasMinRole('it-architect')).toBe(true);
      expect(useAppStore.getState().hasMinRole('developer')).toBe(true);
      expect(useAppStore.getState().hasMinRole('user')).toBe(true);
    });

    it('IT-Architekt hat nicht die Admin-Rolle', () => {
      useAppStore.setState({ userProfile: { id: '1', userId: 'u1', email: 'a@b.de', role: 'it-architect', createdAt: '' } });
      expect(useAppStore.getState().hasMinRole('admin')).toBe(false);
      expect(useAppStore.getState().hasMinRole('it-architect')).toBe(true);
      expect(useAppStore.getState().hasMinRole('developer')).toBe(true);
    });

    it('Entwickler hat nicht IT-Architekt oder höher', () => {
      useAppStore.setState({ userProfile: { id: '1', userId: 'u1', email: 'a@b.de', role: 'developer', createdAt: '' } });
      expect(useAppStore.getState().hasMinRole('it-architect')).toBe(false);
      expect(useAppStore.getState().hasMinRole('developer')).toBe(true);
    });

    it('User hat nur Mindest-Rolle user', () => {
      useAppStore.setState({ userProfile: { id: '1', userId: 'u1', email: 'a@b.de', role: 'user', createdAt: '' } });
      expect(useAppStore.getState().hasMinRole('developer')).toBe(false);
      expect(useAppStore.getState().hasMinRole('user')).toBe(true);
    });
  });

  describe('hasRole()', () => {
    it('gibt false zurück wenn kein Profil geladen', () => {
      useAppStore.setState({ userProfile: null });
      expect(useAppStore.getState().hasRole('admin')).toBe(false);
    });

    it('gibt true zurück bei exakter Rollenübereinstimmung', () => {
      useAppStore.setState({ userProfile: { id: '1', userId: 'u1', email: 'a@b.de', role: 'developer', createdAt: '' } });
      expect(useAppStore.getState().hasRole('developer')).toBe(true);
    });

    it('gibt false zurück bei falscher Rolle', () => {
      useAppStore.setState({ userProfile: { id: '1', userId: 'u1', email: 'a@b.de', role: 'user', createdAt: '' } });
      expect(useAppStore.getState().hasRole('admin')).toBe(false);
    });

    it('gibt true zurück wenn eine von mehreren Rollen passt', () => {
      useAppStore.setState({ userProfile: { id: '1', userId: 'u1', email: 'a@b.de', role: 'it-architect', createdAt: '' } });
      expect(useAppStore.getState().hasRole('admin', 'it-architect')).toBe(true);
    });
  });

  describe('updateUserRole()', () => {
    it('aktualisiert die Rolle eines Nutzers in allUserProfiles', async () => {
      useAppStore.setState({
        allUserProfiles: [
          { id: '1', userId: 'u1', email: 'a@b.de', role: 'user', createdAt: '' },
          { id: '2', userId: 'u2', email: 'b@b.de', role: 'developer', createdAt: '' },
        ],
      });
      await useAppStore.getState().updateUserRole('u1', 'it-architect');
      const updated = useAppStore.getState().allUserProfiles.find(p => p.userId === 'u1');
      expect(updated?.role).toBe('it-architect');
    });

    it('lässt andere Profile unberührt', async () => {
      useAppStore.setState({
        allUserProfiles: [
          { id: '1', userId: 'u1', email: 'a@b.de', role: 'user', createdAt: '' },
          { id: '2', userId: 'u2', email: 'b@b.de', role: 'developer', createdAt: '' },
        ],
      });
      await useAppStore.getState().updateUserRole('u1', 'admin');
      const other = useAppStore.getState().allUserProfiles.find(p => p.userId === 'u2');
      expect(other?.role).toBe('developer');
    });
  });

  describe('updateDisplayName()', () => {
    it('aktualisiert displayName im eigenen Profil', async () => {
      useAppStore.setState({
        userProfile: { id: '1', userId: 'u1', email: 'a@b.de', role: 'admin', createdAt: '' },
      });
      await useAppStore.getState().updateDisplayName('Max Mustermann');
      expect(useAppStore.getState().userProfile?.displayName).toBe('Max Mustermann');
    });

    it('tut nichts wenn kein Profil geladen', async () => {
      useAppStore.setState({ userProfile: null });
      await useAppStore.getState().updateDisplayName('Test');
      expect(useAppStore.getState().userProfile).toBeNull();
    });
  });

  // ── UUID-Format ──────────────────────────────────────────────
  describe('ID-Generierung (UUID-Format für Supabase)', () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    it('addProject() erzeugt eine valide UUID als Projekt-ID', () => {
      const project = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      expect(project.id).toMatch(UUID_REGEX);
    });

    it('addTask() erzeugt eine valide UUID als Task-ID', () => {
      const project = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().addTask(project.id, 1, 'Wave 1', 'Setup CI');
      const p = useAppStore.getState().getProject(project.id)!;
      expect(p.tasks).toBeDefined();
      expect(p.tasks![0]!.id).toMatch(UUID_REGEX);
    });

    it('addChatMessage() erzeugt eine valide UUID als Message-ID', () => {
      const project = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().addChatMessage(project.id, { role: 'user', content: 'Hallo' });
      const p = useAppStore.getState().getProject(project.id)!;
      expect(p.chatHistory).toBeDefined();
      expect(p.chatHistory![0]!.id).toMatch(UUID_REGEX);
    });

    it('takeSnapshot() erzeugt eine valide UUID als Snapshot-ID', () => {
      const project = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      useAppStore.getState().takeSnapshot(project.id);
      const p = useAppStore.getState().getProject(project.id)!;
      expect(p.snapshots).toBeDefined();
      expect(p.snapshots![0]!.id).toMatch(UUID_REGEX);
    });

    it('addJiraConfig() erzeugt eine valide UUID als Config-ID', () => {
      const config = useAppStore.getState().addJiraConfig({
        label: 'Test', baseUrl: 'https://jira.test', email: 'a@b.c',
        apiToken: 'tok', projectKey: 'TP', issueType: 'Task',
      });
      expect(config.id).toMatch(UUID_REGEX);
    });

    it('addAiConfig() erzeugt eine valide UUID als Config-ID', () => {
      const config = useAppStore.getState().addAiConfig({
        provider: 'gemini', label: 'Test', apiKey: 'key', isActive: true,
      });
      expect(config.id).toMatch(UUID_REGEX);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Organisationen
  // ────────────────────────────────────────────────────────────

  describe('Organisationen', () => {
    const sampleOrg = { name: 'Acme GmbH', slug: 'acme-gmbh', description: 'Test-Org' };

    beforeEach(() => {
      useAppStore.setState({ organizations: [], currentOrgMembers: [], currentOrgProjects: [] });
    });

    it('loadOrganizations() setzt organizations im Store', async () => {
      await useAppStore.getState().loadOrganizations();
      // dbGetMyOrganizations ist gemockt und gibt [] zurück
      expect(useAppStore.getState().organizations).toEqual([]);
    });

    it('createOrganization() fügt neue Org vorne in die Liste ein', async () => {
      const org = await useAppStore.getState().createOrganization(sampleOrg);
      expect(org).not.toBeNull();
      expect(useAppStore.getState().organizations).toHaveLength(1);
      expect(useAppStore.getState().organizations[0].name).toBe('Acme GmbH');
    });

    it('createOrganization() gibt null zurück wenn DB fehlschlägt', async () => {
      // dbCreateOrganization ist auf null gemockt (Standardverhalten)
      // Organistation bereits auf null gesetzt via Mock – prüfe null-Pfad im Store
      const { dbCreateOrganization } = await import('@/lib/supabase/db');
      (dbCreateOrganization as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      const org = await useAppStore.getState().createOrganization(sampleOrg);
      expect(org).toBeNull();
      expect(useAppStore.getState().organizations).toHaveLength(0);
    });

    it('updateOrganization() aktualisiert Name und Description im Store', async () => {
      const org = await useAppStore.getState().createOrganization(sampleOrg);
      await useAppStore.getState().updateOrganization(org!.id, { name: 'Neuer Name' });
      expect(useAppStore.getState().organizations[0].name).toBe('Neuer Name');
    });

    it('updateOrganization() lässt andere Orgs unberührt', async () => {
      await useAppStore.getState().createOrganization({ name: 'Org A', slug: 'org-a' });
      vi.advanceTimersByTime(1);
      const orgB = await useAppStore.getState().createOrganization({ name: 'Org B', slug: 'org-b' });
      await useAppStore.getState().updateOrganization(orgB!.id, { name: 'Org B neu' });
      expect(useAppStore.getState().organizations.find(o => o.name === 'Org A')).toBeDefined();
    });

    it('deleteOrganization() entfernt die Org aus dem Store', async () => {
      const org = await useAppStore.getState().createOrganization(sampleOrg);
      await useAppStore.getState().deleteOrganization(org!.id);
      expect(useAppStore.getState().organizations).toHaveLength(0);
    });

    it('deleteOrganization() lässt andere Orgs unberührt', async () => {
      const orgA = await useAppStore.getState().createOrganization({ name: 'A', slug: 'a' });
      vi.advanceTimersByTime(1);
      await useAppStore.getState().createOrganization({ name: 'B', slug: 'b' });
      await useAppStore.getState().deleteOrganization(orgA!.id);
      expect(useAppStore.getState().organizations).toHaveLength(1);
      expect(useAppStore.getState().organizations[0].name).toBe('B');
    });

    it('loadOrgMembers() setzt currentOrgMembers', async () => {
      await useAppStore.getState().loadOrgMembers('org-1');
      expect(useAppStore.getState().currentOrgMembers).toEqual([]);
    });

    it('updateOrgMemberRole() aktualisiert Rolle im currentOrgMembers', async () => {
      useAppStore.setState({
        currentOrgMembers: [
          { id: 'm1', orgId: 'org-1', userId: 'u1', role: 'member', createdAt: '' },
          { id: 'm2', orgId: 'org-1', userId: 'u2', role: 'member', createdAt: '' },
        ],
      });
      await useAppStore.getState().updateOrgMemberRole('org-1', 'u1', 'admin');
      const m = useAppStore.getState().currentOrgMembers.find(m => m.userId === 'u1');
      expect(m?.role).toBe('admin');
    });

    it('updateOrgMemberRole() lässt andere Mitglieder unberührt', async () => {
      useAppStore.setState({
        currentOrgMembers: [
          { id: 'm1', orgId: 'org-1', userId: 'u1', role: 'member', createdAt: '' },
          { id: 'm2', orgId: 'org-1', userId: 'u2', role: 'member', createdAt: '' },
        ],
      });
      await useAppStore.getState().updateOrgMemberRole('org-1', 'u1', 'admin');
      const m2 = useAppStore.getState().currentOrgMembers.find(m => m.userId === 'u2');
      expect(m2?.role).toBe('member');
    });

    it('removeOrgMember() entfernt das Mitglied aus currentOrgMembers', async () => {
      useAppStore.setState({
        currentOrgMembers: [
          { id: 'm1', orgId: 'org-1', userId: 'u1', role: 'owner', createdAt: '' },
        ],
      });
      await useAppStore.getState().removeOrgMember('org-1', 'u1');
      expect(useAppStore.getState().currentOrgMembers).toHaveLength(0);
    });

    it('loadOrgProjects() setzt currentOrgProjects', async () => {
      await useAppStore.getState().loadOrgProjects('org-1');
      expect(useAppStore.getState().currentOrgProjects).toEqual([]);
    });

    it('assignProjectToOrg() setzt orgId am Projekt im lokalen State', async () => {
      const project = useAppStore.getState().addProject(sampleData, sampleAnalysis);
      await useAppStore.getState().assignProjectToOrg(project.id, 'org-1');
      expect(useAppStore.getState().getProject(project.id)?.orgId).toBe('org-1');
    });

    it('assignProjectToOrg() mit null entfernt orgId vom Projekt', async () => {
      const project = useAppStore.getState().addProject({ ...sampleData }, sampleAnalysis);
      useAppStore.setState({
        projects: useAppStore.getState().projects.map(p =>
          p.id === project.id ? { ...p, orgId: 'org-1' } : p
        ),
      });
      await useAppStore.getState().assignProjectToOrg(project.id, null);
      expect(useAppStore.getState().getProject(project.id)?.orgId).toBeUndefined();
    });

    it('getMyOrgRole() gibt null zurück wenn kein Profil geladen', () => {
      useAppStore.setState({ userProfile: null });
      expect(useAppStore.getState().getMyOrgRole('org-1')).toBeNull();
    });

    it('getMyOrgRole() gibt die Rolle des aktuellen Users zurück', () => {
      useAppStore.setState({
        userProfile: { id: '1', userId: 'u1', email: 'a@b.de', role: 'user', createdAt: '' },
        currentOrgMembers: [
          { id: 'm1', orgId: 'org-1', userId: 'u1', role: 'admin', createdAt: '' },
        ],
      });
      expect(useAppStore.getState().getMyOrgRole('org-1')).toBe('admin');
    });

    it('getMyOrgRole() gibt null zurück wenn User kein Mitglied ist', () => {
      useAppStore.setState({
        userProfile: { id: '1', userId: 'u1', email: 'a@b.de', role: 'user', createdAt: '' },
        currentOrgMembers: [],
      });
      expect(useAppStore.getState().getMyOrgRole('org-1')).toBeNull();
    });
  });
});
