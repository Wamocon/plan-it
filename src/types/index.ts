// ── Rollen-Konzept ───────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'it-architect' | 'developer' | 'user';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  'admin':        'Administrator',
  'it-architect': 'IT-Architekt',
  'developer':    'Entwickler',
  'user':         'Benutzer',
};

/** Höherer Wert = mehr Rechte. Wird für hasMinRole()-Vergleiche genutzt. */
export const USER_ROLE_HIERARCHY: Record<UserRole, number> = {
  'admin':        4,
  'it-architect': 3,
  'developer':    2,
  'user':         1,
};

export interface UserProfile {
  id:           string;
  userId:       string;
  email:        string;
  role:         UserRole;
  displayName?: string;
  createdAt:    string;
}

// ── Allgemeine Typen ─────────────────────────────────────────────────────────
export type Severity = 'high' | 'medium' | 'low';
export interface Risk { title: string; severity: Severity; description: string; recommendation: string; }
export interface SollItem { area: string; target: string; }
export interface Wave { number: number; title: string; duration: string; items: string[]; }
export interface WizardData { [key: string]: string | undefined; }

// KI-Provider Konfiguration
export type AiProvider = 'gemini' | 'openai';
export interface AiConfig {
  id: string;
  provider: AiProvider;
  label: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
}
export const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI (GPT)',
};
export interface AnalysisResult { risks: Risk[]; soll: SollItem[]; waves: Wave[]; summary: string; source: 'ai' | 'fallback'; score?: number; scoreLabel?: string; }

// Maßnahmen-Tracker
export type TaskStatus = 'open' | 'in-progress' | 'done';
export interface Task {
  id: string;
  waveNumber: number;
  waveTitle: string;
  item: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  note?: string;
  jiraIssueKey?: string;   // z.B. "PROJ-42"
  jiraIssueUrl?: string;   // z.B. "https://company.atlassian.net/browse/PROJ-42"
  jiraConfigId?: string;   // Welche Jira-Instanz wurde verwendet
}

// Jira-Verbindung
export interface JiraConfig {
  id: string;
  label: string;           // Anzeigename, z.B. "Firma XY – Scrum Board"
  baseUrl: string;         // https://company.atlassian.net
  email: string;
  apiToken: string;        // Jira API Token
  projectKey: string;      // z.B. PROJ
  issueType: string;       // z.B. Task, Story, Bug
  createdAt: string;
}

// KI-Chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

// Zeitvergleich: gespeicherte Analyse-Snapshots
export interface AnalysisSnapshot {
  id: string;
  takenAt: string;
  score?: number;
  scoreLabel?: string;
  riskCount: number;
  highCount: number;
  source: 'ai' | 'fallback';
}

export interface Project {
  id: string;
  data: WizardData;
  analysis: AnalysisResult;
  createdAt: string;
  aiPending?: boolean;
  aiFailReason?: 'limit' | 'error';
  tasks?: Task[];
  chatHistory?: ChatMessage[];
  snapshots?: AnalysisSnapshot[];
  /** ID der zugeordneten Organisation (optional) */
  orgId?: string;
}
export interface WizardField { key: string; label: string; type: 'text' | 'select' | 'multi'; placeholder?: string; options?: [string, string][]; allowCustom?: boolean; customKey?: string; showWhen?: (data: WizardData) => boolean; }
export interface WizardStep { id: string; title: string; icon: string; fields: WizardField[]; }

// ── Organisations-Modul ──────────────────────────────────────
export type OrgRole = 'owner' | 'admin' | 'member';

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  owner:  'Eigentümer',
  admin:  'Administrator',
  member: 'Mitglied',
};

export interface Organization {
  id:          string;
  name:        string;
  slug:        string;
  description?: string;
  createdBy:   string;
  createdAt:   string;
}

export interface OrgMember {
  id:        string;
  orgId:     string;
  userId:    string;
  role:      OrgRole;
  createdAt: string;
  /** Anzeigename aus user_profiles (optional, per JOIN) */
  displayName?: string;
  /** E-Mail aus user_profiles (optional, per JOIN) */
  email?: string;
}
