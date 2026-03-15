import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const { baseUrl, email, apiToken } = body ?? {};

  if (!baseUrl || !email || !apiToken) {
    return NextResponse.json({ error: 'Fehlende Parameter.' }, { status: 400 });
  }

  const url = String(baseUrl).replace(/\/+$/, '');
  if (!/^https:\/\/.+/.test(url)) {
    return NextResponse.json({ error: 'Ungültige Jira-URL (HTTPS erforderlich).' }, { status: 400 });
  }

  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

  try {
    const response = await fetch(`${url}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Authentifizierung fehlgeschlagen. E-Mail oder API-Token prüfen.' }, { status: 401 });
    }

    const data = await response.json() as Record<string, string>;
    return NextResponse.json({
      displayName: data.displayName || data.emailAddress || 'Erfolgreich verbunden',
    });
  } catch {
    return NextResponse.json({ error: 'Verbindung zu Jira fehlgeschlagen.' }, { status: 502 });
  }
}
