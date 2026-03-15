'use client';
import Link from 'next/link';
import { AppLogo } from '@/components/ui/AppLogo';

export function Header() {
  return (
    <header
      className="border-b border-[#ff1a1a]/20 px-5 flex items-stretch justify-between"
      style={{
        background: 'linear-gradient(to right, #2a0606 0%, #1a0303 30%, #2c1a1a 65%, #e8dada 100%)',
        boxShadow: '0 2px 28px rgba(255,26,26,0.12)',
        height: '64px',
      }}
    >
      <Link href="/" className="flex items-center gap-3 no-underline">
        <AppLogo size={42} />
        <div>
          <div className="text-white font-bold text-base leading-tight">Architekturplaner</div>
          <div className="text-white/50 text-[10px] tracking-wide">planen · analysieren · dokumentieren</div>
        </div>
      </Link>
      <div className="flex items-stretch">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wamocon-logo.png" alt="WMC Logo" className="h-full w-auto object-contain" />
      </div>
    </header>
  );
}
