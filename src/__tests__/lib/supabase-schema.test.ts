/**
 * Tests für Schema-Konfiguration in src/lib/supabase/client.ts
 *
 * Prüft ob NEXT_PUBLIC_DB_SCHEMA korrekt an createBrowserClient
 * weitergegeben wird.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

const mockCreateBrowserClient = vi.fn(() => ({}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mockCreateBrowserClient,
}));

// Stellt sicher dass das Modul bei jedem Test frisch geladen wird,
// damit process.env-Änderungen greifen.
afterEach(() => {
  vi.resetModules();
  mockCreateBrowserClient.mockClear();
});

describe('supabase client – Schema-Konfiguration', () => {
  it('verwendet "public" als Standard-Schema wenn NEXT_PUBLIC_DB_SCHEMA nicht gesetzt', async () => {
    delete process.env.NEXT_PUBLIC_DB_SCHEMA;
    process.env.NEXT_PUBLIC_SUPABASE_URL      = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { createClient } = await import('@/lib/supabase/client');
    createClient();

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({ db: { schema: 'public' } }),
    );
  });

  it('verwendet "test" wenn NEXT_PUBLIC_DB_SCHEMA=test gesetzt ist', async () => {
    process.env.NEXT_PUBLIC_DB_SCHEMA         = 'test';
    process.env.NEXT_PUBLIC_SUPABASE_URL      = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { createClient } = await import('@/lib/supabase/client');
    createClient();

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ db: { schema: 'test' } }),
    );

    delete process.env.NEXT_PUBLIC_DB_SCHEMA;
  });

  it('verwendet "prod" wenn NEXT_PUBLIC_DB_SCHEMA=prod gesetzt ist', async () => {
    process.env.NEXT_PUBLIC_DB_SCHEMA         = 'prod';
    process.env.NEXT_PUBLIC_SUPABASE_URL      = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { createClient } = await import('@/lib/supabase/client');
    createClient();

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ db: { schema: 'prod' } }),
    );

    delete process.env.NEXT_PUBLIC_DB_SCHEMA;
  });

  it('wirft Fehler wenn Supabase-Env-Variablen fehlen', async () => {
    delete process.env.NEXT_PUBLIC_DB_SCHEMA;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { createClient } = await import('@/lib/supabase/client');
    expect(() => createClient()).toThrow('Supabase ist nicht konfiguriert');
  });
});
