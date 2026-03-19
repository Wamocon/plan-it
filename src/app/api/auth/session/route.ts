import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Collects cookies that Supabase wants to write, then applies them to the response.
function makeClient(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(c) { c.forEach(({ name, value, options }) => res.cookies.set(name, value, options as any)); },
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const { mode, email, password } =
    await request.json() as { mode: 'login' | 'register'; email: string; password: string };

  if (!email || !password || !['login', 'register'].includes(mode)) {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  // Create response first so makeClient can attach cookies to it via setAll()
  const response = NextResponse.json({ ok: true });
  const supabase = makeClient(request, response);

  try {
    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      // Reuse same response object (cookies already attached by setAll)
      return NextResponse.json({ ok: true, registered: true }, { headers: response.headers });
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    return response; // session cookies set in headers by setAll()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Fehler bei der Anmeldung';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const supabase = makeClient(request, response);
  await supabase.auth.signOut();
  return response; // signOut triggers setAll → clears session cookie
}

