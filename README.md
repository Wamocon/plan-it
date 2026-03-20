# plan-it
### IT-Architekturplaner – analysieren, planen & umsetzen

Interaktives Tool zur KI-gestützten Analyse, Planung und Dokumentation von IT-Architekturen – entwickelt von WAMOCON.

## Features

### Analyse & Planung
- **Projekt-Dashboard** — Übersicht aller Projekte mit KPI-Karten (Score, Risiken, Trends)
- **4-Schritte-Wizard** — Strukturierte Erfassung von Team, Stack, Prozessen und Infrastruktur
- **KI-gestützte Analyse** — Google Gemini 2.0 Flash bewertet den Ist-Zustand in 5 Phasen
- **Regelbasierter Fallback** — Lokal, ohne API-Key, immer verfügbar
- **Architektur-Score** — Technische Reifegrad-Bewertung 0–100 mit Label (Kritisch → Hervorragend)
- **Zielzustand-Empfehlung** — Automatisch generierte Soll-Architektur
- **5-Wellen-Umsetzungsplan** — Mit Deliverables und Zeitschätzungen

### Analyse-Tabs
| Tab | Inhalt |
|-----|--------|
| **Ist-Zustand** | Score, Bewertungsdetails, Technologie-Stack |
| **Risiken** | Risikokatalog nach Schweregrad (Hoch / Mittel / Niedrig) |
| **Risiko-Heatmap** | SVG-Matrix Impact × Wahrscheinlichkeit |
| **Soll-Zustand** | Empfohlene Zielarchitektur mit Begründung |
| **Umsetzungswellen** | Wellenplan mit Items und Zeitrahmen |
| **Aufgaben** | Maßnahmen-Tracker mit Fortschrittsanzeige und Jira-Integration |
| **Score-Trend** | Historische Entwicklung des Architektur-Scores |
| **KI-Chat** | Nachfragen zur Analyse direkt im Projekt |

### Maßnahmen-Tracker
- Aufgaben aus Umsetzungswellen als Tickets anlegen
- Status-Zyklus: Offen → In Arbeit → Erledigt
- Inline-Notizen pro Aufgabe
- Gesamtfortschritts-Balken
- Externe Jira-Verlinkung pro Task

### Globale Aufgabenübersicht (`/tasks`)
- Alle offenen Tasks über alle Projekte hinweg
- Filterung nach Status und Projekt

### Jira-Integration
- Beliebige Jira-Instanzen (Cloud & Server) einbinden
- API-Token-Authentifizierung, Verbindungstest direkt in der App
- Mit einem Klick eine Aufgabe als Jira-Vorgang anlegen
- Mehrere Instanzen konfigurierbar (Auswahl beim Push)
- Verlinkung zum erstellten Vorgang direkt im Tracker

### Benutzerverwaltung & Rollen
- Rollensystem: `admin` · `it-architect` · `developer` · `user`
- Admin-Interface unter `/admin/users` zur Rollen- und Profilverwaltung
- Automatische Profilerstellung bei Registrierung (Trigger)
- Supabase Auth mit E-Mail/Passwort

### Weitere Features
- **Projektvergleich** — Zwei Projekte nebeneinander mit Score, Metriken, Risiken und Tech-Stack-Diff
- **Score-Trend** — Automatischer Snapshot bei jeder Re-Analyse
- **KI-Chat** — Kontextbezogene Antworten auf Basis der vollständigen Analyse
- **PDF & DOCX Export** — Professioneller Analysebericht exportieren
- **Dark/Light Mode** — Vollständige Theme-Unterstützung
- **Supabase Persistenz** — Vollständige Cloud-Datenhaltung mit RLS

---

## Schnellstart

```bash
# Dependencies installieren
npm install

# Umgebungsvariablen anlegen
cp .env.example .env.local
# Werte eintragen (siehe Abschnitt "Umgebungsvariablen")

# Starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

**Ohne KI-API-Key** funktioniert die App mit regelbasierter Fallback-Analyse.  
**Mit KI-API-Key** analysiert Google Gemini 2.0 Flash die Architektur individuell.  
**Authentifizierung:** Supabase Auth — ohne gültige Session wird auf `/auth/login` umgeleitet.

---

## Umgebungsvariablen

```bash
# .env.local
GOOGLE_AI_API_KEY=          # Google Gemini API Key (kostenlos: aistudio.google.com)

NEXT_PUBLIC_SUPABASE_URL=   # Supabase Projekt-URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase Publishable Key

# Nur für Seed-Skript (npm run seed:supabase) – nie im Frontend verwenden!
SUPABASE_SERVICE_ROLE_KEY=  # Supabase Secret Key
SEED_USER_ID=               # UUID des Users für Seed-Daten
```

| Variable | Typ | Beschreibung |
|----------|-----|-------------|
| `GOOGLE_AI_API_KEY` | Optional | Gemini 2.0 Flash. Ohne Key → Fallback-Analyse |
| `NEXT_PUBLIC_SUPABASE_URL` | Pflicht | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pflicht | Project Settings → API Keys → Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Seed only | Project Settings → API Keys → Secret key |
| `SEED_USER_ID` | Seed only | Authentication → Users → User-UUID |

---

## Supabase-Integration

### Ersteinrichtung (einmalig)

Schema im Supabase SQL-Editor ausführen:  
Dashboard → **SQL Editor** → **New query** → Inhalt von `scripts/setup-supabase-schema.sql` einfügen → **Run**

### Testdaten einspielen (20 Demo-Projekte)

```bash
npm run seed:supabase
```

Fügt 20 realistische Demo-Projekte mit Risiken, Umsetzungswellen und Tasks ein.

### Daten zurücksetzen und neu befüllen

```bash
# 1. Alle Projektdaten löschen (im Supabase SQL Editor):
TRUNCATE public.analysis_snapshots, public.chat_messages, public.tasks, public.projects CASCADE;

# 2. Seed neu einspielen:
npm run seed:supabase
```

Falls auch das Schema neu aufgesetzt werden soll: `scripts/setup-supabase-schema.sql` erneut im SQL Editor ausführen, dann Seed.

### Datenbankschema

| Tabelle | Inhalt |
|---------|--------|
| `projects` | Wizard-Daten (JSONB) + Analyse-Ergebnisse (JSONB) |
| `tasks` | Maßnahmen mit Status, Notizen, Jira-Verknüpfung |
| `chat_messages` | KI-Chat-Historie pro Projekt |
| `analysis_snapshots` | Historische Score-Snapshots (Score-Trend) |
| `user_profiles` | Rollen (`admin`, `it-architect`, `developer`, `user`) |
| `ai_configs` | Gespeicherte KI-API-Keys |
| `jira_configs` | Jira-Verbindungskonfigurationen |

Alle Tabellen sind durch **Row Level Security** geschützt (`auth.uid() = user_id`).

---

## Lokale Entwicklung (Docker)

```bash
# PostgreSQL + pgAdmin starten
npm run db:start

# pgAdmin öffnen: http://localhost:5050
# Login: admin@local.dev / admin
# PostgreSQL: localhost:5432 / plan-it / postgres / postgres

npm run db:stop      # stoppen
npm run db:reset     # zurücksetzen (Volume löschen + neu starten)
npm run db:logs      # Logs anzeigen
```

---

## Rollen-Konzept

| Rolle | Berechtigungen |
|-------|---------------|
| `admin` | Voller Zugriff + Rollenverwaltung unter `/admin/users` |
| `it-architect` | Projekte erstellen, Analysen durchführen |
| `developer` | Tasks einsehen und bearbeiten |
| `user` | Lesender Zugriff |

Rollen werden bei Registrierung automatisch als `user` angelegt (Supabase Trigger).  
Admins können Rollen im Admin-Interface ändern.

---

## Jira einrichten

1. **Einstellungen** (`/settings`) in der Sidebar öffnen
2. **Neue Verbindung** anlegen: Jira-URL, E-Mail, [API-Token](https://id.atlassian.com/manage-profile/security/api-tokens), Projekt-Schlüssel und Vorgangstyp
3. **Verbindung testen** — direkter Ping aus der App
4. Im **Aufgaben-Tab** eines Projekts: Hover über eine Aufgabe → Link-Icon → Jira-Vorgang wird angelegt

---

## API-Routen

| Route | Methode | Beschreibung |
|-------|---------|-------------|
| `/api/analyze` | POST | KI-Analyse via Gemini (5-Phasen) oder Fallback |
| `/api/chat` | POST | KI-Chat-Proxy mit Projektkontext |
| `/api/sync` | POST | Supabase-Datensync für lokale Zustand-Änderungen |
| `/api/jira/issue` | POST | Jira-Vorgang aus Task erstellen |
| `/api/jira/test` | POST | Jira-Verbindung testen |
| `/api/admin/users` | GET/PATCH | Benutzerverwaltung (Admin only) |
| `/api/auth/session` | POST/DELETE | Supabase Session verwalten |
| `/auth/callback` | GET | Supabase Auth OAuth-Callback |

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
│ │  JA: KI-Analyse   ││  ← 5-Phasen (Ist, Risiken, Soll, Wellen, Score)
│ │  (Gemini 2.0 Flash)│
│ │  NEIN: Fallback   ││  ← Regelbasierte If-Then-Analyse (lokal, immer verfügbar)
│ └────────────────────┘│
└─────────────────────┘
    │
    ▼
Analysebericht (8 Tabs) + Chat + Export + Jira
```

---

## Tech Stack

| Bereich | Technologie |
|---------|------------|
| Framework | Next.js 16.1 (App Router) |
| Sprache | TypeScript 5.3 |
| Styling | Tailwind CSS 3.4, tailwind-merge |
| Icons | lucide-react |
| Auth + DB | Supabase (`@supabase/supabase-js` 2.99, `@supabase/ssr` 0.9) |
| KI | Google Generative AI 0.21 (Gemini 2.0 Flash) |
| State | Zustand 4.5 mit persist-Middleware |
| Export | jsPDF 4.2 + jspdf-autotable, docx 9.6 |
| Datum | date-fns 3.6 |
| Testing | Vitest 2.1 + @vitest/coverage-v8 |
| Dev-Tools | tsx, dotenv, ESLint |
| Infra (lokal) | Docker (PostgreSQL 16 + pgAdmin) |

---

## Projektstruktur

```
src/
├── app/
│   ├── page.tsx                        # Dashboard
│   ├── wizard/page.tsx                 # Neues Projekt (Wizard)
│   ├── project/[id]/page.tsx           # Projektdetails (8 Analyse-Tabs)
│   ├── compare/page.tsx                # Projektvergleich
│   ├── tasks/page.tsx                  # Globale Aufgabenübersicht
│   ├── settings/page.tsx               # Jira + KI-Konfiguration
│   ├── admin/users/page.tsx            # Benutzerverwaltung (Admin)
│   ├── auth/
│   │   ├── login/page.tsx              # Login / Registrierung
│   │   └── callback/route.ts           # Supabase Auth Callback
│   └── api/
│       ├── analyze/route.ts            # KI-Analyse (Gemini + Fallback)
│       ├── chat/route.ts               # KI-Chat Proxy
│       ├── sync/route.ts               # Supabase Datensync
│       ├── admin/users/route.ts        # User-Verwaltung (Admin)
│       ├── auth/session/route.ts       # Session Management
│       └── jira/
│           ├── issue/route.ts          # Jira-Vorgang erstellen
│           └── test/route.ts           # Jira-Verbindung testen
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx                # Layout-Wrapper + Datensync
│   │   ├── Header.tsx                  # Header mit Theme-Toggle
│   │   ├── Footer.tsx                  # Footer
│   │   └── Sidebar.tsx                 # Navigation + Projekt-Schnellzugriff
│   ├── analysis/
│   │   ├── AnalysisView.tsx            # 8-Tab-Hub für Analyseergebnisse
│   │   ├── TaskTracker.tsx             # Maßnahmen-Tracker + Jira-Push
│   │   ├── ProjectChat.tsx             # KI-Chat mit Markdown
│   │   ├── RiskHeatmap.tsx             # SVG Impact × Probability Matrix
│   │   └── ScoreTrend.tsx              # SVG Score-Verlaufslinie
│   ├── ui/
│   │   ├── AppLogo.tsx                 # Isometrisches SVG-Logo
│   │   ├── SmartSelect.tsx             # Select mit Freitext-Option
│   │   ├── MultiSelect.tsx             # Multi-Auswahl
│   │   ├── ThemeProvider.tsx           # Dark/Light Mode Provider
│   │   └── ThemeToggle.tsx             # Theme-Umschalter
│   └── wizard/WizardForm.tsx           # Dynamisches Wizard-Formular
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser-Client
│   │   ├── server.ts                   # Server-Client (SSR)
│   │   └── db.ts                       # CRUD-Layer (alle DB-Operationen)
│   ├── fallback-analysis.ts            # Regelbasierte Analyse
│   ├── wizard-steps.ts                 # Wizard-Konfiguration
│   ├── export-pdf.ts                   # PDF-Export
│   └── export-word.ts                  # Word-Export
├── middleware.ts                        # Auth-Guard (schützt alle Routen)
├── stores/appStore.ts                  # Zustand Store
└── types/index.ts                      # Alle TypeScript-Typen

scripts/
├── seed-supabase.ts                    # 20 Demo-Projekte einspielen
└── setup-supabase-schema.sql           # Produktions-Schema (einmalig)

supabase/migrations/
├── 00000000000000_local_dev_schema.sql # Schema für lokales Docker-Setup
├── 00000000000001_seed_data.sql        # Lokale Seed-Daten (15 Projekte)
├── 20240101000000_initial_schema.sql   # Produktions-Schema (Supabase)
└── 20240102000000_roles_schema.sql     # Rollen-Erweiterung
```

---

## npm Scripts

```bash
npm run dev              # Development Server starten
npm run build            # Production Build
npm run start            # Production Server
npm run lint             # ESLint

npm test                 # Tests einmalig ausführen
npm run test:watch       # Tests im Watch-Modus
npm run test:coverage    # Tests mit Coverage-Report
npm run test:ui          # Tests mit Vitest UI

npm run db:start         # Lokale Docker-DB starten
npm run db:stop          # Lokale Docker-DB stoppen
npm run db:reset         # Lokale Docker-DB zurücksetzen
npm run db:logs          # Lokale Docker-DB Logs

npm run seed:supabase    # 20 Demo-Projekte in Supabase einspielen
```

---

## Tests

```bash
npm run test:coverage
```

| Bereich | Inhalt |
|---------|--------|
| Zustand Store | Unit-Tests aller Actions und Selektoren |
| Supabase DB-Layer | CRUD, Auth, Fehlerbehandlung |
| Middleware (Auth-Guard) | Session-Prüfung, Weiterleitungen |
| Auth Callback | Supabase OAuth-Flow |
| API-Routen | analyze, chat, jira (Integration-Tests) |
| Docker-Infrastruktur | Schema-Validierung |

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

