import { NextResponse, type NextRequest } from 'next/server';

// node-appwrite ist NICHT Edge-Runtime-kompatibel und darf hier nicht importiert werden.
// Die vollständige Session-Validierung erfolgt in Server-Komponenten (lib/appwrite/server.ts).
// Die Middleware prüft nur die Cookie-Existenz als Lightweight-Guard.

const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? 'myproject';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth- und API-Routen immer ohne Session-Prüfung durchlassen
  if (pathname.startsWith('/auth/') || pathname.startsWith('/api/')) {
    return NextResponse.next({ request });
  }

  // Appwrite-Session oder lokaler Modus
  const sessionCookie =
    request.cookies.get(`a_session_${PROJECT_ID}`)?.value ??
    request.cookies.get(`a_session_${PROJECT_ID}_legacy`)?.value;
  const localCookie = request.cookies.get('plan-it-local')?.value;

  if (sessionCookie || localCookie) {
    return NextResponse.next({ request });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/auth/login';
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
