'use client';
import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { Project } from '@/types';

// ── Technologie-Label-Maps (entsprechen wizard-steps.ts) ──────────────────────
const STACK_LABELS: Record<string, string> = {
  nextjs: 'Next.js / React', vue: 'Vue / Nuxt', angular: 'Angular',
  laravel: 'Laravel / PHP', rails: 'Ruby on Rails', dotnet: '.NET',
  python: 'Python / Django', java: 'Java / Spring', go: 'Go',
};
const DB_LABELS: Record<string, string> = {
  postgres: 'PostgreSQL', mysql: 'MySQL', mariadb: 'MariaDB', mongodb: 'MongoDB',
  supabase: 'Supabase', firebase: 'Firebase', sqlite: 'SQLite', redis: 'Redis',
};
const HOSTING_LABELS: Record<string, string> = {
  vercel: 'Vercel', aws: 'AWS', azure: 'Azure', gcp: 'Google Cloud',
  selfhosted: 'Eigener Server', strato: 'Strato', hetzner: 'Hetzner', docker: 'Docker (self-hosted)',
};

type Category = 'Framework' | 'Datenbank' | 'Hosting / Infra';
type Lifecycle = 'Plan' | 'Aktiv' | 'Phase-Out' | 'Abgelöst';

const LIFECYCLE_CYCLE: Lifecycle[] = ['Plan', 'Aktiv', 'Phase-Out', 'Abgelöst'];

const LIFECYCLE_STYLE: Record<Lifecycle, { bg: string; text: string; border: string }> = {
  Plan:       { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.3)'  },
  Aktiv:      { bg: 'rgba(34,170,102,0.12)',  text: '#22aa66', border: 'rgba(34,170,102,0.3)'  },
  'Phase-Out':{ bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', border: 'rgba(245,158,11,0.3)'  },
  Abgelöst:   { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444', border: 'rgba(239,68,68,0.3)'   },
};

const CAT_ICONS: Record<Category, string> = {
  'Framework':     '⚙️',
  'Datenbank':     '🗄️',
  'Hosting / Infra': '☁️',
};

// ── Tech-Eintrag ─────────────────────────────────────────────────────────────
interface TechEntry {
  key: string;
  label: string;
  category: Category;
  projects: { id: string; name: string; hasHighRisk: boolean }[];
}

function buildTechMap(projects: Project[]): TechEntry[] {
  const map = new Map<string, TechEntry>();

  const add = (key: string, label: string, category: Category, project: Project) => {
    if (!key || key === 'none') return;
    const existing = map.get(key);
    const projectEntry = {
      id: project.id,
      name: project.data.projectName || project.id,
      hasHighRisk: project.analysis.risks.some(r => r.severity === 'high'),
    };
    if (existing) {
      if (!existing.projects.some(p => p.id === project.id)) {
        existing.projects.push(projectEntry);
      }
    } else {
      map.set(key, { key, label, category, projects: [projectEntry] });
    }
  };

  projects.forEach(project => {
    const split = (k: string) => (project.data[k] as string || '').split(',').filter(Boolean);

    split('primaryStack').forEach(v => {
      add(v, STACK_LABELS[v] || v, 'Framework', project);
    });
    split('database').forEach(v => {
      add(v, DB_LABELS[v] || v, 'Datenbank', project);
    });
    split('hosting').forEach(v => {
      add(v, HOSTING_LABELS[v] || v, 'Hosting / Infra', project);
    });
  });

  return [...map.values()].sort((a, b) => b.projects.length - a.projects.length);
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const projects = useAppStore(s => s.projects);
  const [lifecycle, setLifecycle] = useState<Record<string, Lifecycle>>({});
  const [catFilter, setCatFilter] = useState<Category | 'Alle'>('Alle');

  const techs = buildTechMap(projects);
  const cats: (Category | 'Alle')[] = ['Alle', 'Framework', 'Datenbank', 'Hosting / Infra'];

  const filtered = catFilter === 'Alle' ? techs : techs.filter(t => t.category === catFilter);

  const cycleLifecycle = (key: string) => {
    setLifecycle(prev => {
      const cur: Lifecycle = prev[key] ?? 'Aktiv';
      const next = LIFECYCLE_CYCLE[(LIFECYCLE_CYCLE.indexOf(cur) + 1) % LIFECYCLE_CYCLE.length];
      return { ...prev, [key]: next };
    });
  };

  // Statistiken
  const totalTechs = techs.length;
  const avgTechsPerProject = projects.length > 0
    ? (techs.reduce((s, t) => s + t.projects.length, 0) / projects.length).toFixed(1)
    : '0';
  const atRiskCount = techs.filter(t => t.projects.some(p => p.hasHighRisk)).length;
  const phaseOutCount = Object.values(lifecycle).filter(v => v === 'Phase-Out' || v === 'Abgelöst').length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white mb-1">🏛️ Technologie-Portfolio</h1>
          <p className="text-sm text-white/40">
            Aggregierte Technologie-Übersicht über alle {projects.length} Projekte — inspiriert von LeanIX Technology Portfolio.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Technologien', value: totalTechs, icon: '🧩', color: '#a29bfe' },
            { label: '⌀ Techs / Projekt', value: avgTechsPerProject, icon: '📊', color: '#74b9ff' },
            { label: 'Mit Risiken', value: atRiskCount, icon: '⚠️', color: '#ff7675' },
            { label: 'Phase-Out / Abgelöst', value: phaseOutCount, icon: '🔻', color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label}
              className="rounded-xl p-4 border border-white/[0.07]"
              style={{ background: 'rgba(14,6,6,0.75)' }}>
              <div className="text-2xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-white/35">{stat.icon} {stat.label}</div>
            </div>
          ))}
        </div>

        {/* Kategorie-Filter */}
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {cats.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
              style={{
                background: catFilter === cat ? 'rgba(162,155,254,0.15)' : 'rgba(255,255,255,0.03)',
                borderColor: catFilter === cat ? 'rgba(162,155,254,0.4)' : 'rgba(255,255,255,0.08)',
                color: catFilter === cat ? '#a29bfe' : 'rgba(255,255,255,0.4)',
              }}>
              {cat !== 'Alle' ? CAT_ICONS[cat] + ' ' : ''}{cat}
              <span className="ml-1.5 opacity-50 text-[10px]">
                {cat === 'Alle' ? techs.length : techs.filter(t => t.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        {/* Leer-Zustand */}
        {projects.length === 0 && (
          <div className="text-center py-20 text-white/25">
            <div className="text-5xl mb-4">🏛️</div>
            <p className="text-sm">Noch keine Projekte vorhanden. Erstelle ein Projekt via Wizard.</p>
          </div>
        )}

        {/* Technologie-Cards */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(tech => {
              const lc: Lifecycle = lifecycle[tech.key] ?? 'Aktiv';
              const lcStyle = LIFECYCLE_STYLE[lc];
              const hasAnyRisk = tech.projects.some(p => p.hasHighRisk);
              const highRiskProjects = tech.projects.filter(p => p.hasHighRisk);

              return (
                <div key={tech.key}
                  className="rounded-xl border overflow-hidden transition-all hover:border-white/[0.15]"
                  style={{ background: 'rgba(14,6,6,0.75)', borderColor: 'rgba(255,255,255,0.07)' }}>

                  {/* Card Header */}
                  <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white truncate">{tech.label}</span>
                        {hasAnyRisk && (
                          <span title={`${highRiskProjects.length} Projekt(e) mit hohem Risiko`}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 shrink-0">
                            ⚠️ Risiko
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/30 flex items-center gap-1">
                        <span>{CAT_ICONS[tech.category]}</span>
                        <span>{tech.category}</span>
                      </div>
                    </div>

                    {/* Lifecycle-Badge (klickbar zum Wechseln) */}
                    <button
                      onClick={() => cycleLifecycle(tech.key)}
                      title="Klicken zum Wechseln des Lifecycle-Status"
                      className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-all hover:opacity-80"
                      style={{ background: lcStyle.bg, color: lcStyle.text, borderColor: lcStyle.border }}>
                      {lc}
                    </button>
                  </div>

                  {/* Trennlinie */}
                  <div className="border-t border-white/[0.05] mx-4" />

                  {/* Projekte */}
                  <div className="px-4 py-3">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-2">
                      {tech.projects.length} Projekt{tech.projects.length !== 1 ? 'e' : ''}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tech.projects.slice(0, 6).map(p => (
                        <span key={p.id}
                          className="text-[11px] px-2 py-0.5 rounded-full border"
                          style={{
                            background: p.hasHighRisk ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                            borderColor: p.hasHighRisk ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)',
                            color: p.hasHighRisk ? '#ef4444' : 'rgba(255,255,255,0.45)',
                          }}>
                          {p.name}
                        </span>
                      ))}
                      {tech.projects.length > 6 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/30">
                          +{tech.projects.length - 6} weitere
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nutzungsbalken */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-white/20">Nutzung</span>
                      <span className="text-[9px] text-white/20">{tech.projects.length}/{Math.max(projects.length, 1)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((tech.projects.length / Math.max(projects.length, 1)) * 100)}%`,
                          background: hasAnyRisk ? '#ef4444' : '#a29bfe',
                          opacity: 0.7,
                        }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && projects.length > 0 && (
          <div className="text-center py-16 text-white/25">
            <div className="text-3xl mb-3">🔍</div>
            <p className="text-sm">Keine Technologien in dieser Kategorie gefunden.</p>
          </div>
        )}

        {/* Legende */}
        <div className="mt-8 p-4 rounded-xl border border-white/[0.05]" style={{ background: 'rgba(14,6,6,0.4)' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">Lifecycle-Legende (klickbar)</div>
          <div className="flex flex-wrap gap-3">
            {LIFECYCLE_CYCLE.map(lc => {
              const s = LIFECYCLE_STYLE[lc];
              return (
                <div key={lc} className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                    style={{ background: s.bg, color: s.text, borderColor: s.border }}>
                    {lc}
                  </span>
                  <span className="text-[11px] text-white/30">
                    {lc === 'Plan' ? '— in Planung' :
                     lc === 'Aktiv' ? '— produktiv im Einsatz' :
                     lc === 'Phase-Out' ? '— wird abgelöst' :
                     '— nicht mehr eingesetzt'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}
