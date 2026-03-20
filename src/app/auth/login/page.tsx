'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLogoWordmark } from '@/components/ui/AppLogo';
import { useAppStore } from '@/stores/appStore';

export default function LoginPage() {
  const router = useRouter();
  const loadFromSupabase = useAppStore(s => s.loadFromSupabase);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mode, email, password }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Fehler bei der Anmeldung');
      // Load user's cloud data before navigating so dashboard is ready immediately
      await loadFromSupabase();
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Anmeldung');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0809' }}>
      <div
        className="rounded-xl p-8 max-w-sm w-full"
        style={{
          background: 'linear-gradient(135deg, #1a0303 0%, #110202 100%)',
          border: '1px solid rgba(255,26,26,0.25)',
          boxShadow: '0 0 40px rgba(255,26,26,0.08)',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <AppLogoWordmark height={52} showTagline={true} forceDark />
        </div>

        {/* Tab-Umschalter */}
        <div className="flex rounded-lg overflow-hidden mb-6" style={{ border: '1px solid rgba(255,26,26,0.2)' }}>
          <button
            onClick={() => setMode('login')}
            className="flex-1 py-2 text-sm font-medium transition-colors"
            style={mode === 'login'
              ? { background: '#ff1a1a', color: '#fff' }
              : { background: 'transparent', color: 'rgba(255,255,255,0.4)' }}
          >
            Anmelden
          </button>
          <button
            onClick={() => setMode('register')}
            className="flex-1 py-2 text-sm font-medium transition-colors"
            style={mode === 'register'
              ? { background: '#ff1a1a', color: '#fff' }
              : { background: 'transparent', color: 'rgba(255,255,255,0.4)' }}
          >
            Registrieren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>E-Mail</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,26,26,0.2)' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(255,26,26,0.6)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,26,26,0.2)')}
              placeholder="name@firma.de"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Passwort</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-white text-sm outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,26,26,0.2)' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(255,26,26,0.6)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,26,26,0.2)')}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full rounded-lg py-2 text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ background: '#ff1a1a', color: '#fff', boxShadow: '0 0 16px rgba(255,26,26,0.3)' }}
          >
            {loading ? 'Lädt…' : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Noch kein Konto? Wähle &quot;Registrieren&quot; oben.
          </p>
        </div>
      </div>
    </div>
  );
}

