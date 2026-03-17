import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, WizardData, AnalysisResult, Task, TaskStatus, ChatMessage, AnalysisSnapshot, JiraConfig, AiConfig } from '@/types';
import {
  dbAddProject, dbUpdateAnalysis, dbSetAiPending, dbSetAiFailReason, dbDeleteProject,
  dbAddTask, dbUpdateTask, dbDeleteTask,
  dbAddChatMessage, dbClearChat,
  dbTakeSnapshot,
  dbAddJiraConfig, dbUpdateJiraConfig, dbDeleteJiraConfig,
  dbAddAiConfig, dbUpdateAiConfig, dbDeleteAiConfig, dbSetActiveAiConfig,
} from '@/lib/appwrite/db';

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
  // AI
  aiConfigs: AiConfig[];
  addAiConfig: (config: Omit<AiConfig, 'id' | 'createdAt'>) => AiConfig;
  updateAiConfig: (id: string, config: Partial<Omit<AiConfig, 'id' | 'createdAt'>>) => void;
  deleteAiConfig: (id: string) => void;
  setActiveAiConfig: (id: string) => void;
  getActiveAiConfig: () => AiConfig | undefined;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      projects: [],
      addProject: (data, analysis) => {
        const project: Project = { id: Date.now().toString(), data, analysis, createdAt: new Date().toISOString(), tasks: [], chatHistory: [], snapshots: [] };
        set((state) => ({ projects: [project, ...state.projects] }));
        dbAddProject(project);
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
            dbUpdateAnalysis(id, analysis, newSnapshot);
            return { ...p, analysis, aiPending: false, snapshots: newSnapshot ? [...snapshots, newSnapshot] : snapshots };
          })
        }));
      },
      setAiPending: (id, pending) => {
        set((state) => ({ projects: state.projects.map(p => p.id === id ? { ...p, aiPending: pending } : p) }));
        dbSetAiPending(id, pending);
      },
      setAiFailReason: (id, reason) => {
        set((state) => ({ projects: state.projects.map(p => p.id === id ? { ...p, aiFailReason: reason, aiPending: false } : p) }));
        dbSetAiFailReason(id, reason);
      },
      deleteProject: (id) => {
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
        dbDeleteProject(id);
      },
      getProject: (id) => get().projects.find((p) => p.id === id),

      // ── Tasks ──
      addTask: (projectId, waveNumber, waveTitle, item) => {
        const task: Task = { id: Date.now().toString(), waveNumber, waveTitle, item, status: 'open', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? { ...p, tasks: [...(p.tasks || []), task] } : p) }));
        dbAddTask(task, projectId);
      },
      updateTaskStatus: (projectId, taskId, status) => {
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? {
          ...p, tasks: (p.tasks || []).map(t => t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t)
        } : p) }));
        dbUpdateTask(taskId, { status });
      },
      updateTaskNote: (projectId, taskId, note) => {
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? {
          ...p, tasks: (p.tasks || []).map(t => t.id === taskId ? { ...t, note, updatedAt: new Date().toISOString() } : t)
        } : p) }));
        dbUpdateTask(taskId, { note });
      },
      deleteTask: (projectId, taskId) => {
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? {
          ...p, tasks: (p.tasks || []).filter(t => t.id !== taskId)
        } : p) }));
        dbDeleteTask(taskId);
      },
      setTaskJiraIssue: (projectId, taskId, key, url, configId) => {
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? {
          ...p, tasks: (p.tasks || []).map(t => t.id === taskId
            ? { ...t, jiraIssueKey: key, jiraIssueUrl: url, jiraConfigId: configId, updatedAt: new Date().toISOString() }
            : t)
        } : p) }));
        dbUpdateTask(taskId, { jiraIssueKey: key, jiraIssueUrl: url, jiraConfigId: configId });
      },

      // ── Chat ──
      addChatMessage: (projectId, message) => {
        const msg: ChatMessage = { ...message, id: Date.now().toString(), createdAt: new Date().toISOString() };
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? { ...p, chatHistory: [...(p.chatHistory || []), msg] } : p) }));
        dbAddChatMessage(msg, projectId);
      },
      clearChat: (projectId) => {
        set(state => ({ projects: state.projects.map(p => p.id === projectId ? { ...p, chatHistory: [] } : p) }));
        dbClearChat(projectId);
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
          dbTakeSnapshot(snap, projectId);
          return { ...p, snapshots: [...(p.snapshots || []), snap] };
        }) }));
      },

      // ── Jira ──
      jiraConfigs: [],
      addJiraConfig: (config) => {
        const newConfig: JiraConfig = { ...config, id: Date.now().toString(), createdAt: new Date().toISOString() };
        set(state => ({ jiraConfigs: [...state.jiraConfigs, newConfig] }));
        dbAddJiraConfig(newConfig);
        return newConfig;
      },
      updateJiraConfig: (id, config) => {
        set(state => ({ jiraConfigs: state.jiraConfigs.map(c => c.id === id ? { ...c, ...config } : c) }));
        dbUpdateJiraConfig(id, config);
      },
      deleteJiraConfig: (id) => {
        set(state => ({ jiraConfigs: state.jiraConfigs.filter(c => c.id !== id) }));
        dbDeleteJiraConfig(id);
      },

      // ── AI ──
      aiConfigs: [],
      addAiConfig: (config) => {
        const isFirst = get().aiConfigs.length === 0;
        const newConfig: AiConfig = { ...config, id: Date.now().toString(), isActive: config.isActive || isFirst, createdAt: new Date().toISOString() };
        set(state => ({
          aiConfigs: config.isActive
            ? [...state.aiConfigs.map(c => ({ ...c, isActive: false })), newConfig]
            : [...state.aiConfigs, newConfig],
        }));
        dbAddAiConfig(newConfig);
        return newConfig;
      },
      updateAiConfig: (id, config) => {
        set(state => ({
          aiConfigs: config.isActive
            ? state.aiConfigs.map(c => ({ ...c, isActive: c.id === id, ...(c.id === id ? config : {}) }))
            : state.aiConfigs.map(c => c.id === id ? { ...c, ...config } : c),
        }));
        dbUpdateAiConfig(id, config);
      },
      deleteAiConfig: (id) => {
        set(state => {
          const remaining = state.aiConfigs.filter(c => c.id !== id);
          let newActiveId: string | null = null;
          if (remaining.length > 0 && !remaining.some(c => c.isActive)) {
            remaining[0] = { ...remaining[0], isActive: true };
            newActiveId = remaining[0].id;
          }
          dbDeleteAiConfig(id, newActiveId);
          return { aiConfigs: remaining };
        });
      },
      setActiveAiConfig: (id) => {
        const allIds = get().aiConfigs.map(c => c.id);
        set(state => ({ aiConfigs: state.aiConfigs.map(c => ({ ...c, isActive: c.id === id })) }));
        dbSetActiveAiConfig(id, allIds);
      },
      getActiveAiConfig: () => {
        return get().aiConfigs.find(c => c.isActive);
      },
    }),
    { name: 'archplanner-store' }
  )
);
