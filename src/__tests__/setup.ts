import { vi } from 'vitest';

// ── next/server shims ─────────────────────────────────────────
// Die echten next/server-Klassen erfordern eine vollständige Edge-Runtime.
// Für Unit-Tests genügen leichtgewichtige Shims.
vi.mock('next/server', () => ({
  NextRequest: class {
    private _body: string;
    constructor(_url: string, init: RequestInit = {}) {
      this._body = (init.body as string) ?? 'null';
    }
    async json() {
      return JSON.parse(this._body);
    }
  },
  NextResponse: {
    json: (data: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      _payload: data,
      status: (init?.status) ?? 200,
      async json() {
        return data;
      },
    }),
  },
}));

// ── localStorage-Mock (für Zustand persist-Middleware) ────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});
