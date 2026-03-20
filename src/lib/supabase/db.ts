/**
 * Supabase-Datenbankschicht für den appStore.
 * Alle Funktionen spiegeln die Store-Aktionen, persistieren aber in Supabase.
 * Der Zustand-Store ruft diese Funktionen zusätzlich zum lokalen set() auf.
 */
import { createClient } from '@/lib/supabase/client';
import {
  Project, WizardData, AnalysisResult, Task, TaskStatus,
  ChatMessage, AnalysisSnapshot, JiraConfig, AiConfig,
  UserProfile, UserRole,
  Organization, OrgMember, OrgRole,
} from '@/types';

// ── Hilfsfunktionen: DB-Rows ↔ App-Typen ────────────────────

function projectToRow(project: Project, userId: string) {
  return {
    id: project.id,
    user_id: userId,
    wizard_data: project.data,
    analysis: project.analysis,
    ai_pending: project.aiPending ?? false,
    ai_fail_reason: project.aiFailReason ?? null,
  };
}

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    data: row.wizard_data as WizardData,
    analysis: row.analysis as AnalysisResult,
    createdAt: row.created_at as string,
    aiPending: row.ai_pending as boolean,
    aiFailReason: row.ai_fail_reason as 'limit' | 'error' | undefined,
    tasks: [],
    chatHistory: [],
    snapshots: [],
    orgId: (row.org_id as string) || undefined,
  };
}

function taskToRow(task: Task, projectId: string, userId: string) {
  return {
    id: task.id,
    project_id: projectId,
    user_id: userId,
    wave_number: task.waveNumber,
    wave_title: task.waveTitle,
    item: task.item,
    status: task.status,
    note: task.note ?? null,
    jira_issue_key: task.jiraIssueKey ?? null,
    jira_issue_url: task.jiraIssueUrl ?? null,
    jira_config_id: task.jiraConfigId ?? null,
  };
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    waveNumber: row.wave_number as number,
    waveTitle: row.wave_title as string,
    item: row.item as string,
    status: row.status as TaskStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    note: row.note as string | undefined,
    jiraIssueKey: row.jira_issue_key as string | undefined,
    jiraIssueUrl: row.jira_issue_url as string | undefined,
    jiraConfigId: row.jira_config_id as string | undefined,
  };
}

function jiraConfigToRow(config: JiraConfig, userId: string) {
  return {
    id: config.id,
    user_id: userId,
    label: config.label,
    base_url: config.baseUrl,
    email: config.email,
    api_token: config.apiToken,
    project_key: config.projectKey,
    issue_type: config.issueType,
  };
}

function rowToJiraConfig(row: Record<string, unknown>): JiraConfig {
  return {
    id: row.id as string,
    label: row.label as string,
    baseUrl: row.base_url as string,
    email: row.email as string,
    apiToken: row.api_token as string,
    projectKey: row.project_key as string,
    issueType: row.issue_type as string,
    createdAt: row.created_at as string,
  };
}

function aiConfigToRow(config: AiConfig, userId: string) {
  return {
    id: config.id,
    user_id: userId,
    provider: config.provider,
    label: config.label,
    api_key: config.apiKey,
    is_active: config.isActive,
  };
}

function rowToAiConfig(row: Record<string, unknown>): AiConfig {
  return {
    id: row.id as string,
    provider: row.provider as 'gemini' | 'openai',
    label: row.label as string,
    apiKey: row.api_key as string,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
  };
}

// ── Öffentliche API ──────────────────────────────────────────

/** Gibt null zurück wenn Supabase nicht konfiguriert ist. */
function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// Lädt alle Daten des eingeloggten Users aus Supabase
export async function loadAllData() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return null;

  const [
    { data: projectRows },
    { data: taskRows },
    { data: chatRows },
    { data: snapshotRows },
    { data: jiraRows },
    { data: aiRows },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('tasks').select('*').eq('user_id', userId),
    supabase.from('chat_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('analysis_snapshots').select('*').eq('user_id', userId),
    supabase.from('jira_configs').select('*').eq('user_id', userId),
    supabase.from('ai_configs').select('*').eq('user_id', userId),
  ]);

  const projects = (projectRows ?? []).map(rowToProject).map(project => ({
    ...project,
    tasks: (taskRows ?? []).filter(t => t.project_id === project.id).map(rowToTask),
    chatHistory: (chatRows ?? []).filter(c => c.project_id === project.id).map((r: Record<string, unknown>): ChatMessage => ({
      id: r.id as string,
      role: r.role as 'user' | 'assistant',
      content: r.content as string,
      createdAt: r.created_at as string,
    })),
    snapshots: (snapshotRows ?? []).filter(s => s.project_id === project.id).map((r: Record<string, unknown>): AnalysisSnapshot => ({
      id: r.id as string,
      takenAt: r.taken_at as string,
      score: r.score as number | undefined,
      scoreLabel: r.score_label as string | undefined,
      riskCount: r.risk_count as number,
      highCount: r.high_count as number,
      source: r.source as 'ai' | 'fallback',
    })),
  }));

  return {
    projects,
    jiraConfigs: (jiraRows ?? []).map(rowToJiraConfig),
    aiConfigs: (aiRows ?? []).map(rowToAiConfig),
  };
}

// ── Projects ────────────────────────────────────────────────

export async function dbAddProject(project: Project) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('projects').insert(projectToRow(project, userId));
}

export async function dbUpdateAnalysis(id: string, analysis: AnalysisResult, snapshot: AnalysisSnapshot | null) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('projects').update({ analysis, ai_pending: false }).eq('id', id).eq('user_id', userId);
  if (snapshot) {
    await supabase.from('analysis_snapshots').insert({
      id: snapshot.id,
      project_id: id,
      user_id: userId,
      score: snapshot.score ?? null,
      score_label: snapshot.scoreLabel ?? null,
      risk_count: snapshot.riskCount,
      high_count: snapshot.highCount,
      source: snapshot.source,
      taken_at: snapshot.takenAt,
    });
  }
}

export async function dbSetAiPending(id: string, pending: boolean) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('projects').update({ ai_pending: pending }).eq('id', id).eq('user_id', userId);
}

export async function dbSetAiFailReason(id: string, reason: 'limit' | 'error') {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('projects').update({ ai_fail_reason: reason, ai_pending: false }).eq('id', id).eq('user_id', userId);
}

export async function dbDeleteProject(id: string) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('projects').delete().eq('id', id).eq('user_id', userId);
}

// ── Tasks ────────────────────────────────────────────────────

export async function dbAddTask(task: Task, projectId: string) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('tasks').insert(taskToRow(task, projectId, userId));
}

export async function dbUpdateTask(taskId: string, patch: Partial<Task>) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.note !== undefined) dbPatch.note = patch.note;
  if (patch.jiraIssueKey !== undefined) dbPatch.jira_issue_key = patch.jiraIssueKey;
  if (patch.jiraIssueUrl !== undefined) dbPatch.jira_issue_url = patch.jiraIssueUrl;
  if (patch.jiraConfigId !== undefined) dbPatch.jira_config_id = patch.jiraConfigId;
  await supabase.from('tasks').update(dbPatch).eq('id', taskId).eq('user_id', userId);
}

export async function dbDeleteTask(taskId: string) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
}

// ── Chat ────────────────────────────────────────────────────

export async function dbAddChatMessage(message: ChatMessage, projectId: string) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('chat_messages').insert({
    id: message.id,
    project_id: projectId,
    user_id: userId,
    role: message.role,
    content: message.content,
    created_at: message.createdAt,
  });
}

export async function dbClearChat(projectId: string) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('chat_messages').delete().eq('project_id', projectId).eq('user_id', userId);
}

// ── Snapshots ────────────────────────────────────────────────

export async function dbTakeSnapshot(snapshot: AnalysisSnapshot, projectId: string) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('analysis_snapshots').insert({
    id: snapshot.id,
    project_id: projectId,
    user_id: userId,
    score: snapshot.score ?? null,
    score_label: snapshot.scoreLabel ?? null,
    risk_count: snapshot.riskCount,
    high_count: snapshot.highCount,
    source: snapshot.source,
    taken_at: snapshot.takenAt,
  });
}

// ── Jira ────────────────────────────────────────────────────

export async function dbAddJiraConfig(config: JiraConfig) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('jira_configs').insert(jiraConfigToRow(config, userId));
}

export async function dbUpdateJiraConfig(id: string, patch: Partial<JiraConfig>) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  const dbPatch: Record<string, unknown> = {};
  if (patch.label) dbPatch.label = patch.label;
  if (patch.baseUrl) dbPatch.base_url = patch.baseUrl;
  if (patch.email) dbPatch.email = patch.email;
  if (patch.apiToken) dbPatch.api_token = patch.apiToken;
  if (patch.projectKey) dbPatch.project_key = patch.projectKey;
  if (patch.issueType) dbPatch.issue_type = patch.issueType;
  await supabase.from('jira_configs').update(dbPatch).eq('id', id).eq('user_id', userId);
}

export async function dbDeleteJiraConfig(id: string) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('jira_configs').delete().eq('id', id).eq('user_id', userId);
}

// ── AI Configs ───────────────────────────────────────────────

export async function dbAddAiConfig(config: AiConfig) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('ai_configs').insert(aiConfigToRow(config, userId));
}

export async function dbUpdateAiConfig(id: string, patch: Partial<AiConfig>) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  const dbPatch: Record<string, unknown> = {};
  if (patch.label !== undefined) dbPatch.label = patch.label;
  if (patch.apiKey !== undefined) dbPatch.api_key = patch.apiKey;
  if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;
  if (patch.provider !== undefined) dbPatch.provider = patch.provider;
  await supabase.from('ai_configs').update(dbPatch).eq('id', id).eq('user_id', userId);
}

export async function dbSetActiveAiConfig(activeId: string) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  // Alle deaktivieren, dann den gewählten aktivieren
  await supabase.from('ai_configs').update({ is_active: false }).eq('user_id', userId);
  await supabase.from('ai_configs').update({ is_active: true }).eq('id', activeId).eq('user_id', userId);
}

export async function dbDeleteAiConfig(id: string, newActiveId: string | null) {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('ai_configs').delete().eq('id', id).eq('user_id', userId);
  if (newActiveId) {
    await supabase.from('ai_configs').update({ is_active: true }).eq('id', newActiveId).eq('user_id', userId);
  }
}

// ── User Profiles / Rollen ───────────────────────────────────

function rowToUserProfile(row: Record<string, unknown>): UserProfile {
  return {
    id:          row.id as string,
    userId:      row.user_id as string,
    email:       (row.email as string) ?? '',
    role:        row.role as UserRole,
    displayName: row.display_name as string | undefined,
    createdAt:   row.created_at as string,
  };
}

/** Eigenes Profil laden (inkl. E-Mail aus auth.users via JOIN). */
export async function dbGetUserProfile(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  if (!data) return null;
  return rowToUserProfile({ ...data, email: user.email ?? '' });
}

/** Alle Nutzerprofile laden – nur für Admins. */
export async function dbGetAllUserProfiles(): Promise<UserProfile[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: true });
  return (data ?? []).map(r => rowToUserProfile(r as Record<string, unknown>));
}

/** Rolle eines Nutzers ändern – nur für Admins. */
export async function dbUpdateUserRole(userId: string, role: UserRole): Promise<void> {
  const supabase = createClient();
  await supabase
    .from('user_profiles')
    .update({ role })
    .eq('user_id', userId);
}

/** Anzeigenamen des eigenen Profils aktualisieren. */
export async function dbUpdateDisplayName(displayName: string): Promise<void> {
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase
    .from('user_profiles')
    .update({ display_name: displayName })
    .eq('user_id', userId);
}

// ── Organisations-Modul ──────────────────────────────────────

function rowToOrganization(row: Record<string, unknown>): Organization {
  return {
    id:          row.id as string,
    name:        row.name as string,
    slug:        row.slug as string,
    description: row.description as string | undefined,
    createdBy:   row.created_by as string,
    createdAt:   row.created_at as string,
  };
}

function rowToOrgMember(row: Record<string, unknown>): OrgMember {
  return {
    id:          row.id as string,
    orgId:       row.org_id as string,
    userId:      row.user_id as string,
    role:        row.role as OrgRole,
    createdAt:   row.created_at as string,
    displayName: row.display_name as string | undefined,
    email:       row.email as string | undefined,
  };
}

/** Alle Organisationen laden, in denen der User Mitglied ist. */
export async function dbGetMyOrganizations(): Promise<Organization[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return [];
  // Zuerst Org-IDs aus org_members laden (vermeidet rekursive RLS-Probleme)
  const { data: memberRows } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId);
  if (!memberRows || memberRows.length === 0) return [];
  const orgIds = memberRows.map((r: Record<string, unknown>) => r.org_id as string);
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .in('id', orgIds)
    .order('created_at', { ascending: false });
  return (data ?? []).map(r => rowToOrganization(r as Record<string, unknown>));
}

/** Eine Organisation anlegen und den Ersteller als Owner eintragen. */
export async function dbCreateOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'createdBy'>): Promise<Organization | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return null;

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const { error } = await supabase
    .from('organizations')
    .insert({ id, name: org.name, slug: org.slug, description: org.description ?? null, created_by: userId, created_at: createdAt });
  if (error) return null;

  // Ersteller als owner eintragen
  const { error: memberError } = await supabase
    .from('org_members')
    .insert({ org_id: id, user_id: userId, role: 'owner' });
  if (memberError) return null;

  // Objekt aus lokalen Daten aufbauen – kein SELECT nötig (vermeidet RLS-Timing-Problem)
  return { id, name: org.name, slug: org.slug, description: org.description, createdBy: userId, createdAt };
}

/** Organisation aktualisieren (nur Owner/Admin). */
export async function dbUpdateOrganization(id: string, patch: Partial<Pick<Organization, 'name' | 'description'>>): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  await supabase.from('organizations').update(dbPatch).eq('id', id);
}

/** Organisation löschen (nur Owner). */
export async function dbDeleteOrganization(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from('organizations').delete().eq('id', id);
}

/** Alle Mitglieder einer Organisation laden. */
export async function dbGetOrgMembers(orgId: string): Promise<OrgMember[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from('org_members')
    .select('*, user_profiles(display_name)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true });
  if (!data) return [];
  return data.map(r => {
    const row = r as Record<string, unknown>;
    const profile = row.user_profiles as Record<string, unknown> | null;
    return rowToOrgMember({
      ...row,
      display_name: profile?.display_name ?? null,
      email: null, // E-Mail nicht via REST-Join verfügbar (auth.users ist geschützt)
    });
  });
}

/** Mitglied zur Organisation hinzufügen. */
export async function dbAddOrgMember(orgId: string, userId: string, role: OrgRole = 'member'): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from('org_members').insert({ org_id: orgId, user_id: userId, role });
}

/** Mitglieds-Rolle ändern. */
export async function dbUpdateOrgMemberRole(orgId: string, userId: string, role: OrgRole): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from('org_members').update({ role }).eq('org_id', orgId).eq('user_id', userId);
}

/** Mitglied aus Organisation entfernen. */
export async function dbRemoveOrgMember(orgId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from('org_members').delete().eq('org_id', orgId).eq('user_id', userId);
}

/** Projekte einer Organisation laden. */
export async function dbGetOrgProjects(orgId: string): Promise<Project[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(r => rowToProject(r as Record<string, unknown>));
}

/** Ein bestehendes Projekt einer Organisation zuordnen. */
export async function dbAssignProjectToOrg(projectId: string, orgId: string | null): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from('projects').update({ org_id: orgId }).eq('id', projectId).eq('user_id', userId);
}

