import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth callback – Appwrite handles sessions via cookies natively
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`);
}
