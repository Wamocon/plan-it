import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Client, Account, ID } from 'node-appwrite';

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT   || 'http://localhost:9080/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'myproject';

function getClient() {
  return new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { mode: 'login' | 'register'; email: string; password: string };
  const { mode, email, password } = body;

  if (!email || !password || !['login', 'register'].includes(mode)) {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  try {
    const account = new Account(getClient());

    if (mode === 'register') {
      await account.create(ID.unique(), email, password);
    }

    const session = await account.createEmailPasswordSession(email, password);

    // Set the Appwrite session cookie so the middleware can verify it
    const cookieName  = `a_session_${PROJECT_ID}`;
    const response    = NextResponse.json({ ok: true });
    response.cookies.set(cookieName, session.secret, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      // secure: true in production – omit for localhost
    });
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler bei der Anmeldung';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieName = `a_session_${PROJECT_ID}`;
  const response   = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, '', { maxAge: 0, path: '/' });
  return response;
}
