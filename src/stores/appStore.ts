import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, WizardData, AnalysisResult, Task, TaskStatus, ChatMessage, AnalysisSnapshot, JiraConfig } from '@/types';

interface AppStore {
  projects: Project[];
  addProject: (data: WizardData, analysis: AnalysisResult) => Project;
  updateAnalysis: (id: string, analysis: AnalysisResult) => void;
  setAiPending: (id: string, pending: boolean) => void;
  setAiFailReason: (id: string, reason: 'limit' | 'error') => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  // Tasks
  addTask: (projectId: string, waveNumber: number, waveTitle: string, item: string) => void;
  updateTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => void;
  updateTaskNote: (projectId: string, taskId: string, note: string) => void;
  setTaskJiraIssue: (projectId: string, taskId: string, key: string, url: string, configId: string) => void;
  deleteTask: (projectId: string, taskId: string) => void;
  // Chat
  addChatMessage: (projectId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  clearChat: (projectId: string) => void;
  // Snapshots
  takeSnapshot: (projectId: string) => void;
  // Jira
  jiraConfigs: JiraConfig[];
  addJiraConfig: (config: Omit<JiraConfig, 'id' | 'createdAt'>) => JiraConfig;
  updateJiraConfig: (id: string, config: Partial<Omit<JiraConfig, 'id' | 'createdAt'>>) => void;
  deleteJiraConfig: (id: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      projects: [],
      addProject: (data, analysis) => {
        const project: Project = { id: Date.now().toString(), data, analysis, createdAt: new Date().toISOString(), tasks: [], chatHistory: [], snapshots: [] };
        set((state) => ({ projects: [project, ...state.projects] }));
        return project;
      },
      updateAnalysis: (id, analysis) => {
        set((state) => ({
          projects: state.projects.map(p => {
            if (p.id !== id) return p;
            // Snapshot der alten Analyse nehmen wenn Score vorhanden
            const snapshots = p.snapshots || [];
            const newSnapshot: AnalysisSnapshot | null = p.analysis.score != null ? {
              id: Date.now().toString(),
              takenAt: new Date().toISOString(),
              score: p.analysis.score,
              scoreLabel: p.analysis.scoreLabel,
              riskCount: p.analysis.risks.length,
              highCount: p.analysis.risks.filter(r => r.severity === 'high').length,
              source: p.analysis.source,
            } : null;
            return { ...p, analysis, aiPending: false, snapshots: newSnapshot ? [...snapshots, newSnapshot] : snapshots };
          })
        }));
      },
      setAiPending: (id, pending) => {
        set((state) => ({ projects: state.projects.map(p => p.id === id ? { ...p, aiPending: pending } : p) }));
      },
      setAiFailReason: (id, reason) => {
        set((state) => ({ projects: state.projects.map(p => p.id === id ? { ...p, aiFailReason: reason, aiPending: false } : p) }));
      },
      deleteProject: (id) => set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),
      getProject: (id) => get().projects.find((p) => p.id === id),

      // ── Tasks ──
      addTask: (projectId, waveNumber, waveTitle, item) => {
        const task: Task = { id: Date.now().toString(), waveNumber, waveTitle, item, status: 'open', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? { ...p, tasks: [...(p.tasks || []), task] } : p) }));
      },
      updateTaskStatus: (projectId, taskId, status) => {
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? {
          ...p, tasks: (p.tasks || []).map(t => t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t)
        } : p) }));
      },
      updateTaskNote: (projectId, taskId, note) => {
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? {
          ...p, tasks: (p.tasks || []).map(t => t.id === taskId ? { ...t, note, updatedAt: new Date().toISOString() } : t)
        } : p) }));
      },
      deleteTask: (projectId, taskId) => {
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? {
          ...p, tasks: (p.tasks || []).filter(t => t.id !== taskId)
        } : p) }));
      },
      setTaskJiraIssue: (projectId, taskId, key, url, configId) => {
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? {
          ...p, tasks: (p.tasks || []).map(t => t.id === taskId
            ? { ...t, jiraIssueKey: key, jiraIssueUrl: url, jiraConfigId: configId, updatedAt: new Date().toISOString() }
            : t)
        } : p) }));
      },

      // ── Chat ──
      addChatMessage: (projectId, message) => {
        const msg: ChatMessage = { ...message, id: Date.now().toString(), createdAt: new Date().toISOString() };
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? { ...p, chatHistory: [...(p.chatHistory || []), msg] } : p) }));
      },
      clearChat: (projectId) => {
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? { ...p, chatHistory: [] } : p) }));
      },

      // ── Snapshots ──
      takeSnapshot: (projectId) => {
        set(state => ({ projects: state.projects.map(p => {
          if (p.id !== projectId) return p;
          const snap: AnalysisSnapshot = {
            id: Date.now().toString(),
            takenAt: new Date().toISOString(),
            score: p.analysis.score,
            scoreLabel: p.analysis.scoreLabel,
            riskCount: p.analysis.risks.length,
            highCount: p.analysis.risks.filter(r => r.severity === 'high').length,
            source: p.analysis.source,
          };
          return { ...p, snapshots: [...(p.snapshots || []), snap] };
        }) }));
      },

      // ── Jira ──
      jiraConfigs: [],
      addJiraConfig: (config) => {
        const newConfig: JiraConfig = { ...config, id: Date.now().toString(), createdAt: new Date().toISOString() };
        set(state => ({ jiraConfigs: [...state.jiraConfigs, newConfig] }));
        return newConfig;
      },
      updateJiraConfig: (id, config) => {
        set(state => ({ jiraConfigs: state.jiraConfigs.map(c => c.id === id ? { ...c, ...config } : c) }));
      },
      deleteJiraConfig: (id) => {
        set(state => ({ jiraConfigs: state.jiraConfigs.filter(c => c.id !== id) }));
      },
    }),
    { name: 'archplanner-store' }
  )
);
