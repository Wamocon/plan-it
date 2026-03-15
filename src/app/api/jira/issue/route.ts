import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const { config, task, projectName } = body as {
    config: Record<string, string>;
    task: Record<string, unknown>;
    projectName?: string;
  };

  if (!config?.baseUrl || !config?.email || !config?.apiToken || !config?.projectKey) {
    return NextResponse.json({ error: 'Jira-Konfiguration unvollständig.' }, { status: 400 });
  }
  if (!task?.item) {
    return NextResponse.json({ error: 'Aufgabentitel fehlt.' }, { status: 400 });
  }

  const baseUrl = String(config.baseUrl).replace(/\/+$/, '');
  if (!/^https:\/\/.+/.test(baseUrl)) {
    return NextResponse.json({ error: 'Ungültige Jira-URL (HTTPS erforderlich).' }, { status: 400 });
  }

  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

  const issuePayload = {
    fields: {
      project: { key: String(config.projectKey).toUpperCase() },
      summary: String(task.item).slice(0, 255),
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Projekt: ', marks: [{ type: 'strong' }] },
              { type: 'text', text: String(projectName || 'Unbekannt') },
            ],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Welle: ', marks: [{ type: 'strong' }] },
              { type: 'text', text: `Welle ${task.waveNumber ?? '?'} – ${task.waveTitle ?? ''}` },
            ],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Erstellt durch Architekturplaner.', marks: [{ type: 'em' }] },
            ],
          },
        ],
      },
      issuetype: { name: String(config.issueType || 'Task') },
    },
  };

  try {
    const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(issuePayload),
    });

    const data: Record<string, unknown> = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errors = data?.errors as Record<string, string> | undefined;
      const messages = data?.errorMessages as string[] | undefined;
      const errMsg =
        (messages && messages.length > 0 ? messages.join(', ') : null) ||
        (errors ? Object.values(errors).join(', ') : null) ||
        'Jira-Fehler';
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    return NextResponse.json({
      issueKey: data.key,
      issueUrl: `${baseUrl}/browse/${data.key}`,
    });
  } catch {
    return NextResponse.json({ error: 'Verbindung zu Jira fehlgeschlagen.' }, { status: 502 });
  }
}
