'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccount, ID } from '@/lib/appwrite/auth';

export default function LoginPage() {
  const router = useRouter();
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
      const account = getAccount();
      if (mode === 'login') {
        await account.createEmailPasswordSession(email, password);
      } else {
        await account.create(ID.unique(), email, password);
        await account.createEmailPasswordSession(email, password);
      }
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Anmeldung');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-white mb-1">a-plan</div>
          <div className="text-gray-400 text-sm">Architektur-Analyse-Tool</div>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-gray-700 mb-6">
          <button onClick={() => setMode('login')} className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            Anmelden
          </button>
          <button onClick={() => setMode('register')} className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'register' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            Registrieren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">E-Mail</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="name@firma.de"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Passwort</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {loading ? 'Lädt\u2026' : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-xs">F\u00fcr lokale Nutzung einfach weiter ohne Login</p>
          <button
            onClick={() => router.push('/')}
            className="mt-2 w-full border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg py-2 text-sm transition-colors"
          >
            Ohne Anmeldung fortfahren \u2192
          </button>
        </div>
      </div>
    </div>
  );
}
