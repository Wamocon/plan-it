'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { Building2, Plus, Users, FolderOpen, ChevronRight, Loader2, X } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 63);
}

export default function OrganizationsPage() {
  const router = useRouter();
  const { theme } = useTheme();

  const organizations    = useAppStore(s => s.organizations);
  const loadOrganizations = useAppStore(s => s.loadOrganizations);
  const createOrganization = useAppStore(s => s.createOrganization);

  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrganizations().finally(() => setLoading(false));
  }, [loadOrganizations]);

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: slugify(name) }));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Name darf nicht leer sein.'); return; }
    if (!form.slug.trim()) { setError('Slug darf nicht leer sein.'); return; }
    setCreating(true);
    setError('');
    const org = await createOrganization({ name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim() || undefined });
    setCreating(false);
    if (org) {
      setShowCreate(false);
      setForm({ name: '', slug: '', description: '' });
      router.push(`/organizations/${org.id}`);
    } else {
      setError('Organisation konnte nicht erstellt werden. Slug ist möglicherweise bereits vergeben.');
    }
  };

  const cardBg = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff1a1a]/10 flex items-center justify-center">
            <Building2 size={20} className="text-[#ff1a1a]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Organisationen</h1>
            <p className="text-sm text-gray-400 dark:text-white/40">Unternehmen, Teams und Mitglieder verwalten</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff1a1a] text-white text-sm font-semibold hover:bg-[#e51515] transition-colors"
        >
          <Plus size={14} />
          Neue Organisation
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: theme === 'dark' ? '#1a0a0a' : '#fff', border: `1px solid ${borderColor}` }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Organisation erstellen</h2>
              <button onClick={() => { setShowCreate(false); setError(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white/60">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-white/40 mb-1.5">Name *</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ff1a1a]/30"
                  style={{ borderColor }}
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="z.B. Acme GmbH"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-white/40 mb-1.5">Slug (URL-Kennung) *</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ff1a1a]/30 font-mono"
                  style={{ borderColor }}
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="acme-gmbh"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-white/40 mb-1.5">Beschreibung</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ff1a1a]/30 resize-none"
                  style={{ borderColor }}
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Kurze Beschreibung (optional)"
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowCreate(false); setError(''); }}
                  className="flex-1 px-4 py-2 rounded-xl border text-sm font-semibold text-gray-500 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#ff1a1a] text-white text-sm font-semibold hover:bg-[#e51515] disabled:opacity-50 transition-colors"
                >
                  {creating && <Loader2 size={13} className="animate-spin" />}
                  {creating ? 'Erstelle…' : 'Erstellen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Organisations-Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Lade Organisationen…</span>
        </div>
      ) : organizations.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-16 text-center gap-4"
          style={{ borderColor }}
        >
          <Building2 size={40} className="text-gray-300 dark:text-white/15" />
          <div>
            <p className="font-semibold text-gray-500 dark:text-white/40">Noch keine Organisationen</p>
            <p className="text-sm text-gray-400 dark:text-white/25 mt-1">Erstelle deine erste Organisation, um Teams und Projekte zu bündeln.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff1a1a] text-white text-sm font-semibold hover:bg-[#e51515] transition-colors"
          >
            <Plus size={14} />
            Jetzt erstellen
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {organizations.map(org => (
            <button
              key={org.id}
              onClick={() => router.push(`/organizations/${org.id}`)}
              className="flex items-center gap-4 p-4 rounded-2xl border text-left hover:border-[#ff1a1a]/30 transition-all group"
              style={{ background: cardBg, borderColor }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#ff1a1a]/10 flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-[#ff1a1a]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 dark:text-white truncate">{org.name}</div>
                {org.description && (
                  <div className="text-xs text-gray-400 dark:text-white/35 truncate mt-0.5">{org.description}</div>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-white/30">
                    <Users size={9} />
                    Mitglieder
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-white/30">
                    <FolderOpen size={9} />
                    Projekte
                  </span>
                  <span className="font-mono text-[10px] text-gray-300 dark:text-white/15">{org.slug}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 dark:text-white/20 group-hover:text-[#ff1a1a]/60 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
