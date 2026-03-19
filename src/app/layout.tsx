import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://plan-it.io'),
  title: 'plan-IT – IT-Architektur analysieren · planen · umsetzen',
  description: 'IT-Architektur analysieren · planen · umsetzen',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-[#0d0809] flex flex-col">
        <AppShell>{children}</AppShell>
        <Footer />
      </body>
    </html>
  );
}
