import { NextResponse, type NextRequest } from 'next/server';
import { Client, Account } from 'node-appwrite';

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT   ?? 'http://localhost:9080/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? 'myproject';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth- und API-Routen immer ohne Session-Prüfung durchlassen
  if (pathname.startsWith('/auth/') || pathname.startsWith('/api/')) {
    return NextResponse.next({ request });
  }

  // Appwrite-Session aus Cookie lesen (Browser-SDK setzt a_session_{projectId})
  const sessionCookie =
    request.cookies.get(`a_session_${PROJECT_ID}`)?.value ??
    request.cookies.get(`a_session_${PROJECT_ID}_legacy`)?.value;

  if (sessionCookie) {
    const client = new Client()
      .setEndpoint(ENDPOINT)
      .setProject(PROJECT_ID)
      .setSession(sessionCookie);
    try {
      await new Account(client).get();
      return NextResponse.next({ request });
    } catch {
      // Ungültige oder abgelaufene Session → Redirect
    }
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
