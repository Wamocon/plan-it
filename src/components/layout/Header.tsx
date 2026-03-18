'use client';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { AppLogo } from '@/components/ui/AppLogo';

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
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
        <Link href="/" className="flex items-center gap-3 no-underline">
          <AppLogo size={42} />
          <div>
            <div className="text-white font-bold text-base leading-tight">plan-it</div>
            <div className="text-white/50 text-[10px] tracking-wide hidden sm:block">Architekturplaner – planen &amp; umsetzen</div>
          </div>
        </Link>
      </div>
      <div className="flex items-stretch">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wamocon-logo.png" alt="WMC Logo" className="h-full w-auto object-contain" />
      </div>
    </header>
  );
}
