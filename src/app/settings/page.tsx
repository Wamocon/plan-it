'use client';
import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { JiraConfig, AiConfig, AiProvider, AI_PROVIDER_LABELS } from '@/types';
import { Plus, Trash2, ExternalLink, CheckCircle2, AlertCircle, Edit2, Settings, X, RefreshCw, Key, Bot, Star } from 'lucide-react';

// ─── JIRA TYPES ───────────────────────────────────────────────────────────────
type JiraFormState = Omit<JiraConfig, 'id' | 'createdAt'>;

const DEFAULT_JIRA_FORM: JiraFormState = {
  label: '',
  baseUrl: '',
  email: '',
  apiToken: '',
  projectKey: '',
  issueType: 'Task',
};

const ISSUE_TYPES = ['Task', 'Story', 'Bug', 'Epic', 'Sub-task'];

// ─── AI TYPES ─────────────────────────────────────────────────────────────────
type AiFormState = Omit<AiConfig, 'id' | 'createdAt' | 'isActive'>;

const DEFAULT_AI_FORM: AiFormState = {
  provider: 'gemini',
  label: '',
  apiKey: '',
};

const AI_PROVIDERS: AiProvider[] = ['gemini', 'openai'];

export default function SettingsPage() {
  // ─── Jira Store ──────────────────────────────────────────────────────────────
  const jiraConfigs = useAppStore(s => s.jiraConfigs);
  const addJiraConfig = useAppStore(s => s.addJiraConfig);
  const updateJiraConfig = useAppStore(s => s.updateJiraConfig);
  const deleteJiraConfig = useAppStore(s => s.deleteJiraConfig);

  // ─── AI Store ────────────────────────────────────────────────────────────────
  const aiConfigs = useAppStore(s => s.aiConfigs);
  const addAiConfig = useAppStore(s => s.addAiConfig);
  const updateAiConfig = useAppStore(s => s.updateAiConfig);
  const deleteAiConfig = useAppStore(s => s.deleteAiConfig);
  const setActiveAiConfig = useAppStore(s => s.setActiveAiConfig);

  // ─── AI Form State ────────────────────────────────────────────────────────────
  const [showAiForm, setShowAiForm] = useState(false);
  const [editingAiId, setEditingAiId] = useState<string | null>(null);
  const [aiForm, setAiForm] = useState<AiFormState>(DEFAULT_AI_FORM);
  const [deleteAiConfirm, setDeleteAiConfirm] = useState<string | null>(null);
  const [showAiKey, setShowAiKey] = useState(false);

  const openNewAi = () => {
    setEditingAiId(null);
    setAiForm(DEFAULT_AI_FORM);
    setShowAiKey(false);
    setShowAiForm(true);
  };

  const openEditAi = (cfg: AiConfig) => {
    setEditingAiId(cfg.id);
    setAiForm({ provider: cfg.provider, label: cfg.label, apiKey: cfg.apiKey });
    setShowAiKey(false);
    setShowAiForm(true);
  };

  const closeAiForm = () => {
    setShowAiForm(false);
    setEditingAiId(null);
  };

  const isAiFormValid = () => aiForm.label.trim() && aiForm.apiKey.trim();

  const handleSaveAi = () => {
    if (!isAiFormValid()) return;
    if (editingAiId) {
      updateAiConfig(editingAiId, aiForm);
    } else {
      addAiConfig({ ...aiForm, isActive: aiConfigs.length === 0 });
    }
    closeAiForm();
  };

  const handleDeleteAi = (id: string) => {
    if (deleteAiConfirm === id) {
      deleteAiConfig(id);
      setDeleteAiConfirm(null);
    } else {
      setDeleteAiConfirm(id);
    }
  };

  // ─── Jira Form State ─────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JiraFormState>(DEFAULT_JIRA_FORM);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditingId(null);
    setForm(DEFAULT_JIRA_FORM);
    setTestResult(null);
    setTestMessage('');
    setShowForm(true);
  };

  const openEdit = (cfg: JiraConfig) => {
    setEditingId(cfg.id);
    setForm({
      label: cfg.label,
      baseUrl: cfg.baseUrl,
      email: cfg.email,
      apiToken: cfg.apiToken,
      projectKey: cfg.projectKey,
      issueType: cfg.issueType,
    });
    setTestResult(null);
    setTestMessage('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTestResult(null);
    setTestMessage('');
  };

  const isFormValid = () =>
    form.label.trim() && form.baseUrl.trim() && form.email.trim() && form.apiToken.trim() && form.projectKey.trim();

  const handleSave = () => {
    if (!isFormValid()) return;
    setSaving(true);
    if (editingId) {
      updateJiraConfig(editingId, form);
    } else {
      addJiraConfig(form);
    }
    setSaving(false);
    closeForm();
  };

  const handleTest = async () => {
    if (!form.baseUrl || !form.email || !form.apiToken) return;
    setTesting(true);
    setTestResult(null);
    setTestMessage('');
    try {
      const res = await fetch('/api/jira/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: form.baseUrl, email: form.email, apiToken: form.apiToken }),
      });
      const data = await res.json() as Record<string, string>;
      if (res.ok) {
        setTestResult('ok');
        setTestMessage(`Verbunden als „${data.displayName}"`);
      } else {
        setTestResult('error');
        setTestMessage(data.error || 'Verbindung fehlgeschlagen');
      }
    } catch {
      setTestResult('error');
      setTestMessage('Netzwerkfehler');
    }
    setTesting(false);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteJiraConfig(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  return (
    <div className="px-6 py-8 max-w-2xl">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,26,26,0.12)', border: '1px solid rgba(255,26,26,0.2)' }}>
          <Settings size={18} className="text-[#ff1a1a]/70" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white leading-none">Einstellungen</h1>
          <p className="text-xs text-white/30 mt-0.5">Integrationen & Konfiguration</p>
        </div>
      </div>

      {/* ── KI API Keys ─────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white/80 flex items-center gap-2">
              <Bot size={16} className="text-[#c084fc]" />
              KI-Einstellungen
            </h2>
            <p className="text-[11px] text-white/30 mt-0.5">
              API-Schlüssel für KI-Analyse und KI-Chat. Ohne Schlüssel ist nur die regelbasierte Analyse verfügbar.
            </p>
          </div>
          {!showAiForm && (
            <button
              onClick={openNewAi}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(192,132,252,0.12)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.25)' }}
            >
              <Plus size={13} /> Hinzufügen
            </button>
          )}
        </div>

        {/* AI Add / Edit Form */}
        {showAiForm && (
          <div className="rounded-xl border border-[#c084fc]/20 mb-4 overflow-hidden"
            style={{ background: 'rgba(192,132,252,0.04)' }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.06]">
              <span className="text-sm font-bold text-white/70">
                {editingAiId ? 'API-Schlüssel bearbeiten' : 'Neuer API-Schlüssel'}
              </span>
              <button onClick={closeAiForm} className="text-white/20 hover:text-white/50 border-none bg-transparent cursor-pointer">
                <X size={15} />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>KI-Anbieter</FieldLabel>
                <select
                  value={aiForm.provider}
                  onChange={e => setAiForm(f => ({ ...f, provider: e.target.value as AiProvider }))}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                >
                  {AI_PROVIDERS.map(p => (
                    <option key={p} value={p}>{AI_PROVIDER_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Bezeichnung</FieldLabel>
                <input
                  value={aiForm.label}
                  onChange={e => setAiForm(f => ({ ...f, label: e.target.value }))}
                  placeholder={`z.B. Mein ${AI_PROVIDER_LABELS[aiForm.provider]}-Key`}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2">
                <FieldLabel>
                  API-Schlüssel
                  {aiForm.provider === 'gemini' && (
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                      className="text-[#c084fc]/60 hover:text-[#c084fc] transition-colors ml-1">
                      ↗ Google AI Studio
                    </a>
                  )}
                  {aiForm.provider === 'openai' && (
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
                      className="text-[#c084fc]/60 hover:text-[#c084fc] transition-colors ml-1">
                      ↗ OpenAI Platform
                    </a>
                  )}
                </FieldLabel>
                <div className="relative">
                  <input
                    type={showAiKey ? 'text' : 'password'}
                    value={aiForm.apiKey}
                    onChange={e => setAiForm(f => ({ ...f, apiKey: e.target.value }))}
                    placeholder={aiForm.provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                    className="w-full rounded-lg px-3 py-2 pr-20 text-sm font-mono"
                    style={inputStyle}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAiKey(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded border border-white/10 text-white/30 hover:text-white/60 transition-colors bg-transparent cursor-pointer"
                  >
                    {showAiKey ? 'Verbergen' : 'Anzeigen'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 pb-4">
              <div className="flex-1" />
              <button
                onClick={closeAiForm}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveAi}
                disabled={!isAiFormValid()}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                style={{ background: 'rgba(192,132,252,0.18)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.3)' }}
              >
                {editingAiId ? 'Speichern' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        )}

        {/* AI Config List */}
        {aiConfigs.length === 0 && !showAiForm ? (
          <div className="rounded-xl border border-white/[0.06] py-10 text-center"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <Key size={32} className="mx-auto mb-3 opacity-20 text-white" />
            <p className="text-sm text-white/30 mb-1">Kein API-Schlüssel hinterlegt</p>
            <p className="text-xs text-white/20">
              KI-Analyse und KI-Chat sind erst nach Angabe eines API-Schlüssels verfügbar.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {aiConfigs.map(cfg => (
              <div key={cfg.id}
                className={`rounded-xl border px-4 py-3 flex items-center gap-3 transition-all ${
                  cfg.isActive ? 'border-[#c084fc]/30' : 'border-white/[0.07]'
                }`}
                style={{ background: cfg.isActive ? 'rgba(192,132,252,0.06)' : 'rgba(14,7,7,0.6)' }}
              >
                <Bot size={18} className={cfg.isActive ? 'text-[#c084fc]' : 'text-white/25'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white/80 truncate">{cfg.label}</span>
                    {cfg.isActive && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(192,132,252,0.15)', color: '#c084fc' }}>
                        AKTIV
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/30 mt-0.5">
                    {AI_PROVIDER_LABELS[cfg.provider]} · ••••••{cfg.apiKey.slice(-4)}
                  </div>
                </div>
                {!cfg.isActive && (
                  <button
                    onClick={() => setActiveAiConfig(cfg.id)}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-white/10 text-white/30 hover:text-[#c084fc] hover:border-[#c084fc]/30 transition-colors bg-transparent cursor-pointer"
                    title="Als aktiven Key verwenden"
                  >
                    <Star size={11} /> Aktivieren
                  </button>
                )}
                <button
                  onClick={() => openEditAi(cfg)}
                  className="text-white/20 hover:text-white/60 border-none bg-transparent cursor-pointer transition-colors p-1"
                  title="Bearbeiten"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDeleteAi(cfg.id)}
                  className={`border-none bg-transparent cursor-pointer transition-colors p-1 ${
                    deleteAiConfirm === cfg.id ? 'text-red-400' : 'text-white/20 hover:text-red-400'
                  }`}
                  title={deleteAiConfirm === cfg.id ? 'Nochmal klicken zum Bestätigen' : 'Löschen'}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Jira section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white/80 flex items-center gap-2">
              <JiraLogo size={16} />
              Jira-Verbindungen
            </h2>
            <p className="text-[11px] text-white/30 mt-0.5">
              Aufgaben direkt als Jira-Vorgänge anlegen. Unterstützt mehrere Instanzen.
            </p>
          </div>
          {!showForm && (
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(38,132,255,0.12)', color: '#2684FF', border: '1px solid rgba(38,132,255,0.25)' }}
            >
              <Plus size={13} /> Hinzufügen
            </button>
          )}
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <div className="rounded-xl border border-[#2684FF]/20 mb-4 overflow-hidden"
            style={{ background: 'rgba(38,132,255,0.04)' }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.06]">
              <span className="text-sm font-bold text-white/70">
                {editingId ? 'Verbindung bearbeiten' : 'Neue Verbindung'}
              </span>
              <button onClick={closeForm} className="text-white/20 hover:text-white/50 border-none bg-transparent cursor-pointer">
                <X size={15} />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <FieldLabel>Bezeichnung</FieldLabel>
                <input
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="z.B. WMC Jira"
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2">
                <FieldLabel>Jira-URL</FieldLabel>
                <input
                  value={form.baseUrl}
                  onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))}
                  placeholder="https://ihr-unternehmen.atlassian.net"
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <FieldLabel>E-Mail</FieldLabel>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="name@unternehmen.de"
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <FieldLabel>API-Token <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="text-[#2684FF]/60 hover:text-[#2684FF] transition-colors ml-1">↗ erstellen</a></FieldLabel>
                <input
                  type="password"
                  value={form.apiToken}
                  onChange={e => setForm(f => ({ ...f, apiToken: e.target.value }))}
                  placeholder="••••••••••••••••"
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <FieldLabel>Projekt-Schlüssel</FieldLabel>
                <input
                  value={form.projectKey}
                  onChange={e => setForm(f => ({ ...f, projectKey: e.target.value.toUpperCase() }))}
                  placeholder="ARCH"
                  className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                  style={inputStyle}
                />
              </div>
              <div>
                <FieldLabel>Vorgangstyp</FieldLabel>
                <select
                  value={form.issueType}
                  onChange={e => setForm(f => ({ ...f, issueType: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={inputStyle}
                >
                  {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Test result */}
            {testResult && (
              <div className={`mx-4 mb-3 rounded-lg px-3 py-2 text-xs flex items-center gap-2 ${
                testResult === 'ok'
                  ? 'bg-[#22aa66]/10 border border-[#22aa66]/20 text-[#22aa66]'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {testResult === 'ok'
                  ? <CheckCircle2 size={13} />
                  : <AlertCircle size={13} />}
                {testMessage}
              </div>
            )}

            <div className="flex items-center gap-2 px-4 pb-4">
              <button
                onClick={handleTest}
                disabled={testing || !form.baseUrl || !form.email || !form.apiToken}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <RefreshCw size={11} className={testing ? 'animate-spin' : ''} />
                {testing ? 'Teste...' : 'Verbindung testen'}
              </button>
              <div className="flex-1" />
              <button
                onClick={closeForm}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={!isFormValid() || saving}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                style={{ background: 'rgba(38,132,255,0.18)', color: '#2684FF', border: '1px solid rgba(38,132,255,0.3)' }}
              >
                {editingId ? 'Speichern' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        )}

        {/* Config list */}
        {jiraConfigs.length === 0 && !showForm ? (
          <div className="rounded-xl border border-white/[0.06] py-10 text-center"
            style={{ background: 'rgba(255,255,255,0.015)' }}>
            <JiraLogo size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm text-white/30 mb-1">Keine Jira-Verbindungen konfiguriert</p>
            <p className="text-xs text-white/20">Klicke auf „Hinzufügen" um die erste Verbindung einzurichten.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {jiraConfigs.map(cfg => (
              <div key={cfg.id}
                className="rounded-xl border border-white/[0.07] px-4 py-3 flex items-center gap-3"
                style={{ background: 'rgba(14,7,7,0.6)' }}
              >
                <JiraLogo size={20} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white/80 truncate">{cfg.label}</div>
                  <div className="text-[11px] text-white/30 truncate mt-0.5">
                    {cfg.baseUrl} · {cfg.email} · <span className="font-mono">{cfg.projectKey}</span> · {cfg.issueType}
                  </div>
                </div>
                <a
                  href={cfg.baseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/20 hover:text-white/50 transition-colors p-1"
                  title="Jira öffnen"
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  onClick={() => openEdit(cfg)}
                  className="text-white/20 hover:text-white/60 border-none bg-transparent cursor-pointer transition-colors p-1"
                  title="Bearbeiten"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(cfg.id)}
                  className={`border-none bg-transparent cursor-pointer transition-colors p-1 ${
                    deleteConfirm === cfg.id ? 'text-red-400' : 'text-white/20 hover:text-red-400'
                  }`}
                  title={deleteConfirm === cfg.id ? 'Nochmal klicken zum Bestätigen' : 'Löschen'}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1">
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: 'rgba(255,255,255,0.75)',
  outline: 'none',
};

function JiraLogo({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path
        d="M15.4 2.2L2.4 15.2a2 2 0 000 2.83l12.8 12.8a2 2 0 002.83 0l4.52-4.52-7.55-7.55a2 2 0 010-2.83l7.55-7.55L17.96 2.2a2 2 0 00-2.56 0z"
        fill="url(#jg1)"
      />
      <path
        d="M16.17 8.93l-4.52 4.52a2 2 0 000 2.83l4.52 4.52 7.55-7.55-7.55-4.32z"
        fill="url(#jg2)"
      />
      <defs>
        <linearGradient id="jg1" x1="3" y1="16" x2="29" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2684FF" />
          <stop offset="1" stopColor="#0052CC" />
        </linearGradient>
        <linearGradient id="jg2" x1="11" y1="16" x2="24" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2684FF" />
          <stop offset="1" stopColor="#0052CC" />
        </linearGradient>
      </defs>
    </svg>
  );
}
