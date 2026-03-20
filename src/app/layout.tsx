import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://plan-it.io'),
  title: 'plan-IT – IT-Architektur analysieren · planen · umsetzen',
  description: 'IT-Architektur analysieren · planen · umsetzen',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="h-screen overflow-hidden flex flex-col">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
