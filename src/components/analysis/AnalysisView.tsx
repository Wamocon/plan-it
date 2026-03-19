'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Project, Severity } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { RiskHeatmap } from './RiskHeatmap';
import { ScoreTrend } from './ScoreTrend';
import { TaskTracker } from './TaskTracker';
import { ProjectChat } from './ProjectChat';
import { useTheme } from '@/components/ui/ThemeProvider';

const scoreStyle = (s: number) =>
  s >= 71 ? 'text-[#22aa66] bg-[#22aa66]/10 border-[#22aa66]/30' :
  s >= 51 ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' :
  'text-red-400 bg-red-400/10 border-red-400/30';

const sev: Record<Severity, { bg: string; border: string; text: string; badge: string; label: string }> = {
  high:   { bg: 'bg-red-950/40',   border: 'border-l-red-500',   text: 'text-red-300',   badge: 'bg-red-600',   label: 'HOCH' },
  medium: { bg: 'bg-amber-950/40', border: 'border-l-amber-500', text: 'text-amber-300', badge: 'bg-amber-600', label: 'MITTEL' },
  low:    { bg: 'bg-blue-950/40',  border: 'border-l-blue-500',  text: 'text-blue-300',  badge: 'bg-blue-600',  label: 'NIEDRIG' },
};

export function AnalysisView({ project }: { project: Project }) {
  const [tab, setTab] = useState<'ist' | 'risks' | 'heatmap' | 'soll' | 'waves' | 'tasks' | 'trend' | 'chat'>('ist');
  const [reanalyzing, setReanalyzing] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'word' | null>(null);
  const updateAnalysis = useAppStore(s => s.updateAnalysis);
  const getActiveAiConfig = useAppStore(s => s.getActiveAiConfig);
  const { theme } = useTheme();
  const { data, analysis, aiPending, aiFailReason } = project;
  const { risks, soll, waves, summary, source, score, scoreLabel } = analysis;

  const activeAiConfig = getActiveAiConfig();

  const handleExportPdf = async () => {
    setExporting('pdf');
    try { const { exportPdf } = await import('@/lib/export-pdf'); await exportPdf(project); }
    catch (e) { console.error(e); }
    setExporting(null);
  };

  const handleExportWord = async () => {
    setExporting('word');
    try { const { exportWord } = await import('@/lib/export-word'); await exportWord(project); }
    catch (e) { console.error(e); }
    setExporting(null);
  };

  const getVal = (k: string): string => {
    const v = data[k] || '';
    if (v.includes(',')) return v.split(',').filter(Boolean).map(p => p === '_c' ? (data[k + 'C'] || '') : p).join(', ');
    if (v === '_c') return data[k + 'C'] || '–';
    return v || '–';
  };

  const reAnalyze = async () => {
    if (!activeAiConfig) return;
    setReanalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, apiKey: activeAiConfig.apiKey, provider: activeAiConfig.provider }),
      });
      const result = await res.json();
      if (result.source === 'ai' || result.risks) updateAnalysis(project.id, { ...result, source: result.source || 'ai' });
    } catch (e) { console.error(e); }
    setReanalyzing(false);
  };

  const tabs = [
    { id: 'ist' as const,     l: '📋 Ist',                       color: '#fff' },
    { id: 'risks' as const,   l: `⚠️ Risiken (${risks.length})`,  color: '#ff1a1a' },
    { id: 'heatmap' as const, l: '🔥 Heatmap',                    color: '#f97316' },
    { id: 'soll' as const,    l: '🎯 Soll',                        color: '#22aa66' },
    { id: 'waves' as const,   l: '🌊 Umsetzung',                   color: '#60a5fa' },
    { id: 'tasks' as const,   l: `✅ Aufgaben${(project.tasks||[]).length > 0 ? ` (${(project.tasks||[]).length})` : ''}`, color: '#a78bfa' },
    { id: 'trend' as const,   l: '📈 Trend',                       color: '#34d399' },
    { id: 'chat' as const,    l: '🤖 KI-Chat',                     color: '#c084fc' },
  ];

  const istRows: [string, string][] = [
    ['Projekt', data.projectName || '–'], ['Kunde', data.clientName || '–'],
    ['Team', getVal('teamSize')], ['Apps', getVal('appCount')], ['Ziel', getVal('targetApps')],
    ['Tech Stack', getVal('primaryStack')], ['Datenbank', getVal('database')], ['Hosting', getVal('hosting')],
    ['Code-Sharing', getVal('codeSharing')], ['Design System', getVal('designSystem')],
    ['CI/CD', getVal('cicd')], ['Testing', getVal('testing')],
    ['Monitoring', getVal('monitoring')], ['Dokumentation', getVal('documentation')],
    ['Branching', getVal('branching')],
    ['Legacy', data.legacyApps === 'yes' ? '⚠️ ' + (data.legacyDetail || 'Ja') : '✅ Keine'],
    ['Onboarding', getVal('onboardingTime')],
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-5">
      {/* Back */}
      <Link href="/"
        className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg text-white/50 text-xs font-semibold px-3 py-1.5 no-underline hover:bg-white/10 hover:text-white/80 transition-all">
        ← Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mt-4 mb-2 gap-2">
        <div>
          <h2 className="text-xl font-bold text-white mb-0.5">{data.projectName}</h2>
          <p className="text-white/40 text-sm">{data.clientName} · {risks.length} Risiken</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {score !== undefined && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scoreStyle(score)}`}>
              Score {score}/100 · {scoreLabel}
            </span>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${source === 'ai' ? 'bg-purple-900/60 text-purple-300' : 'bg-white/10 text-white/40'}`}>
            {source === 'ai' ? '🤖 KI-Analyse' : '📊 Regel-Analyse'}
          </span>
        </div>
      </div>

      {/* KI läuft im Hintergrund */}
      {aiPending && (
        <div className="bg-purple-950/40 border border-purple-500/20 rounded-lg p-3 mb-3 flex items-center gap-3 text-xs text-purple-300">
          <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin flex-shrink-0" />
          <span>🤖 KI-Analyse läuft im Hintergrund — diese Ansicht aktualisiert sich automatisch.</span>
        </div>
      )}

      {/* Rate-Limit-Fehler */}
      {!aiPending && aiFailReason === 'limit' && (
        <div className="bg-red-950/40 border border-red-500/20 rounded-lg p-3 mb-3 flex items-center gap-3 text-xs text-red-300">
          <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">!</div>
          <span>⚠️ Tages-Limit der KI-API erreicht. Die regelbasierte Analyse wird angezeigt. Morgen steht das Kontingent wieder zur Verfügung.</span>
        </div>
      )}

      {/* Netzwerk-/sonstiger Fehler */}
      {!aiPending && aiFailReason === 'error' && (
        <div className="bg-amber-950/40 border border-amber-500/20 rounded-lg p-3 mb-3 flex items-center justify-between text-xs text-amber-300">
          <span>⚡ KI-Analyse nicht verfügbar. Regelbasierte Analyse wird angezeigt.</span>
          {activeAiConfig && (
            <button onClick={reAnalyze} disabled={reanalyzing}
              className="bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold border-none cursor-pointer disabled:opacity-50 ml-3 flex-shrink-0 hover:bg-purple-700 transition-colors">
              {reanalyzing ? '⏳ Läuft...' : '🔄 Erneut versuchen'}
            </button>
          )}
        </div>
      )}

      {/* Fallback ohne Fehler */}
      {!aiPending && !aiFailReason && source === 'fallback' && (
        <div className="bg-amber-950/40 border border-amber-500/20 rounded-lg p-3 mb-3 flex items-center justify-between text-xs text-amber-300">
          {activeAiConfig
            ? <span>📊 Regelbasierte Analyse. Starte eine KI-Analyse für bessere Ergebnisse.</span>
            : <span>📊 Regelbasierte Analyse. <Link href="/settings" className="text-[#c084fc] hover:underline">API-Schlüssel hinterlegen</Link> für KI-Analyse.</span>
          }
          {activeAiConfig && (
            <button onClick={reAnalyze} disabled={reanalyzing}
              className="bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold border-none cursor-pointer disabled:opacity-50 ml-3 flex-shrink-0 hover:bg-purple-700 transition-colors">
              {reanalyzing ? '⏳ Läuft...' : '🤖 KI-Analyse starten'}
            </button>
          )}
        </div>
      )}

      {summary && (
        <div className="bg-blue-950/30 border border-blue-500/20 rounded-lg p-3 mb-3 text-xs text-blue-300">{summary}</div>
      )}

      {/* Export + KI Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={handleExportPdf} disabled={exporting !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-xs font-semibold text-white/60 cursor-pointer hover:bg-white/10 hover:text-white/90 disabled:opacity-40 transition-all">
          {exporting === 'pdf' ? '⏳' : '📄'} PDF Export
        </button>
        <button onClick={handleExportWord} disabled={exporting !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-xs font-semibold text-white/60 cursor-pointer hover:bg-white/10 hover:text-white/90 disabled:opacity-40 transition-all">
          {exporting === 'word' ? '⏳' : '📝'} Word Export
        </button>
        {!aiPending && aiFailReason !== 'limit' && activeAiConfig && (
          <button onClick={reAnalyze} disabled={reanalyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 border border-purple-600 rounded-md text-xs font-semibold text-white cursor-pointer hover:bg-purple-700 disabled:opacity-40 transition-colors">
            {reanalyzing ? '⏳ Läuft...' : source === 'ai' ? '🔄 KI-Analyse neu starten' : '🤖 KI-Analyse starten'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-white/[0.08] mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-3 py-1.5 border-b-[3px] bg-transparent cursor-pointer text-xs font-medium transition-colors shrink-0 whitespace-nowrap"
            style={{
              borderBottomColor: tab === t.id ? t.color : 'transparent',
              color: tab === t.id ? t.color : (theme === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)'),
              fontWeight: tab === t.id ? 700 : 400,
            }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Tab: Ist */}
      {tab === 'ist' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {istRows.map(([k, v]) => (
            <div key={k} className="bg-[#16161a] p-2.5 rounded-md border border-white/[0.07]">
              <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider">{k}</div>
              <div className="text-sm text-white mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Risiken */}
      {tab === 'risks' && (
        <div className="space-y-2">
          {risks.length === 0
            ? <p className="text-center py-10 text-white/30">Keine Risiken 🎉</p>
            : risks.map((r, i) => {
              const s = sev[r.severity];
              return (
                <div key={i} className={`${s.bg} rounded-lg p-3 border-l-4 ${s.border}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`${s.badge} text-white px-1.5 rounded text-[9px] font-bold`}>{s.label}</span>
                    <strong className={`${s.text} text-sm`}>{r.title}</strong>
                  </div>
                  <p className={`${s.text} text-xs opacity-80 mb-0.5`}>{r.description}</p>
                  <p className={`${s.text} text-xs`}><strong>→</strong> {r.recommendation}</p>
                </div>
              );
            })}
        </div>
      )}

      {/* Tab: Soll */}
      {tab === 'soll' && (
        <div className="space-y-1.5">
          {soll.map((s, i) => (
            <div key={i} className="bg-[#22aa66]/10 px-3 py-2 rounded-md border border-[#22aa66]/20 flex items-center gap-2">
              <span>🎯</span>
              <div>
                <div className="text-[10px] text-[#22aa66] font-bold uppercase tracking-wider">{s.area}</div>
                <div className="text-xs text-[#22aa66]/80">{s.target}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Umsetzung */}
      {tab === 'waves' && (
        <div className="space-y-2.5">
          {waves.map(w => (
            <div key={w.number} className="rounded-lg border border-white/[0.08] overflow-hidden">
              <div className={`px-3 py-2 flex justify-between items-center ${w.number <= 4 ? 'bg-blue-950/30' : 'bg-white/[0.03]'}`}>
                <span>
                  <span className="text-blue-400 font-bold text-[10px] uppercase tracking-wider">WELLE {w.number}</span>
                  <strong className="text-white text-sm ml-1">{w.title}</strong>
                </span>
                <span className="text-white/30 text-[11px] bg-white/5 px-1.5 py-0.5 rounded">{w.duration}</span>
              </div>
              <div className="px-3 py-1.5 bg-[#16161a]">
                {w.items.map((item, j) => (
                  <div key={j} className="py-0.5 text-xs text-white/60">
                    <span className="text-[#22aa66] mr-1">▸</span>{item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Heatmap */}
      {tab === 'heatmap' && <RiskHeatmap risks={risks} />}

      {/* Tab: Aufgaben */}
      {tab === 'tasks' && <TaskTracker project={project} />}

      {/* Tab: Trend */}
      {tab === 'trend' && <ScoreTrend snapshots={project.snapshots || []} currentScore={score} />}

      {/* Tab: KI-Chat */}
      {tab === 'chat' && (
        <div className="rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(14,6,6,0.7)' }}>
          {activeAiConfig
            ? <ProjectChat project={project} apiKey={activeAiConfig.apiKey} />
            : (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <span className="text-4xl mb-4">🔑</span>
                <p className="text-sm font-semibold text-white/50 mb-1">Kein KI-API-Schlüssel konfiguriert</p>
                <p className="text-xs text-white/25 mb-4">
                  Hinterlege einen API-Schlüssel in den Einstellungen, um den KI-Chat zu nutzen.
                </p>
                <Link href="/settings"
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
                  style={{ background: 'rgba(192,132,252,0.12)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.25)' }}>
                  ⚙️ Zu den Einstellungen
                </Link>
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}
