/**
 * Appwrite database layer – drop-in replacement for src/lib/supabase/db.ts
 * Stores are identical; only the persistence backend changes.
 */
import { Databases, Account, ID, Query } from 'node-appwrite';
import { getServerClient, DATABASE_ID } from './client';
import {
  Project, WizardData, AnalysisResult, Task, TaskStatus,
  ChatMessage, AnalysisSnapshot, JiraConfig, AiConfig,
} from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function db(): Databases {
  return new Databases(getServerClient());
}

function account(): Account {
  return new Account(getServerClient());
}

/** Returns the current Appwrite user ID, or a fixed local user ID when running without auth */
export async function getUserId(): Promise<string | null> {
  try {
    const acc = account();
    const user = await acc.get();
    return user.$id ?? null;
  } catch {
    // No authenticated session — use a stable local-dev user ID so data persists
    return 'local-dev-user';
  }
}

// ── Row converters ────────────────────────────────────────────────────────────

function projectToDoc(project: Project, userId: string) {
  return {
    user_id:        userId,
    wizard_data:    JSON.stringify(project.data),
    analysis:       JSON.stringify(project.analysis),
    ai_pending:     project.aiPending ?? false,
    ai_fail_reason: project.aiFailReason ?? null,
  };
}

function docToProject(doc: Record<string, unknown>): Project {
  return {
    id:           doc.$id as string,
    data:         JSON.parse(doc.wizard_data as string) as WizardData,
    analysis:     JSON.parse(doc.analysis as string) as AnalysisResult,
    createdAt:    doc.$createdAt as string,
    aiPending:    doc.ai_pending as boolean,
    aiFailReason: doc.ai_fail_reason as 'limit' | 'error' | undefined,
    tasks:        [],
    chatHistory:  [],
    snapshots:    [],
  };
}

function taskToDoc(task: Task, projectId: string, userId: string) {
  return {
    project_id:    projectId,
    user_id:       userId,
    wave_number:   task.waveNumber,
    wave_title:    task.waveTitle,
    item:          task.item,
    status:        task.status,
    note:          task.note          ?? null,
    jira_issue_key:task.jiraIssueKey  ?? null,
    jira_issue_url:task.jiraIssueUrl  ?? null,
    jira_config_id:task.jiraConfigId  ?? null,
  };
}

function docToTask(doc: Record<string, unknown>): Task {
  return {
    id:           doc.$id as string,
    waveNumber:   doc.wave_number as number,
    waveTitle:    doc.wave_title  as string,
    item:         doc.item        as string,
    status:       doc.status      as TaskStatus,
    createdAt:    doc.$createdAt  as string,
    updatedAt:    doc.$updatedAt  as string,
    note:         doc.note          as string | undefined,
    jiraIssueKey: doc.jira_issue_key as string | undefined,
    jiraIssueUrl: doc.jira_issue_url as string | undefined,
    jiraConfigId: doc.jira_config_id as string | undefined,
  };
}

function jiraToDoc(c: JiraConfig, userId: string) {
  return {
    user_id:     userId,
    label:       c.label,
    base_url:    c.baseUrl,
    email:       c.email,
    api_token:   c.apiToken,
    project_key: c.projectKey,
    issue_type:  c.issueType,
  };
}

function docToJira(doc: Record<string, unknown>): JiraConfig {
  return {
    id:         doc.$id       as string,
    label:      doc.label     as string,
    baseUrl:    doc.base_url  as string,
    email:      doc.email     as string,
    apiToken:   doc.api_token as string,
    projectKey: doc.project_key as string,
    issueType:  doc.issue_type  as string,
    createdAt:  doc.$createdAt  as string,
  };
}

function aiToDoc(c: AiConfig, userId: string) {
  return {
    user_id:   userId,
    provider:  c.provider,
    label:     c.label,
    api_key:   c.apiKey,
    is_active: c.isActive,
  };
}

function docToAi(doc: Record<string, unknown>): AiConfig {
  return {
    id:        doc.$id      as string,
    provider:  doc.provider as 'gemini' | 'openai',
    label:     doc.label    as string,
    apiKey:    doc.api_key  as string,
    isActive:  doc.is_active as boolean,
    createdAt: doc.$createdAt as string,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function loadAllData() {
  const userId = await getUserId();
  if (!userId) return null;

  const d = db();
  const q = (col: string) =>
    d.listDocuments(DATABASE_ID, col, [Query.equal('user_id', userId), Query.limit(500)]);

  const [pRes, tRes, cRes, sRes, jRes, aRes] = await Promise.all([
    q('projects'), q('tasks'), q('chat_messages'),
    q('analysis_snapshots'), q('jira_configs'), q('ai_configs'),
  ]);

  const projectDocs = pRes.documents as unknown as Record<string, unknown>[];
  const taskDocs    = tRes.documents as unknown as Record<string, unknown>[];
  const chatDocs    = cRes.documents as unknown as Record<string, unknown>[];
  const snapDocs    = sRes.documents as unknown as Record<string, unknown>[];

  const projects = projectDocs.map(docToProject).map(p => ({
    ...p,
    tasks: taskDocs.filter(t => t.project_id === p.id).map(docToTask),
    chatHistory: chatDocs
      .filter(c => c.project_id === p.id)
      .map((r): ChatMessage => ({
        id:        r.$id      as string,
        role:      r.role     as 'user' | 'assistant',
        content:   r.content  as string,
        createdAt: r.$createdAt as string,
      })),
    snapshots: snapDocs
      .filter(s => s.project_id === p.id)
      .map((r): AnalysisSnapshot => ({
        id:         r.$id         as string,
        takenAt:    r.$createdAt  as string,
        score:      r.score       as number | undefined,
        scoreLabel: r.score_label as string | undefined,
        riskCount:  r.risk_count  as number,
        highCount:  r.high_count  as number,
        source:     r.source      as 'ai' | 'fallback',
      })),
  }));

  return {
    projects,
    jiraConfigs: (jRes.documents as unknown as Record<string, unknown>[]).map(docToJira),
    aiConfigs:   (aRes.documents as unknown as Record<string, unknown>[]).map(docToAi),
  };
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function dbAddProject(project: Project) {
  const userId = await getUserId();
  if (!userId) return;
  await db().createDocument(DATABASE_ID, 'projects', project.id, projectToDoc(project, userId));
}

export async function dbUpdateAnalysis(
  id: string,
  analysis: AnalysisResult,
  snapshot: AnalysisSnapshot | null,
) {
  const userId = await getUserId();
  if (!userId) return;
  await db().updateDocument(DATABASE_ID, 'projects', id, {
    analysis:   JSON.stringify(analysis),
    ai_pending: false,
  });
  if (snapshot) {
    await db().createDocument(DATABASE_ID, 'analysis_snapshots', snapshot.id, {
      project_id:  id,
      user_id:     userId,
      score:       snapshot.score    ?? null,
      score_label: snapshot.scoreLabel ?? null,
      risk_count:  snapshot.riskCount,
      high_count:  snapshot.highCount,
      source:      snapshot.source,
    });
  }
}

export async function dbSetAiPending(id: string, pending: boolean) {
  const userId = await getUserId();
  if (!userId) return;
  await db().updateDocument(DATABASE_ID, 'projects', id, { ai_pending: pending });
}

export async function dbSetAiFailReason(id: string, reason: 'limit' | 'error') {
  const userId = await getUserId();
  if (!userId) return;
  await db().updateDocument(DATABASE_ID, 'projects', id, { ai_fail_reason: reason, ai_pending: false });
}

export async function dbDeleteProject(id: string) {
  const userId = await getUserId();
  if (!userId) return;
  await db().deleteDocument(DATABASE_ID, 'projects', id);
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function dbAddTask(task: Task, projectId: string) {
  const userId = await getUserId();
  if (!userId) return;
  await db().createDocument(DATABASE_ID, 'tasks', task.id, taskToDoc(task, projectId, userId));
}

export async function dbUpdateTask(id: string, updates: Partial<Task>) {
  const userId = await getUserId();
  if (!userId) return;
  const patch: Record<string, unknown> = {};
  if (updates.status  !== undefined) patch.status = updates.status;
  if (updates.note    !== undefined) patch.note   = updates.note;
  if (updates.jiraIssueKey !== undefined) patch.jira_issue_key = updates.jiraIssueKey;
  if (updates.jiraIssueUrl !== undefined) patch.jira_issue_url = updates.jiraIssueUrl;
  if (updates.jiraConfigId !== undefined) patch.jira_config_id = updates.jiraConfigId;
  await db().updateDocument(DATABASE_ID, 'tasks', id, patch);
}

export async function dbDeleteTask(id: string) {
  const userId = await getUserId();
  if (!userId) return;
  await db().deleteDocument(DATABASE_ID, 'tasks', id);
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export async function dbAddChatMessage(msg: ChatMessage, projectId: string) {
  const userId = await getUserId();
  if (!userId) return;
  await db().createDocument(DATABASE_ID, 'chat_messages', msg.id, {
    project_id: projectId,
    user_id:    userId,
    role:       msg.role,
    content:    msg.content,
  });
}

export async function dbClearChat(projectId: string) {
  const userId = await getUserId();
  if (!userId) return;
  const res = await db().listDocuments(DATABASE_ID, 'chat_messages', [
    Query.equal('project_id', projectId),
    Query.equal('user_id', userId),
    Query.limit(500),
  ]);
  await Promise.all(res.documents.map(d => db().deleteDocument(DATABASE_ID, 'chat_messages', d.$id)));
}

// ── Snapshots ─────────────────────────────────────────────────────────────────

export async function dbTakeSnapshot(snapshot: AnalysisSnapshot, projectId: string) {
  const userId = await getUserId();
  if (!userId) return;
  await db().createDocument(DATABASE_ID, 'analysis_snapshots', snapshot.id, {
    project_id:  projectId,
    user_id:     userId,
    score:       snapshot.score    ?? null,
    score_label: snapshot.scoreLabel ?? null,
    risk_count:  snapshot.riskCount,
    high_count:  snapshot.highCount,
    source:      snapshot.source,
  });
}

// ── Jira Configs ──────────────────────────────────────────────────────────────

export async function dbAddJiraConfig(config: JiraConfig) {
  const userId = await getUserId();
  if (!userId) return;
  await db().createDocument(DATABASE_ID, 'jira_configs', config.id, jiraToDoc(config, userId));
}

export async function dbUpdateJiraConfig(id: string, updates: Partial<JiraConfig>) {
  const userId = await getUserId();
  if (!userId) return;
  const patch: Record<string, unknown> = {};
  if (updates.label      !== undefined) patch.label       = updates.label;
  if (updates.baseUrl    !== undefined) patch.base_url    = updates.baseUrl;
  if (updates.email      !== undefined) patch.email       = updates.email;
  if (updates.apiToken   !== undefined) patch.api_token   = updates.apiToken;
  if (updates.projectKey !== undefined) patch.project_key = updates.projectKey;
  if (updates.issueType  !== undefined) patch.issue_type  = updates.issueType;
  await db().updateDocument(DATABASE_ID, 'jira_configs', id, patch);
}

export async function dbDeleteJiraConfig(id: string) {
  const userId = await getUserId();
  if (!userId) return;
  await db().deleteDocument(DATABASE_ID, 'jira_configs', id);
}

// ── AI Configs ────────────────────────────────────────────────────────────────

export async function dbAddAiConfig(config: AiConfig) {
  const userId = await getUserId();
  if (!userId) return;
  await db().createDocument(DATABASE_ID, 'ai_configs', config.id, aiToDoc(config, userId));
}

export async function dbUpdateAiConfig(id: string, updates: Partial<AiConfig>) {
  const userId = await getUserId();
  if (!userId) return;
  const patch: Record<string, unknown> = {};
  if (updates.label    !== undefined) patch.label     = updates.label;
  if (updates.apiKey   !== undefined) patch.api_key   = updates.apiKey;
  if (updates.isActive !== undefined) patch.is_active = updates.isActive;
  await db().updateDocument(DATABASE_ID, 'ai_configs', id, patch);
}

export async function dbDeleteAiConfig(id: string, newActiveId?: string | null) {
  const userId = await getUserId();
  if (!userId) return;
  await db().deleteDocument(DATABASE_ID, 'ai_configs', id);
  if (newActiveId) {
    await db().updateDocument(DATABASE_ID, 'ai_configs', newActiveId, { is_active: true });
  }
}

export async function dbSetActiveAiConfig(id: string, _allIds?: string[]) {
  const userId = await getUserId();
  if (!userId) return;
  // Deactivate all
  const res = await db().listDocuments(DATABASE_ID, 'ai_configs', [
    Query.equal('user_id', userId), Query.limit(100),
  ]);
  await Promise.all(
    res.documents.map(d =>
      db().updateDocument(DATABASE_ID, 'ai_configs', d.$id, { is_active: d.$id === id }),
    ),
  );
}
