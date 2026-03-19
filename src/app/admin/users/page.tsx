'use client';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { UserRole, USER_ROLE_LABELS, UserProfile } from '@/types';
import { Shield, Users, RefreshCw, ChevronDown } from 'lucide-react';

const ROLE_ORDER: UserRole[] = ['admin', 'it-architect', 'developer', 'user'];

const ROLE_COLORS: Record<UserRole, string> = {
  'admin':        'text-red-400 bg-red-400/10 border-red-400/20',
  'it-architect': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'developer':    'text-green-400 bg-green-400/10 border-green-400/20',
  'user':         'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

export default function AdminUsersPage() {
  const userProfile     = useAppStore(s => s.userProfile);
  const allUserProfiles = useAppStore(s => s.allUserProfiles);
  const loadUserProfile     = useAppStore(s => s.loadUserProfile);
  const loadAllUserProfiles = useAppStore(s => s.loadAllUserProfiles);
  const updateUserRole      = useAppStore(s => s.updateUserRole);

  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      await loadUserProfile();
      await loadAllUserProfiles();
      setLoading(false);
    }
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRoleChange(profile: UserProfile, newRole: UserRole) {
    setSaving(profile.userId);
    setOpenDropdown(null);
    await updateUserRole(profile.userId, newRole);
    setSaving(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={20} className="animate-spin text-[#ff1a1a]/60" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,26,26,0.12)', border: '1px solid rgba(255,26,26,0.2)' }}
        >
          <Shield size={18} className="text-[#ff1a1a]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Benutzerverwaltung</h1>
          <p className="text-sm text-gray-500 dark:text-white/40">
            Rollen der registrierten Nutzer verwalten
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); void loadAllUserProfiles().then(() => setLoading(false)); }}
          className="ml-auto p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="Aktualisieren"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Rollen-Legende */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {ROLE_ORDER.map(role => (
          <div
            key={role}
            className="rounded-xl p-3 border"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[role]}`}>
              {USER_ROLE_LABELS[role]}
            </span>
            <div className="text-[11px] text-gray-400 dark:text-white/35 mt-1.5">
              {role === 'admin'        && 'Voller Zugriff, Nutzerverwaltung'}
              {role === 'it-architect' && 'Projekte & Analysen erstellen'}
              {role === 'developer'    && 'Aufgaben bearbeiten'}
              {role === 'user'         && 'Nur lesender Zugriff'}
            </div>
          </div>
        ))}
      </div>

      {/* Nutzerliste */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}
      >
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
          <Users size={14} className="text-white/30" />
          <span className="text-xs font-semibold text-white/30 uppercase tracking-widest">
            {allUserProfiles.length} Nutzer
          </span>
        </div>

        {allUserProfiles.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500 dark:text-white/30">
            Noch keine Nutzerprofile vorhanden.
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {allUserProfiles.map(profile => {
              const isCurrentUser = profile.userId === userProfile?.userId;
              const isSaving      = saving === profile.userId;
              const isOpen        = openDropdown === profile.userId;

              return (
                <li key={profile.userId} className="flex items-center gap-4 px-5 py-3.5">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-[#ff1a1a]/10 border border-[#ff1a1a]/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#ff1a1a]">
                      {(profile.displayName ?? profile.email).charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Name & E-Mail */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {profile.displayName ?? profile.email}
                      {isCurrentUser && (
                        <span className="ml-2 text-[10px] text-[#ff1a1a]/70 font-normal">(du)</span>
                      )}
                    </div>
                    {profile.displayName && (
                      <div className="text-xs text-gray-400 dark:text-white/35 truncate">{profile.email}</div>
                    )}
                  </div>

                  {/* Rollen-Auswahl */}
                  <div className="relative shrink-0">
                    <button
                      disabled={isCurrentUser || isSaving}
                      onClick={() => setOpenDropdown(isOpen ? null : profile.userId)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${ROLE_COLORS[profile.role]} ${
                        isCurrentUser
                          ? 'opacity-60 cursor-not-allowed'
                          : 'hover:opacity-80 cursor-pointer'
                      }`}
                    >
                      {isSaving ? (
                        <RefreshCw size={10} className="animate-spin" />
                      ) : (
                        USER_ROLE_LABELS[profile.role]
                      )}
                      {!isCurrentUser && !isSaving && <ChevronDown size={11} />}
                    </button>

                    {isOpen && (
                      <>
                        {/* Backdrop zum Schließen */}
                        <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                        <div
                          className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-xl py-1"
                          style={{ background: '#1a0303', border: '1px solid rgba(255,26,26,0.2)', minWidth: 160 }}
                        >
                          {ROLE_ORDER.map(role => (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(profile, role)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-white/5 ${
                                profile.role === role ? 'text-[#ff1a1a]' : 'text-white/70'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full border ${ROLE_COLORS[role]}`} />
                              {USER_ROLE_LABELS[role]}
                              {profile.role === role && (
                                <span className="ml-auto text-[10px] text-[#ff1a1a]/60">aktiv</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
