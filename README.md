# plan-it
### Architekturplaner – planen & umsetzen

Interaktives Tool zur Planung, Analyse und Dokumentation von Unternehmensarchitekturen – entwickelt von WAMOCON.

## Features

### Analyse & Planung
- **Projekt-Dashboard** — Übersicht aller Projekte mit KPI-Karten (Score, Risiken, KI-Analysen)
- **4-Schritte-Wizard** — Freitextfelder bei jeder Auswahl, vollständig konfigurierbar
- **KI-gestützte Analyse** — Google Gemini 2.0 Flash analysiert den Ist-Zustand individuell (5 Phasen)
- **Regelbasierter Fallback** — Lokal, ohne API-Key, immer verfügbar
- **Zielzustand-Empfehlung** — Automatisch generierte Soll-Architektur
- **5-Wellen-Umsetzungsplan** — Mit Deliverables und Zeitschätzungen

### Analyse-Tabs
| Tab | Inhalt |
|-----|--------|
| **Ist-Zustand** | Score, Bewertungsdetails, Technologie-Stack |
| **Risiken** | Risikokatalog nach Schweregrad (Hoch / Mittel / Niedrig) |
| **Risiko-Heatmap** | SVG-Matrix Impact × Wahrscheinlichkeit |
| **Soll-Zustand** | Empfohlene Zielarchitektur mit Begründung |
| **Umsetzungswellen** | 5-Wellen-Plan mit Items und Zeitrahmen |
| **Aufgaben** | Maßnahmen-Tracker mit Fortschrittsanzeige und Jira-Integration |
| **Score-Trend** | Historische Entwicklung des Architektur-Scores |
| **KI-Chat** | Nachfragen zur Analyse direkt im Projekt |

### Maßnahmen-Tracker
- Aufgaben aus Umsetzungswellen als Tickets anlegen
- Status-Zyklus: Offen → In Arbeit → Erledigt
- Inline-Notizen pro Aufgabe
- Gesamtfortschritts-Balken

### Jira-Integration
- Beliebige Jira-Instanzen (Cloud & Server) einbinden
- API-Token-Authentifizierung, Verbindungstest direkt in der App
- Mit einem Klick eine Aufgabe als Jira-Vorgang anlegen
- Mehrere Instanzen konfigurierbar (Auswahl beim Push)
- Verlinkung zum erstellten Vorgang direkt im Tracker

### Weitere Features
- **Projektvergleich** — Zwei Projekte nebeneinander mit Score, Metriken, Risiken und Tech-Stack-Diff
- **Score-Trend** — Automatischer Snapshot bei jeder Re-Analyse
- **KI-Chat** — Kontextbezogene Antworten auf Basis der vollständigen Analyse
- **PDF & DOCX Export** — Analysebericht exportieren
- **Persistenz** — Lokale Speicherung via Zustand + localStorage **oder** vollständige Appwrite-Persistenz (Cloud/Self-Hosted)

---

## Schnellstart

```bash
# Dependencies installieren
npm install

# Umgebungsvariablen anlegen
cp .env.example .env.local
# GOOGLE_AI_API_KEY=dein_key_hier eintragen (optional)

# Starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

**Ohne KI-API-Key** funktioniert die App mit regelbasierter Analyse.  
**Mit KI-API-Key** analysiert Google Gemini die Daten individuell und gibt spezifischere Empfehlungen.  
**Authentifizierung:** Die App erfordert eine laufende Appwrite-Instanz. Ohne gültige Session wird auf `/auth/login` umgeleitet.

---

## Lokale Schema-Inspektion (Docker)

Die mitgelieferte `docker-compose.yml` startet PostgreSQL + pgAdmin zur Inspektion des SQL-Schemas. Dies spiegelt die Collection-Struktur der Appwrite-Datenbank:

```bash
# PostgreSQL + pgAdmin starten
npm run db:start

# pgAdmin öffnen: http://localhost:5050
# Login: admin@local.dev / admin
# PostgreSQL: localhost:5432 / plan-it / postgres / postgres

# DB stoppen
npm run db:stop

# DB zurücksetzen (alle Daten löschen + Schema neu einspielen)
npm run db:reset

# Logs anzeigen
npm run db:logs
```

Das SQL-Schema wird beim ersten Start automatisch aus `supabase/migrations/` eingespielt (Referenz-Schema; die Laufzeit-Persistenz erfolgt über Appwrite).

---

## Appwrite-Integration (Auth + Cloud-Datenbank)

Für persistente Cloud-Speicherung mit Authentifizierung:

1. Appwrite-Instanz anlegen – [Appwrite Cloud](https://cloud.appwrite.io) (kostenlos) oder Self-Hosted
2. Neues Projekt anlegen, Projekt-ID notieren
3. Datenbank `plan-it` anlegen
4. Collections anlegen: `projects`, `tasks`, `chat_messages`, `analysis_snapshots`, `jira_configs`, `ai_configs`
5. API-Key in Appwrite erstellen (alle Datenbank-Scopes)
6. Umgebungsvariablen setzen:

```bash
# .env.local
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=dein-projekt-id
APPWRITE_API_KEY=dein-api-key
NEXT_PUBLIC_APPWRITE_DATABASE_ID=plan-it
```

7. App starten — Benutzer werden automatisch auf `/auth/login` weitergeleitet (E-Mail/Passwort)

> **Lokaler Betrieb:** Ohne laufende Appwrite-Instanz werden alle Anfragen auf `/auth/login` umgeleitet.
> Für rein lokale Tests kann Appwrite per Docker gestartet werden (siehe [Appwrite-Dokumentation](https://appwrite.io/docs/self-hosting)).

---

## Jira einrichten

1. **Einstellungen** in der Sidebar öffnen
2. **Neue Verbindung** anlegen: Jira-URL, E-Mail, [API-Token](https://id.atlassian.com/manage-profile/security/api-tokens), Projekt-Schlüssel und Vorgangstyp
3. Verbindung testen
4. Im **Aufgaben-Tab** eines Projekts: Hover über eine Aufgabe → Link-Icon klicken → Jira-Vorgang wird angelegt

---

## Analyse-Architektur

```
Wizard-Daten
    │
    ▼
┌─────────────────────┐
│ POST /api/analyze    │
│                      │
│ ┌─ Gemini API Key?──┐│
│ │  JA: KI-Analyse   ││  ← 5-Phasen-Analyse (Ist, Risiken,
│ │  (Gemini 2.0 Flash)││    Soll, Wellen, Score)
│ │                    ││
│ │  NEIN: Fallback    ││  ← Regelbasierte If-Then-Analyse
│ │  (lokal)           ││    Funktioniert immer, generischer
│ └────────────────────┘│
└─────────────────────┘
    │
    ▼
Analysebericht mit 8 Tabs + Chat + Jira-Anbindung
```

---

## Tech Stack

- **Next.js 16** (App Router, latest)
- **React 18** + TypeScript
- **Tailwind CSS** — Dark Theme, WAMOCON Corporate Design
- **Zustand** mit `persist`-Middleware (localStorage)
- **Appwrite** (`node-appwrite`) — Auth + Cloud-DB (optional)
- **PostgreSQL 16** via Docker — Lokale Schema-Inspektion (pgAdmin)
- **Google Generative AI** — Gemini 2.0 Flash
- **jsPDF + docx** — PDF & Word Export
- **lucide-react** — Icons
- **SVG-Charts** — Heatmap, Trendlinie (kein externes Chart-Framework)
- **Vitest** — Unit-Tests mit Coverage

---

## Projektstruktur

```
src/
├── app/
│   ├── page.tsx                        # Dashboard mit KPI-Karten
│   ├── wizard/page.tsx                 # Neues Projekt (4-Schritte)
│   ├── project/[id]/page.tsx           # Projekt-Detailansicht
│   ├── compare/page.tsx                # Projektvergleich
│   ├── settings/page.tsx               # Jira-Verbindungen verwalten
│   └── api/
│       ├── analyze/route.ts            # KI-Analyse (Gemini + Fallback)
│       ├── chat/route.ts               # KI-Chat Proxy
│       └── jira/
│           ├── issue/route.ts          # Jira-Vorgang anlegen
│           └── test/route.ts           # Jira-Verbindung testen
├── components/
│   ├── layout/
│   │   ├── Header.tsx                  # WAMOCON Header mit AppLogo
│   │   ├── Footer.tsx                  # Slim-Banner Footer
│   │   └── Sidebar.tsx                 # Navigation & Projekt-Schnellzugriff
│   ├── analysis/
│   │   ├── AnalysisView.tsx            # 8-Tab Analyse-Ansicht
│   │   ├── TaskTracker.tsx             # Maßnahmen-Tracker + Jira
│   │   ├── ProjectChat.tsx             # KI-Chat Komponente
│   │   ├── RiskHeatmap.tsx             # SVG Risiko-Heatmap
│   │   └── ScoreTrend.tsx              # SVG Score-Trendlinie
│   ├── ui/
│   │   ├── AppLogo.tsx                 # Isometrisches SVG-Logo
│   │   ├── SmartSelect.tsx             # Select mit Freitext-Option
│   │   └── MultiSelect.tsx
│   └── wizard/WizardForm.tsx
├── lib/
│   ├── appwrite/
│   │   ├── auth.ts                     # Auth-Client (E-Mail/Passwort, Appwrite Account API)
│   │   ├── client.ts                   # Server- und Browser-Client (node-appwrite)
│   │   └── db.ts                       # CRUD-Layer (20+ Funktionen, Appwrite Databases)
│   ├── fallback-analysis.ts            # Regelbasierte Analyse
│   ├── wizard-steps.ts                 # Wizard-Konfiguration
│   ├── export-pdf.ts
│   └── export-word.ts
├── middleware.ts                        # Auth-Guard (Appwrite-Session-Cookie, Redirect zu /auth/login)
├── stores/appStore.ts                  # Zustand Store + Appwrite-Persistenz
└── types/index.ts                      # Alle TypeScript-Typen

supabase/
└── migrations/
    ├── 00000000000000_local_dev_schema.sql   # SQL-Schema für lokale Inspektion via pgAdmin
    └── 20240101000000_initial_schema.sql     # SQL-Referenzschema (Appwrite Collections spiegeln diese Struktur)

docker-compose.yml                      # PostgreSQL 16 + pgAdmin
```

---

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `GOOGLE_AI_API_KEY` | Google Gemini API Key ([kostenlos holen](https://aistudio.google.com/app/apikey)) |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Appwrite API-Endpunkt (Standard: `https://cloud.appwrite.io/v1`) |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | Appwrite Projekt-ID |
| `APPWRITE_API_KEY` | Appwrite API-Key (server-seitig, alle DB-Scopes) |
| `NEXT_PUBLIC_APPWRITE_DATABASE_ID` | Appwrite Datenbank-ID (Standard: `plan-it`) |

---

## Tests

```bash
# Alle Tests ausführen
npm test

# Mit Coverage-Report
npm run test:coverage
```

| Bereich | Tests |
|---------|-------|
| Zustand Store (appStore) | Unit-Tests aller Actions |
| Appwrite DB-Layer | 66 Tests (CRUD, Auth, Fehlerbehandlung) |
| Middleware (Auth-Guard) | 10 Tests |
| Auth Callback + Schema | 11 Tests |
| API-Routen (analyze, chat, jira) | Integration-Tests |
| Docker-Infrastruktur | 34 Validierungstests |

