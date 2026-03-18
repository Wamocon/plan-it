import { NextResponse } from 'next/server';

/** Sets a local-mode cookie so the middleware lets the user through without Appwrite. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('plan-it-local', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  return response;
}
