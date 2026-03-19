'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import { AppLogoWordmark } from '@/components/ui/AppLogo';
import { useAppStore } from '@/stores/appStore';

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    // Clear local state so the next user starts fresh
    useAppStore.setState({ projects: [], jiraConfigs: [], aiConfigs: [] });
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <header
      className="border-b border-[#ff1a1a]/20 px-3 sm:px-5 flex items-stretch justify-between"
      style={{
        background: 'linear-gradient(to right, #2a0606 0%, #1a0303 30%, #2c1a1a 65%, #e8dada 100%)',
        boxShadow: '0 2px 28px rgba(255,26,26,0.12)',
        height: '64px',
      }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white/60 hover:text-white hover:bg-white/10 bg-transparent border-none cursor-pointer transition-colors shrink-0"
          aria-label="Menü öffnen"
        >
          <Menu size={20} />
        </button>
        <Link href="/" className="flex items-center no-underline">
          <AppLogoWordmark height={44} showTagline={true} />
        </Link>
      </div>
      <div className="flex items-stretch gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wamocon-logo.png" alt="WMC Logo" className="h-full w-auto object-contain" />
        <button
          onClick={handleLogout}
          title="Abmelden"
          className="flex items-center gap-1.5 my-auto px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/10 bg-transparent border border-white/10 hover:border-white/25 cursor-pointer transition-all"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Abmelden</span>
        </button>
      </div>
    </header>
  );
}
