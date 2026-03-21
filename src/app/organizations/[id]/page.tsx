'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { OrgRole, ORG_ROLE_LABELS } from '@/types';
import {
  Building2, Users, FolderOpen, Settings, ArrowLeft,
  Plus, Trash2, Pencil, Loader2, X, Check, UserPlus, ChevronDown,
} from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';
import Link from 'next/link';

type Tab = 'members' | 'projects' | 'settings';

export default function OrganizationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const orgId = params.id;

  const organizations     = useAppStore(s => s.organizations);
  const loadOrganizations  = useAppStore(s => s.loadOrganizations);
  const updateOrganization = useAppStore(s => s.updateOrganization);
  const deleteOrganization = useAppStore(s => s.deleteOrganization);

  const currentOrgMembers  = useAppStore(s => s.currentOrgMembers);
  const loadOrgMembers     = useAppStore(s => s.loadOrgMembers);
  const addOrgMember       = useAppStore(s => s.addOrgMember);
  const updateOrgMemberRole = useAppStore(s => s.updateOrgMemberRole);
  const removeOrgMember    = useAppStore(s => s.removeOrgMember);

  const currentOrgProjects = useAppStore(s => s.currentOrgProjects);
  const loadOrgProjects    = useAppStore(s => s.loadOrgProjects);

  const userProfile = useAppStore(s => s.userProfile);
  const getMyOrgRole = useAppStore(s => s.getMyOrgRole);

  const [tab, setTab]       = useState<Tab>('members');
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole]  = useState<OrgRole | null>(null);

  // Settings-Formular
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Mitglied einladen (via User-ID)
  const [showInvite, setShowInvite]   = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole]   = useState<OrgRole>('member');
  const [inviting, setInviting]       = useState(false);
  const [inviteError, setInviteError] = useState('');

  const org = organizations.find(o => o.id === orgId);

  const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const cardBg      = theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (organizations.length === 0) await loadOrganizations();
      await Promise.all([loadOrgMembers(orgId), loadOrgProjects(orgId)]);
      setLoading(false);
    };
    void init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // Eigene Rolle aktualisieren nachdem Mitglieder geladen sind
  useEffect(() => {
    setMyRole(getMyOrgRole(orgId));
  }, [currentOrgMembers, orgId, getMyOrgRole]);

  // Settings-Felder befüllen
  useEffect(() => {
    if (org) { setEditName(org.name); setEditDesc(org.description ?? ''); }
  }, [org]);

  const canManage = myRole === 'owner' || myRole === 'admin';
  const isOwner   = myRole === 'owner';

  const handleSaveSettings = async () => {
    setSaving(true);
    await updateOrganization(orgId, { name: editName.trim(), description: editDesc.trim() || undefined });
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteOrganization(orgId);
    router.push('/organizations');
  };

  const handleInvite = async () => {
    if (!inviteUserId.trim()) { setInviteError('User-ID darf nicht leer sein.'); return; }
    setInviting(true);
    setInviteError('');
    await addOrgMember(orgId, inviteUserId.trim(), inviteRole);
    setInviting(false);
    setShowInvite(false);
    setInviteUserId('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Lade Organisation…</span>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <Building2 size={40} className="mx-auto mb-4 text-gray-300 dark:text-white/15" />
        <p className="font-semibold text-gray-500 dark:text-white/40">Organisation nicht gefunden.</p>
        <button onClick={() => router.push('/organizations')} className="mt-4 text-sm text-[#ff1a1a] hover:underline">
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Back + Header */}
      <button
        onClick={() => router.push('/organizations')}
        className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-white/35 hover:text-gray-700 dark:hover:text-white/60 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Alle Organisationen
      </button>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ff1a1a]/10 flex items-center justify-center">
            <Building2 size={22} className="text-[#ff1a1a]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">{org.name}</h1>
            {org.description && (
              <p className="text-sm text-gray-400 dark:text-white/40 mt-0.5">{org.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-[11px] text-gray-300 dark:text-white/20">{org.slug}</span>
              {myRole && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ff1a1a]/10 text-[#ff1a1a]/80">
                  {ORG_ROLE_LABELS[myRole]}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6" style={{ borderColor }}>
        {([
          { key: 'members', label: 'Mitglieder', icon: Users },
          { key: 'projects', label: 'Projekte', icon: FolderOpen },
          ...(canManage ? [{ key: 'settings', label: 'Einstellungen', icon: Settings }] : []),
        ] as { key: Tab; label: string; icon: React.ComponentType<{ size: number; className?: string }> }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
              tab === t.key
                ? 'border-[#ff1a1a] text-[#ff1a1a]'
                : 'border-transparent text-gray-400 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/55'
            }`}
          >
            <t.icon size={13} className="" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Mitglieder ── */}
      {tab === 'members' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 dark:text-white/40">
              {currentOrgMembers.length} Mitglied{currentOrgMembers.length !== 1 ? 'er' : ''}
            </span>
            {canManage && (
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff1a1a] text-white text-xs font-semibold hover:bg-[#e51515] transition-colors"
              >
                <UserPlus size={12} />
                Mitglied hinzufügen
              </button>
            )}
          </div>

          {/* Invite Modal */}
          {showInvite && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div
                className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
                style={{ background: theme === 'dark' ? '#1a0a0a' : '#fff', border: `1px solid ${borderColor}` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-gray-900 dark:text-white">Mitglied hinzufügen</h3>
                  <button onClick={() => { setShowInvite(false); setInviteError(''); }} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 dark:text-white/35 mb-1">User-ID (UUID)</label>
                    <input
                      className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ff1a1a]/30 font-mono"
                      style={{ borderColor }}
                      value={inviteUserId}
                      onChange={e => setInviteUserId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 dark:text-white/35 mb-1">Rolle</label>
                    <div className="relative">
                      <select
                        className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ff1a1a]/30 appearance-none"
                        style={{ borderColor }}
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value as OrgRole)}
                      >
                        <option value="member">Mitglied</option>
                        <option value="admin">Administrator</option>
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                    </div>
                  </div>
                  {inviteError && <p className="text-xs text-red-400">{inviteError}</p>}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setShowInvite(false); setInviteError(''); }}
                      className="flex-1 px-3 py-2 rounded-xl border text-sm font-semibold text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      style={{ borderColor }}
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleInvite}
                      disabled={inviting}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#ff1a1a] text-white text-sm font-semibold hover:bg-[#e51515] disabled:opacity-50 transition-colors"
                    >
                      {inviting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Hinzufügen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {currentOrgMembers.map(member => {
              const isSelf = member.userId === userProfile?.userId;
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ background: cardBg, borderColor }}
                >
                  <div className="w-8 h-8 rounded-full bg-[#ff1a1a]/10 flex items-center justify-center text-[#ff1a1a] text-xs font-bold shrink-0">
                    {(member.displayName || member.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {member.displayName || member.email || member.userId}
                      {isSelf && <span className="ml-1.5 text-[10px] text-gray-400 dark:text-white/30 font-normal">(Du)</span>}
                    </div>
                    {member.email && member.displayName && (
                      <div className="text-xs text-gray-400 dark:text-white/30 truncate">{member.email}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && !isSelf && member.role !== 'owner' ? (
                      <select
                        className="px-2 py-0.5 rounded-lg border text-xs bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ff1a1a]/30"
                        style={{ borderColor }}
                        value={member.role}
                        onChange={e => updateOrgMemberRole(orgId, member.userId, e.target.value as OrgRole)}
                      >
                        <option value="admin">Administrator</option>
                        <option value="member">Mitglied</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        member.role === 'owner'
                          ? 'bg-amber-400/15 text-amber-500'
                          : member.role === 'admin'
                          ? 'bg-blue-400/15 text-blue-400'
                          : 'bg-gray-100 dark:bg-white/8 text-gray-400 dark:text-white/35'
                      }`}>
                        {ORG_ROLE_LABELS[member.role]}
                      </span>
                    )}
                    {canManage && !isSelf && member.role !== 'owner' && (
                      <button
                        onClick={() => removeOrgMember(orgId, member.userId)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                        title="Mitglied entfernen"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab: Projekte ── */}
      {tab === 'projects' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 dark:text-white/40">
              {currentOrgProjects.length} Projekt{currentOrgProjects.length !== 1 ? 'e' : ''}
            </span>
          </div>
          {currentOrgProjects.length === 0 ? (
            <div
              className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-12 gap-3 text-center"
              style={{ borderColor }}
            >
              <FolderOpen size={32} className="text-gray-300 dark:text-white/15" />
              <p className="text-sm text-gray-400 dark:text-white/30">Noch keine Projekte in dieser Organisation.</p>
              <p className="text-xs text-gray-300 dark:text-white/20">Projekte können im Dashboard einer Organisation zugeordnet werden.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {currentOrgProjects.map(project => {
                const score = project.analysis?.score ?? 0;
                return (
                  <Link
                    key={project.id}
                    href={`/project/${project.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border hover:border-[#ff1a1a]/30 transition-all group no-underline"
                    style={{ background: cardBg, borderColor }}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      score >= 71 ? 'bg-[#22aa66]' : score >= 51 ? 'bg-amber-400' : 'bg-red-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {project.data?.projectName || 'Unbenannt'}
                      </div>
                    </div>
                    <span className={`text-sm font-black shrink-0 ${
                      score >= 71 ? 'text-[#22aa66]' : score >= 51 ? 'text-amber-400' : 'text-red-400'
                    }`}>{score}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Einstellungen ── */}
      {tab === 'settings' && canManage && (
        <div className="flex flex-col gap-6">
          {/* Name & Beschreibung bearbeiten */}
          <div className="rounded-2xl border p-5" style={{ background: cardBg, borderColor }}>
            <h3 className="font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Pencil size={14} />
              Allgemein
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-white/35 mb-1.5">Name</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ff1a1a]/30"
                  style={{ borderColor }}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-white/35 mb-1.5">Beschreibung</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border text-sm bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ff1a1a]/30 resize-none"
                  style={{ borderColor }}
                  rows={3}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                />
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="self-end flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff1a1a] text-white text-sm font-semibold hover:bg-[#e51515] disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                {saving ? 'Speichere…' : 'Speichern'}
              </button>
            </div>
          </div>

          {/* Gefahrenzone */}
          {isOwner && (
            <div className="rounded-2xl border border-red-400/20 p-5" style={{ background: 'rgba(255,26,26,0.02)' }}>
              <h3 className="font-black text-red-400 mb-3 flex items-center gap-2">
                <Trash2 size={14} />
                Gefahrenzone
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/40 mb-4">
                Die Organisation wird dauerhaft gelöscht. Alle Mitgliedschaften und Projektzuordnungen werden aufgelöst.
                Projekte selbst bleiben erhalten.
              </p>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 rounded-xl border border-red-400/30 text-red-400 text-sm font-semibold hover:bg-red-400/10 transition-colors"
                >
                  Organisation löschen
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-red-400 font-semibold">Wirklich löschen?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Ja, löschen
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-lg border text-sm font-semibold text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    style={{ borderColor }}
                  >
                    Abbrechen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
