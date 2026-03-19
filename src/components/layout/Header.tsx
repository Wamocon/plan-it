'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import { AppLogoWordmark } from '@/components/ui/AppLogo';
import { useTheme } from '@/components/ui/ThemeProvider';
import { useAppStore } from '@/stores/appStore';

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const router = useRouter();
  const { theme } = useTheme();

  async function handleLogout() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    // Clear local state so the next user starts fresh
    useAppStore.setState({ projects: [], jiraConfigs: [], aiConfigs: [] });
    router.push('/auth/login');
    router.refresh();
  }

  const headerBg = theme === 'dark'
    ? 'linear-gradient(to right, #2a0606 0%, #1a0303 30%, #2c1a1a 65%, #e8dada 100%)'
    : 'linear-gradient(to right, #fff0f0 0%, #fff5f5 30%, #fce8e8 65%, #f0c8c8 100%)';

  const headerShadow = theme === 'dark'
    ? '0 2px 28px rgba(255,26,26,0.12)'
    : '0 2px 28px rgba(255,26,26,0.08)';

  return (
    <header
      className="border-b border-[#ff1a1a]/20 px-3 sm:px-5 flex items-stretch justify-between"
      style={{ background: headerBg, boxShadow: headerShadow, height: '64px' }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-transparent border-none cursor-pointer transition-colors shrink-0 text-gray-600 hover:text-gray-900 hover:bg-black/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
          aria-label="Menü öffnen"
        >
          <Menu size={20} />
        </button>
        <Link href="/" className="flex items-center no-underline">
          <AppLogoWordmark height={44} showTagline={true} />
        </Link>
      </div>
      <div className="flex items-stretch gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wamocon-logo.png" alt="WMC Logo" className="h-full w-auto object-contain" />
        <button
          onClick={handleLogout}
          title="Abmelden"
          className="flex items-center gap-1.5 my-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-transparent cursor-pointer transition-all border text-gray-600 border-gray-300 hover:text-gray-900 hover:bg-black/10 hover:border-gray-400 dark:text-white/50 dark:border-white/10 dark:hover:text-white dark:hover:bg-white/10 dark:hover:border-white/25"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Abmelden</span>
        </button>
      </div>
    </header>
  );
}
