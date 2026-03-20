/**
 * Tests für Schema-Konfiguration in:
 *   - src/lib/supabase/client.ts  (Browser-Client)
 *   - src/lib/supabase/server.ts  (Server-Client)
 *
 * Prüft ob NEXT_PUBLIC_DB_SCHEMA korrekt an createBrowserClient
 * bzw. createServerClient weitergegeben wird.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

const mockCreateBrowserClient = vi.fn(() => ({}));
const mockCreateServerClient  = vi.fn(() => ({}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mockCreateBrowserClient,
  createServerClient:  mockCreateServerClient,
}));

// next/headers muss gemockt werden damit server.ts importierbar ist
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: vi.fn(() => []),
    set:    vi.fn(),
  })),
}));

afterEach(() => {
  vi.resetModules();
  mockCreateBrowserClient.mockClear();
  mockCreateServerClient.mockClear();
});

// ── Browser-Client ───────────────────────────────────────────

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

// ── Server-Client ────────────────────────────────────────────

describe('supabase server – Schema-Konfiguration', () => {
  it('verwendet "public" als Standard-Schema wenn NEXT_PUBLIC_DB_SCHEMA nicht gesetzt', async () => {
    delete process.env.NEXT_PUBLIC_DB_SCHEMA;
    process.env.NEXT_PUBLIC_SUPABASE_URL      = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { createClient } = await import('@/lib/supabase/server');
    await createClient();

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({ db: { schema: 'public' } }),
    );
  });

  it('verwendet "test" wenn NEXT_PUBLIC_DB_SCHEMA=test gesetzt ist', async () => {
    process.env.NEXT_PUBLIC_DB_SCHEMA         = 'test';
    process.env.NEXT_PUBLIC_SUPABASE_URL      = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { createClient } = await import('@/lib/supabase/server');
    await createClient();

    expect(mockCreateServerClient).toHaveBeenCalledWith(
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

    const { createClient } = await import('@/lib/supabase/server');
    await createClient();

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ db: { schema: 'prod' } }),
    );

    delete process.env.NEXT_PUBLIC_DB_SCHEMA;
  });
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
