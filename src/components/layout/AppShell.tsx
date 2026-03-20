'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/stores/appStore';
import { SEED_PROJECTS } from '@/lib/seed-data';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const loadFromSupabase = useAppStore(s => s.loadFromSupabase);
  const loadUserProfile  = useAppStore(s => s.loadUserProfile);

  const isAuthPage = pathname.startsWith('/auth/');

  // Load cloud data and user profile once on mount
  useEffect(() => {
    void loadFromSupabase()
      .then(async () => {
        // Nach Supabase-Load: wenn immer noch leer → Seed-Daten laden
        const projects = useAppStore.getState().projects;
        if (projects.length === 0) {
          useAppStore.setState({ projects: SEED_PROJECTS });
        }
        // Profil sequentiell laden – Session ist hier garantiert verfügbar
        await loadUserProfile();
      })
      .catch(() => {
        // Supabase nicht verfügbar → Seed-Daten laden wenn Store leer
        const projects = useAppStore.getState().projects;
        if (projects.length === 0) {
          useAppStore.setState({ projects: SEED_PROJECTS });
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth pages: render full-screen without shell chrome
  if (isAuthPage) return <>{children}</>;

  return (
    <>
      <Header onMenuToggle={() => setMobileMenuOpen(o => !o)} />
      <div className="flex flex-1 min-h-0">
        <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <main className="flex-1 overflow-auto main-content">{children}</main>
      </div>
    </>
  );
}
