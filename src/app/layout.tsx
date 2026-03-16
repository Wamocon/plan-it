import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Sidebar } from '@/components/layout/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://a-plan.io'),
  title: 'Architekturplaner',
  description: 'Unternehmensarchitektur planen, analysieren und dokumentieren',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-[#0d0809] flex flex-col">
        <Header />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex-1 overflow-auto main-content">{children}</main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
