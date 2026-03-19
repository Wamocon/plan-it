/**
 * Tests für src/lib/supabase/db.ts
 *
 * Strategie: White-box, Pfad- und Entscheidungsüberdeckung.
 * - Jede Funktion wird mit und ohne User (early-return-Pfad) getestet.
 * - Alle Mapping-Funktionen werden via loadAllData indirekt geprüft.
 * - Die Supabase-Query-Kette (from → insert/update/delete/select → eq → ...) 
 *   wird durch einen thenable Builder-Mock validiert.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Supabase-Client-Mock ─────────────────────────────────────
// Bare vi.fn() Referenzen – werden in beforeEach konfiguriert
const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  })),
}));

// Erstellt einen frischen, thenable Query-Builder für jeden Test
function makeBuilder(resolvedData: unknown = null): Record<string, unknown> {
  const b: Record<string, unknown> = {};
  b.select = vi.fn(() => b);
  b.insert = vi.fn(() => b);
  b.update = vi.fn(() => b);
  b.delete = vi.fn(() => b);
  b.eq = vi.fn(() => b);
  b.in = vi.fn(() => b);
  b.order = vi.fn(() => b);
  b.then = (
    onfulfilled: (v: unknown) => unknown,
    onrejected?: (r: unknown) => unknown
  ) => Promise.resolve({ data: resolvedData, error: null }).then(onfulfilled, onrejected);
  return b;
}

let currentBuilder: Record<string, unknown>;

// Globaler Reset vor jedem Test: verhindert Mock-Bleeding zwischen Tests
beforeEach(() => {
  // Nur die eigenen vi.fn()-Referenzen zurücksetzen (nicht den createClient-Mock)
  mockFrom.mockReset();
  mockGetUser.mockReset();
  currentBuilder = makeBuilder();
  mockFrom.mockReturnValue(currentBuilder);
  mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } } });
});

function getLastBuilder() { return currentBuilder; }

import {
  getUserId,
  loadAllData,
  dbAddProject,
  dbUpdateAnalysis,
  dbSetAiPending,
  dbSetAiFailReason,
  dbDeleteProject,
  dbAddTask,
  dbUpdateTask,
  dbDeleteTask,
  dbAddChatMessage,
  dbClearChat,
  dbTakeSnapshot,
  dbAddJiraConfig,
  dbUpdateJiraConfig,
  dbDeleteJiraConfig,
  dbAddAiConfig,
  dbUpdateAiConfig,
  dbSetActiveAiConfig,
  dbDeleteAiConfig,
  dbGetUserProfile,
  dbGetAllUserProfiles,
  dbUpdateUserRole,
  dbUpdateDisplayName,
} from '@/lib/supabase/db';

// ── Testdaten ────────────────────────────────────────────────

const sampleProject = {
  id: 'proj-1',
  data: { projectName: 'Test' },
  analysis: { risks: [], soll: [], waves: [], summary: '', source: 'fallback' as const },
  createdAt: '2024-01-01T00:00:00Z',
  aiPending: false,
  tasks: [],
  chatHistory: [],
  snapshots: [],
};

const sampleTask = {
  id: 'task-1',
  waveNumber: 1,
  waveTitle: 'Welle 1',
  item: 'CI/CD einrichten',
  status: 'open' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const sampleMessage = {
  id: 'msg-1',
  role: 'user' as const,
  content: 'Hallo',
  createdAt: '2024-01-01T00:00:00Z',
};

const sampleSnapshot = {
  id: 'snap-1',
  takenAt: '2024-01-01T00:00:00Z',
  score: 72,
  scoreLabel: 'Gut',
  riskCount: 3,
  highCount: 1,
  source: 'ai' as const,
};

const sampleJiraConfig = {
  id: 'jira-1',
  label: 'Firma XY',
  baseUrl: 'https://test.atlassian.net',
  email: 'user@test.de',
  apiToken: 'token-abc',
  projectKey: 'PROJ',
  issueType: 'Task',
  createdAt: '2024-01-01T00:00:00Z',
};

const sampleAiConfig = {
  id: 'ai-1',
  provider: 'gemini' as const,
  label: 'Gemini Pro',
  apiKey: 'api-key-xyz',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
};

// ── Hilfsfunktionen ──────────────────────────────────────────

function setNoUser() {
  mockGetUser.mockResolvedValueOnce({ data: { user: null } });
}

// ── getUserId ────────────────────────────────────────────────

describe('getUserId()', () => {
  it('gibt User-ID zurück wenn eingeloggt', async () => {
    const id = await getUserId();
    expect(id).toBe('test-user-id');
  });

  it('gibt null zurück wenn nicht eingeloggt', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const id = await getUserId();
    expect(id).toBeNull();
  });
});

// ── loadAllData ──────────────────────────────────────────────

describe('loadAllData()', () => {
  it('gibt null zurück wenn nicht eingeloggt', async () => {
    setNoUser();
    const result = await loadAllData();
    expect(result).toBeNull();
  });

  it('fragt alle 6 Tabellen ab', async () => {
    // makeBuilder pro from()-Aufruf mit leeren Daten
    mockFrom.mockImplementation(() => {
      const b: Record<string, unknown> = {};
      b.select = vi.fn(() => b);
      b.eq = vi.fn(() => b);
      b.order = vi.fn(() => b);
      b.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve);
      return b;
    });

    await loadAllData();
    const tables = mockFrom.mock.calls.map(c => c[0]);
    expect(tables).toContain('projects');
    expect(tables).toContain('tasks');
    expect(tables).toContain('chat_messages');
    expect(tables).toContain('analysis_snapshots');
    expect(tables).toContain('jira_configs');
    expect(tables).toContain('ai_configs');
  });

  it('mapped Projekt-Rows korrekt auf Project-Objekte', async () => {
    const projectRow = {
      id: 'proj-1',
      wizard_data: { projectName: 'X' },
      analysis: { risks: [], soll: [], waves: [], summary: '', source: 'fallback' },
      created_at: '2024-01-01T00:00:00Z',
      ai_pending: false,
      ai_fail_reason: null,
    };

    mockFrom.mockImplementation((table: string) => {
      const data = table === 'projects' ? [projectRow] : [];
      const b: Record<string, unknown> = {};
      b.select = vi.fn(() => b);
      b.eq = vi.fn(() => b);
      b.order = vi.fn(() => b);
      b.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data, error: null }).then(resolve);
      return b;
    });

    const result = await loadAllData();
    expect(result?.projects).toHaveLength(1);
    expect(result?.projects[0].id).toBe('proj-1');
    expect(result?.projects[0].data).toEqual({ projectName: 'X' });
  });

  it('verknüpft Tasks korrekt mit Projekten', async () => {
    const projectRow = { id: 'proj-1', wizard_data: {}, analysis: { risks: [], soll: [], waves: [], summary: '', source: 'fallback' }, created_at: '2024-01-01T00:00:00Z', ai_pending: false, ai_fail_reason: null };
    const taskRow = { id: 'task-1', project_id: 'proj-1', wave_number: 1, wave_title: 'W1', item: 'Item', status: 'open', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' };

    mockFrom.mockImplementation((table: string) => {
      const dataMap: Record<string, unknown[]> = { projects: [projectRow], tasks: [taskRow] };
      const b: Record<string, unknown> = {};
      b.select = vi.fn(() => b);
      b.eq = vi.fn(() => b);
      b.order = vi.fn(() => b);
      b.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: dataMap[table] ?? [], error: null }).then(resolve);
      return b;
    });

    const result = await loadAllData();
    expect(result?.projects[0].tasks).toHaveLength(1);
    expect(result?.projects[0].tasks![0].item).toBe('Item');
  });

  it('gibt leere Arrays für jiraConfigs und aiConfigs zurück wenn keine vorhanden', async () => {
    mockFrom.mockImplementation(() => {
      const b: Record<string, unknown> = {};
      b.select = vi.fn(() => b);
      b.eq = vi.fn(() => b);
      b.order = vi.fn(() => b);
      b.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve);
      return b;
    });

    const result = await loadAllData();
    expect(result?.jiraConfigs).toEqual([]);
    expect(result?.aiConfigs).toEqual([]);
  });
});

// ── dbAddProject ─────────────────────────────────────────────

describe('dbAddProject()', () => {
  beforeEach(() => { mockFrom.mockClear(); });

  it('ruft projects.insert() mit korrekten Feldern auf', async () => {
    await dbAddProject(sampleProject);
    expect(mockFrom).toHaveBeenCalledWith('projects');
    const builder = getLastBuilder();
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'proj-1', user_id: 'test-user-id' })
    );
  });

  it('bricht ab wenn kein User eingeloggt', async () => {
    setNoUser();
    await dbAddProject(sampleProject);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── dbUpdateAnalysis ─────────────────────────────────────────

describe('dbUpdateAnalysis()', () => {

  it('aktualisiert projects-Tabelle', async () => {
    await dbUpdateAnalysis('proj-1', sampleProject.analysis, null);
    expect(mockFrom).toHaveBeenCalledWith('projects');
  });

  it('fügt Snapshot ein wenn vorhanden', async () => {
    await dbUpdateAnalysis('proj-1', sampleProject.analysis, sampleSnapshot);
    const tables = mockFrom.mock.calls.map(c => c[0]);
    expect(tables).toContain('analysis_snapshots');
  });

  it('fügt keinen Snapshot ein wenn null', async () => {
    await dbUpdateAnalysis('proj-1', sampleProject.analysis, null);
    const tables = mockFrom.mock.calls.map(c => c[0]);
    expect(tables).not.toContain('analysis_snapshots');
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbUpdateAnalysis('proj-1', sampleProject.analysis, null);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── dbSetAiPending ────────────────────────────────────────────

describe('dbSetAiPending()', () => {
  it('aktualisiert ai_pending auf true', async () => {
    await dbSetAiPending('proj-1', true);
    const builder = getLastBuilder();
    expect(builder.update).toHaveBeenCalledWith({ ai_pending: true });
  });

  it('aktualisiert ai_pending auf false', async () => {
    await dbSetAiPending('proj-1', false);
    const builder = getLastBuilder();
    expect(builder.update).toHaveBeenCalledWith({ ai_pending: false });
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbSetAiPending('proj-1', true);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── dbSetAiFailReason ─────────────────────────────────────────

describe('dbSetAiFailReason()', () => {
  it('setzt ai_fail_reason=limit und ai_pending=false', async () => {
    await dbSetAiFailReason('proj-1', 'limit');
    const builder = getLastBuilder();
    expect(builder.update).toHaveBeenCalledWith({ ai_fail_reason: 'limit', ai_pending: false });
  });

  it('setzt ai_fail_reason=error', async () => {
    await dbSetAiFailReason('proj-1', 'error');
    const builder = getLastBuilder();
    expect(builder.update).toHaveBeenCalledWith({ ai_fail_reason: 'error', ai_pending: false });
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbSetAiFailReason('proj-1', 'error');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── dbDeleteProject ───────────────────────────────────────────

describe('dbDeleteProject()', () => {
  it('ruft projects.delete() auf', async () => {
    await dbDeleteProject('proj-1');
    expect(mockFrom).toHaveBeenCalledWith('projects');
    const builder = getLastBuilder();
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'proj-1');
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbDeleteProject('proj-1');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── dbAddTask ─────────────────────────────────────────────────

describe('dbAddTask()', () => {
  it('ruft tasks.insert() mit korrekten Feldern auf', async () => {
    await dbAddTask(sampleTask, 'proj-1');
    expect(mockFrom).toHaveBeenCalledWith('tasks');
    const builder = getLastBuilder();
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'task-1', project_id: 'proj-1', wave_number: 1 })
    );
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbAddTask(sampleTask, 'proj-1');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── dbUpdateTask ──────────────────────────────────────────────

describe('dbUpdateTask()', () => {
  it('mappt status ins DB-Feld', async () => {
    await dbUpdateTask('task-1', { status: 'done' });
    const builder = getLastBuilder();
    const updateArg = (builder.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArg.status).toBe('done');
  });

  it('mappt note ins DB-Feld', async () => {
    await dbUpdateTask('task-1', { note: 'Meine Notiz' });
    const builder = getLastBuilder();
    const updateArg = (builder.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArg.note).toBe('Meine Notiz');
  });

  it('mappt jiraIssueKey → jira_issue_key', async () => {
    await dbUpdateTask('task-1', { jiraIssueKey: 'PROJ-42', jiraIssueUrl: 'https://test.atlassian.net/PROJ-42', jiraConfigId: 'cfg-1' });
    const builder = getLastBuilder();
    const updateArg = (builder.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArg.jira_issue_key).toBe('PROJ-42');
    expect(updateArg.jira_issue_url).toBe('https://test.atlassian.net/PROJ-42');
    expect(updateArg.jira_config_id).toBe('cfg-1');
  });

  it('ignoriert undefinierte Felder (kein Überschreiben mit undefined)', async () => {
    await dbUpdateTask('task-1', { status: 'in-progress' });
    const builder = getLastBuilder();
    const updateArg = (builder.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArg.note).toBeUndefined();
    expect(updateArg.jira_issue_key).toBeUndefined();
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbUpdateTask('task-1', { status: 'done' });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── dbDeleteTask ──────────────────────────────────────────────

describe('dbDeleteTask()', () => {
  it('ruft tasks.delete() mit task-ID auf', async () => {
    await dbDeleteTask('task-1');
    expect(mockFrom).toHaveBeenCalledWith('tasks');
    const builder = getLastBuilder();
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'task-1');
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbDeleteTask('task-1');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── dbAddChatMessage / dbClearChat ────────────────────────────

describe('dbAddChatMessage()', () => {
  it('ruft chat_messages.insert() auf', async () => {
    await dbAddChatMessage(sampleMessage, 'proj-1');
    expect(mockFrom).toHaveBeenCalledWith('chat_messages');
    const builder = getLastBuilder();
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'msg-1', role: 'user', content: 'Hallo', project_id: 'proj-1' })
    );
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbAddChatMessage(sampleMessage, 'proj-1');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('dbClearChat()', () => {
  it('ruft chat_messages.delete() mit project_id auf', async () => {
    await dbClearChat('proj-1');
    expect(mockFrom).toHaveBeenCalledWith('chat_messages');
    const builder = getLastBuilder();
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('project_id', 'proj-1');
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbClearChat('proj-1');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── dbTakeSnapshot ────────────────────────────────────────────

describe('dbTakeSnapshot()', () => {
  it('fügt Snapshot in analysis_snapshots ein', async () => {
    await dbTakeSnapshot(sampleSnapshot, 'proj-1');
    expect(mockFrom).toHaveBeenCalledWith('analysis_snapshots');
    const builder = getLastBuilder();
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'snap-1', score: 72, risk_count: 3, source: 'ai' })
    );
  });

  it('behandelt score undefined als null', async () => {
    await dbTakeSnapshot({ ...sampleSnapshot, score: undefined, scoreLabel: undefined }, 'proj-1');
    const builder = getLastBuilder();
    const insertArg = (builder.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.score).toBeNull();
    expect(insertArg.score_label).toBeNull();
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbTakeSnapshot(sampleSnapshot, 'proj-1');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── dbAddJiraConfig / dbUpdateJiraConfig / dbDeleteJiraConfig ─

describe('dbAddJiraConfig()', () => {
  it('ruft jira_configs.insert() mit Snake-Case-Feldern auf', async () => {
    await dbAddJiraConfig(sampleJiraConfig);
    expect(mockFrom).toHaveBeenCalledWith('jira_configs');
    const builder = getLastBuilder();
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ base_url: 'https://test.atlassian.net', project_key: 'PROJ', issue_type: 'Task' })
    );
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbAddJiraConfig(sampleJiraConfig);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('dbUpdateJiraConfig()', () => {
  it('mappt Felder auf Snake-Case', async () => {
    await dbUpdateJiraConfig('jira-1', { baseUrl: 'https://new.atlassian.net', projectKey: 'NEW' });
    const builder = getLastBuilder();
    const updateArg = (builder.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArg.base_url).toBe('https://new.atlassian.net');
    expect(updateArg.project_key).toBe('NEW');
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbUpdateJiraConfig('jira-1', { label: 'X' });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('dbDeleteJiraConfig()', () => {
  it('ruft jira_configs.delete() auf', async () => {
    await dbDeleteJiraConfig('jira-1');
    expect(mockFrom).toHaveBeenCalledWith('jira_configs');
    const builder = getLastBuilder();
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'jira-1');
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbDeleteJiraConfig('jira-1');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── dbAddAiConfig / dbUpdateAiConfig / dbSetActiveAiConfig / dbDeleteAiConfig ─

describe('dbAddAiConfig()', () => {
  it('ruft ai_configs.insert() mit is_active und api_key auf', async () => {
    await dbAddAiConfig(sampleAiConfig);
    expect(mockFrom).toHaveBeenCalledWith('ai_configs');
    const builder = getLastBuilder();
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ api_key: 'api-key-xyz', is_active: true, provider: 'gemini' })
    );
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbAddAiConfig(sampleAiConfig);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('dbUpdateAiConfig()', () => {
  it('mappt apiKey → api_key', async () => {
    await dbUpdateAiConfig('ai-1', { apiKey: 'new-key' });
    const builder = getLastBuilder();
    const updateArg = (builder.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArg.api_key).toBe('new-key');
  });

  it('mappt isActive → is_active', async () => {
    await dbUpdateAiConfig('ai-1', { isActive: false });
    const builder = getLastBuilder();
    const updateArg = (builder.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArg.is_active).toBe(false);
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbUpdateAiConfig('ai-1', { label: 'X' });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('dbSetActiveAiConfig()', () => {
  it('deaktiviert zuerst alle, dann aktiviert den gewählten', async () => {
    // Jeder from()-Aufruf bekommt einen eigenen Builder
    const builders: Record<string, unknown>[] = [];
    mockFrom.mockImplementation(() => {
      const b = makeBuilder();
      builders.push(b);
      return b;
    });

    await dbSetActiveAiConfig('ai-1');
    expect(builders.length).toBeGreaterThanOrEqual(2);
    // Erster Aufruf: alle deaktivieren
    expect((builders[0].update as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({ is_active: false });
    // Zweiter Aufruf: aktiven setzen
    expect((builders[1].update as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({ is_active: true });
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbSetActiveAiConfig('ai-1');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('dbDeleteAiConfig()', () => {
  it('löscht den Config-Eintrag', async () => {
    await dbDeleteAiConfig('ai-1', null);
    expect(mockFrom).toHaveBeenCalledWith('ai_configs');
    expect(currentBuilder.delete).toHaveBeenCalled();
  });

  it('aktiviert newActiveId wenn angegeben', async () => {
    const builders: Record<string, unknown>[] = [];
    mockFrom.mockImplementation(() => {
      const b = makeBuilder();
      builders.push(b);
      return b;
    });
    await dbDeleteAiConfig('ai-1', 'ai-2');
    expect(builders.length).toBe(2);
    expect((builders[1].update as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({ is_active: true });
    expect((builders[1].eq as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('id', 'ai-2');
  });

  it('kein zweiter from()-Aufruf wenn newActiveId null', async () => {
    await dbDeleteAiConfig('ai-1', null);
    expect(mockFrom.mock.calls.length).toBe(1);
  });

  it('bricht ab wenn kein User', async () => {
    setNoUser();
    await dbDeleteAiConfig('ai-1', null);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── dbGetUserProfile ─────────────────────────────────────────

describe('dbGetUserProfile()', () => {
  it('gibt null zurück wenn nicht eingeloggt', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await dbGetUserProfile();
    expect(result).toBeNull();
  });

  it('fragt user_profiles mit .single() ab', async () => {
    // User mit E-Mail für diesen Test
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'test-user-id', email: 'dev@test.de' } } });

    const singleBuilder = makeBuilder();
    (singleBuilder as Record<string, unknown>).single = vi.fn().mockResolvedValue({
      data: {
        id: 'profile-1',
        user_id: 'test-user-id',
        role: 'developer',
        display_name: 'Dev User',
        created_at: '2024-01-01T00:00:00Z',
      },
      error: null,
    });
    mockFrom.mockReturnValue(singleBuilder);

    const result = await dbGetUserProfile();
    expect(mockFrom).toHaveBeenCalledWith('user_profiles');
    expect(result?.role).toBe('developer');
    expect(result?.displayName).toBe('Dev User');
    expect(result?.email).toBe('dev@test.de');
  });

  it('gibt null zurück wenn kein Profil in DB', async () => {
    const singleBuilder = makeBuilder();
    (singleBuilder as Record<string, unknown>).single = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue(singleBuilder);

    const result = await dbGetUserProfile();
    expect(result).toBeNull();
  });
});

// ── dbGetAllUserProfiles ──────────────────────────────────────

describe('dbGetAllUserProfiles()', () => {
  it('fragt alle user_profiles geordnet ab', async () => {
    await dbGetAllUserProfiles();
    expect(mockFrom).toHaveBeenCalledWith('user_profiles');
    const builder = getLastBuilder();
    expect(builder.select).toHaveBeenCalledWith('*');
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  it('gibt leeres Array zurück wenn keine Profile vorhanden', async () => {
    currentBuilder = makeBuilder([]);
    mockFrom.mockReturnValue(currentBuilder);
    const result = await dbGetAllUserProfiles();
    expect(result).toEqual([]);
  });

  it('mapped Roh-Rows korrekt auf UserProfile-Objekte', async () => {
    const rawRow = {
      id: 'p1',
      user_id: 'u1',
      role: 'admin',
      display_name: 'Admin User',
      created_at: '2024-01-01T00:00:00Z',
    };
    currentBuilder = makeBuilder([rawRow]);
    mockFrom.mockReturnValue(currentBuilder);

    const result = await dbGetAllUserProfiles();
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('u1');
    expect(result[0].role).toBe('admin');
    expect(result[0].displayName).toBe('Admin User');
  });
});

// ── dbUpdateUserRole ──────────────────────────────────────────

describe('dbUpdateUserRole()', () => {
  it('aktualisiert die Rolle in user_profiles', async () => {
    await dbUpdateUserRole('u1', 'it-architect');
    expect(mockFrom).toHaveBeenCalledWith('user_profiles');
    const builder = getLastBuilder();
    expect(builder.update).toHaveBeenCalledWith({ role: 'it-architect' });
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });
});

// ── dbUpdateDisplayName ───────────────────────────────────────

describe('dbUpdateDisplayName()', () => {
  it('aktualisiert display_name im eigenen Profil', async () => {
    await dbUpdateDisplayName('Max Mustermann');
    expect(mockFrom).toHaveBeenCalledWith('user_profiles');
    const builder = getLastBuilder();
    expect(builder.update).toHaveBeenCalledWith({ display_name: 'Max Mustermann' });
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
  });

  it('bricht ab wenn kein User eingeloggt', async () => {
    setNoUser();
    await dbUpdateDisplayName('Test');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
