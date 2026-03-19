'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/stores/appStore';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const loadFromSupabase = useAppStore(s => s.loadFromSupabase);

  const isAuthPage = pathname.startsWith('/auth/');

  // Load cloud data once on mount (no-op when user is not logged in)
  useEffect(() => {
    void loadFromSupabase();
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
