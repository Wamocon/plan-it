'use client';
import { useState, useMemo } from 'react';
import { RULES_CATALOG, SCORE_CRITERIA, RuleCatalogEntry } from '@/lib/fallback-analysis';
import { useTheme } from '@/components/ui/ThemeProvider';

const CATEGORY_ICONS: Record<string, string> = {
  'Testing & Qualität':            '🧪',
  'CI/CD & Deployment':            '🚀',
  'Monitoring & Observability':    '📡',
  'Architektur & Code-Sharing':    '🏗️',
  'Dokumentation':                 '📚',
  'Infrastruktur & Hosting':       '🖥️',
  'Technologie & Stack':           '⚙️',
  'Team & Organisation':           '👥',
};

const SEV_STYLE: Record<string, { bg: string; border: string; text: string; badge: string; label: string }> = {
  high:     { bg: 'bg-red-950/40',    border: 'border-l-red-500',    text: 'text-red-300',    badge: 'bg-red-600',    label: 'HOCH' },
  medium:   { bg: 'bg-amber-950/40',  border: 'border-l-amber-500',  text: 'text-amber-300',  badge: 'bg-amber-600',  label: 'MITTEL' },
  low:      { bg: 'bg-blue-950/40',   border: 'border-l-blue-500',   text: 'text-blue-300',   badge: 'bg-blue-600',   label: 'NIEDRIG' },
  variable: { bg: 'bg-purple-950/40', border: 'border-l-purple-500', text: 'text-purple-300', badge: 'bg-purple-600', label: 'VARIABEL' },
};

const SEV_STYLE_LIGHT: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  high:     { bg: 'bg-red-50',     border: 'border-l-red-500',    text: 'text-red-700',    badge: 'bg-red-600' },
  medium:   { bg: 'bg-amber-50',   border: 'border-l-amber-500',  text: 'text-amber-700',  badge: 'bg-amber-600' },
  low:      { bg: 'bg-blue-50',    border: 'border-l-blue-500',   text: 'text-blue-700',   badge: 'bg-blue-600' },
  variable: { bg: 'bg-purple-50',  border: 'border-l-purple-500', text: 'text-purple-700', badge: 'bg-purple-600' },
};

const SCORE_CATEGORY_COLOR: Record<string, string> = {
  'Testing':        '#22aa66',
  'CI/CD':          '#60a5fa',
  'Monitoring':     '#f97316',
  'Dokumentation':  '#facc15',
  'Code-Sharing':   '#a78bfa',
  'Design System':  '#ec4899',
  'Branching':      '#34d399',
  'Legacy':         '#fb923c',
  'Onboarding':     '#94a3b8',
};

const ALL_CATEGORIES = [...new Set(RULES_CATALOG.map(r => r.category))];

function RuleCard({ rule, theme }: { rule: RuleCatalogEntry; theme: string }) {
  const [expanded, setExpanded] = useState(false);
  const s = theme === 'dark' ? SEV_STYLE[rule.severity] : SEV_STYLE_LIGHT[rule.severity];

  return (
    <div
      className={`${s.bg} rounded-lg border-l-4 ${s.border} overflow-hidden transition-all`}
      style={{ border: theme === 'light' ? undefined : undefined }}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-4 py-3 flex items-start gap-3 cursor-pointer bg-transparent border-none"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`${s.badge} text-white px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0`}>
              {SEV_STYLE[rule.severity].label}
            </span>
            {rule.contextSensitive && (
              <span className="bg-white/10 text-white/50 px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0">
                KONTEXTABHÄNGIG
              </span>
            )}
            <span className={`font-semibold text-sm ${s.text}`}>{rule.title}</span>
          </div>
          <p className={`text-xs mt-1 opacity-70 ${s.text}`}>{rule.triggerDescription}</p>
        </div>
        <span className={`text-xs shrink-0 mt-0.5 ${s.text} opacity-50`}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className={`px-4 pb-3 border-t border-white/[0.06] mt-0 space-y-2 ${theme === 'light' ? 'border-black/[0.06]' : ''}`}>
          {rule.scoreImpact && rule.scoreImpact !== 'Kein Score-Einfluss' && rule.scoreImpact !== 'Kein direkter Score-Einfluss' && (
            <div className="flex items-start gap-2 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#22aa66] shrink-0 mt-0.5">Score</span>
              <span className={`text-xs ${s.text} opacity-80`}>{rule.scoreImpact}</span>
            </div>
          )}
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] shrink-0 mt-0.5">Empfehlung</span>
            <span className={`text-xs ${s.text} opacity-80`}>{rule.recommendation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function RulesView() {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'rules' | 'scoring'>('rules');

  const filteredRules = useMemo(() => {
    let rules = RULES_CATALOG;
    if (selectedCategory) rules = rules.filter(r => r.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rules = rules.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.triggerDescription.toLowerCase().includes(q) ||
        r.recommendation.toLowerCase().includes(q)
      );
    }
    return rules;
  }, [selectedCategory, searchQuery]);

  const rulesByCategory = useMemo(() => {
    const map: Record<string, RuleCatalogEntry[]> = {};
    filteredRules.forEach(r => {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r);
    });
    return map;
  }, [filteredRules]);

  const highCount   = RULES_CATALOG.filter(r => r.severity === 'high').length;
  const mediumCount = RULES_CATALOG.filter(r => r.severity === 'medium').length;
  const lowCount    = RULES_CATALOG.filter(r => r.severity === 'low').length;
  const varCount    = RULES_CATALOG.filter(r => r.severity === 'variable').length;
  const totalMaxScore = SCORE_CRITERIA.reduce((s, c) => s + c.maxPoints, 0);

  const isDark = theme === 'dark';

  return (
    <div className="max-w-4xl mx-auto px-4 py-5">

      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          📋 Regelwerk der Analyse
        </h1>
        <p className={`text-sm ${isDark ? 'text-white/45' : 'text-gray-500'}`}>
          Alle Regeln und Bewertungskriterien der regelbasierten Architektur-Analyse auf einen Blick.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Regeln gesamt', value: RULES_CATALOG.length, color: isDark ? 'text-white' : 'text-gray-900' },
          { label: 'HOCH', value: highCount, color: 'text-red-400' },
          { label: 'MITTEL', value: mediumCount, color: 'text-amber-400' },
          { label: 'VARIABEL', value: varCount + lowCount, color: 'text-purple-400' },
        ].map(stat => (
          <div key={stat.label}
            className={`rounded-xl p-3 border ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-black/[0.03] border-black/[0.06]'}`}>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={`flex gap-0.5 border-b mb-5 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        {[
          { id: 'rules' as const,   label: `⚙️ Regeln (${RULES_CATALOG.length})`, color: '#ff1a1a' },
          { id: 'scoring' as const, label: `🏆 Score-Kriterien (${totalMaxScore} Pkt.)`, color: '#22aa66' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="px-4 py-2 border-b-[3px] bg-transparent cursor-pointer text-xs font-medium transition-colors"
            style={{
              borderBottomColor: activeTab === t.id ? t.color : 'transparent',
              color: activeTab === t.id ? t.color : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)'),
              fontWeight: activeTab === t.id ? 700 : 400,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: RULES ── */}
      {activeTab === 'rules' && (
        <div>
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Regeln durchsuchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`flex-1 text-xs px-3 py-2 rounded-lg border outline-none ${
                isDark
                  ? 'bg-white/[0.04] border-white/[0.10] text-white placeholder:text-white/25 focus:border-white/25'
                  : 'bg-black/[0.03] border-black/[0.10] text-gray-800 placeholder:text-gray-400 focus:border-black/25'
              }`}
            />
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                  !selectedCategory
                    ? 'bg-[#ff1a1a]/15 border-[#ff1a1a]/30 text-[#ff1a1a]'
                    : isDark
                    ? 'bg-transparent border-white/10 text-white/40 hover:text-white/70'
                    : 'bg-transparent border-black/10 text-gray-400 hover:text-gray-700'
                }`}>
                Alle
              </button>
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                    selectedCategory === cat
                      ? 'bg-[#ff1a1a]/15 border-[#ff1a1a]/30 text-[#ff1a1a]'
                      : isDark
                      ? 'bg-transparent border-white/10 text-white/40 hover:text-white/70'
                      : 'bg-transparent border-black/10 text-gray-400 hover:text-gray-700'
                  }`}>
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredRules.length === 0 && (
            <div className={`text-center py-16 text-sm ${isDark ? 'text-white/25' : 'text-gray-400'}`}>
              Keine Regeln gefunden.
            </div>
          )}

          {Object.entries(rulesByCategory).map(([category, rules]) => (
            <div key={category} className="mb-6">
              <h2 className={`text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                <span>{CATEGORY_ICONS[category]}</span>
                <span>{category}</span>
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isDark ? 'bg-white/8 text-white/30' : 'bg-black/6 text-gray-400'}`}>
                  {rules.length}
                </span>
              </h2>
              <div className="space-y-1.5">
                {rules.map(rule => (
                  <RuleCard key={rule.id} rule={rule} theme={theme} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: SCORING ── */}
      {activeTab === 'scoring' && (
        <div>
          <div className={`rounded-xl p-4 mb-5 border ${isDark ? 'bg-[#22aa66]/8 border-[#22aa66]/20' : 'bg-[#22aa66]/6 border-[#22aa66]/25'}`}>
            <p className={`text-sm ${isDark ? 'text-[#22aa66]/80' : 'text-[#166534]'}`}>
              Der <strong>Architektur-Score</strong> wird aus <strong>9 Kriterien</strong> berechnet und ergibt maximal <strong>{totalMaxScore} Punkte</strong>.
              Jedes Kriterium bewertet ein wichtiges Qualitätsmerkmal eures Software-Setups.
            </p>
          </div>

          {/* Score Labels */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
            {[
              { label: 'Sehr gut', range: '86–100', color: '#22aa66' },
              { label: 'Gut',      range: '71–85',  color: '#86efac' },
              { label: 'Mittel',   range: '51–70',  color: '#facc15' },
              { label: 'Niedrig',  range: '31–50',  color: '#fb923c' },
              { label: 'Kritisch', range: '0–30',   color: '#f87171' },
            ].map(sl => (
              <div key={sl.label}
                className={`rounded-lg p-2.5 text-center border`}
                style={{
                  background: `${sl.color}12`,
                  borderColor: `${sl.color}30`,
                }}>
                <div className="text-xs font-black" style={{ color: sl.color }}>{sl.label}</div>
                <div className={`text-[10px] mt-0.5 ${isDark ? 'text-white/35' : 'text-gray-500'}`}>{sl.range} Pkt.</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {SCORE_CRITERIA.map(c => {
              const color = SCORE_CATEGORY_COLOR[c.category] || '#94a3b8';
              const maxPts = c.maxPoints;
              return (
                <div key={c.category}
                  className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/[0.07]' : 'border-black/[0.07]'}`}>
                  {/* Header */}
                  <div className="px-4 py-2.5 flex items-center justify-between"
                    style={{ background: `${color}12` }}>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{c.category}</span>
                      <span className={`text-xs ml-2 font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{c.criterion}</span>
                    </div>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full"
                      style={{ background: `${color}20`, color }}>
                      max. {maxPts} Pkt.
                    </span>
                  </div>
                  {/* Breakdown */}
                  <div className={`px-4 py-2 divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-black/[0.04]'} ${isDark ? 'bg-[#16161a]' : 'bg-white'}`}>
                    {c.breakdown.map((b, i) => {
                      const pct = maxPts > 0 ? (b.points / maxPts) * 100 : 0;
                      return (
                        <div key={i} className="py-1.5 flex items-center gap-3">
                          <span className={`text-xs flex-1 min-w-0 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{b.value}</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-24 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/8' : 'bg-black/8'}`}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                            </div>
                            <span className="text-xs font-bold w-10 text-right" style={{ color: b.points > 0 ? color : isDark ? 'rgba(255,255,255,0.2)' : '#9ca3af' }}>
                              {b.points > 0 ? `+${b.points}` : '–'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className={`mt-4 rounded-xl p-4 flex items-center justify-between border ${isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-black/[0.03] border-black/[0.08]'}`}>
            <span className={`text-sm font-bold ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Maximaler Gesamt-Score</span>
            <span className="text-2xl font-black text-[#22aa66]">{totalMaxScore} Pkt.</span>
          </div>
        </div>
      )}
    </div>
  );
}
