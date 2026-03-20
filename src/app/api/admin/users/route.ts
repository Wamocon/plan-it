import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { UserRole } from '@/types';

const VALID_ROLES: UserRole[] = ['admin', 'it-architect', 'developer', 'user'];

function makeSupabase(req: NextRequest, res: NextResponse) {
  const schema = process.env.NEXT_PUBLIC_DB_SCHEMA ?? 'public';
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema },
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(c) { c.forEach(({ name, value, options }) => res.cookies.set(name, value, options as Record<string, unknown>)); },
      },
    }
  );
}

async function getCallerRole(req: NextRequest, res: NextResponse): Promise<UserRole | null> {
  const supabase = makeSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  return (data?.role as UserRole) ?? null;
}

/** GET /api/admin/users – Alle Nutzerprofile zurückgeben */
export async function GET(request: NextRequest) {
  const response = NextResponse.json({});
  const callerRole = await getCallerRole(request, response);
  if (callerRole !== 'admin') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
  }

  const supabase = makeSupabase(request, response);
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ users: data ?? [] }, { headers: response.headers });
}

/** PATCH /api/admin/users – Rolle eines Nutzers ändern */
export async function PATCH(request: NextRequest) {
  const response = NextResponse.json({});
  const callerRole = await getCallerRole(request, response);
  if (callerRole !== 'admin') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
  }

  const body = await request.json() as { userId?: string; role?: string };
  const { userId, role } = body;

  if (!userId || !role || !VALID_ROLES.includes(role as UserRole)) {
    return NextResponse.json({ error: 'Ungültige Parameter' }, { status: 400 });
  }

  const supabase = makeSupabase(request, response);
  const { error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { headers: response.headers });
}
