# 📐 Architekturplaner

Interaktives Tool zur Planung, Analyse und Dokumentation von Unternehmensarchitekturen – entwickelt von WMC.

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
- **Persistenz** — Lokale Speicherung via Zustand + localStorage **oder** vollständige Supabase-Persistenz (optional)

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

**Ohne API Key** funktioniert die App mit regelbasierter Analyse.  
**Mit API Key** analysiert Google Gemini die Daten individuell und gibt spezifischere Empfehlungen.

---

## Lokale Datenbank (Docker)

Für lokale Entwicklung mit PostgreSQL (kein Supabase-Account nötig):

```bash
# PostgreSQL + pgAdmin starten
npm run db:start

# pgAdmin öffnen: http://localhost:5050
# Login: admin@archplanner.local / admin
# PostgreSQL: localhost:5432 / archplanner / archplanner / archplanner

# DB stoppen
npm run db:stop

# DB zurücksetzen (alle Daten löschen + Schema neu einspielen)
npm run db:reset

# Logs anzeigen
npm run db:logs
```

Das Schema und Testdaten werden beim ersten Start automatisch aus `supabase/migrations/` eingespielt.

---

## Supabase-Integration (Cloud)

Für persistente Cloud-Speicherung mit Authentifizierung:

1. Supabase-Projekt anlegen auf [supabase.com](https://supabase.com)
2. SQL-Migration ausführen: Inhalt von `supabase/migrations/20240101000000_initial_schema.sql` im Supabase SQL-Editor ausführen
3. Umgebungsvariablen setzen:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
```

4. App starten — Benutzer werden automatisch auf `/auth/login` weitergeleitet

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

- **Next.js 15** (App Router, latest)
- **React 19** + TypeScript
- **Tailwind CSS** — Dark Theme, WMC Corporate Design
- **Zustand** mit `persist`-Middleware (localStorage)
- **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) — Auth + Cloud-DB (optional)
- **PostgreSQL 16** via Docker — Lokale Entwicklungsdatenbank
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
│   │   ├── Header.tsx                  # WMC Header mit AppLogo
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
│   ├── supabase/
│   │   ├── client.ts                   # Browser-Client (createBrowserClient)
│   │   ├── server.ts                   # Server-Client (createServerClient)
│   │   └── db.ts                       # CRUD-Layer (20+ Funktionen)
│   ├── fallback-analysis.ts            # Regelbasierte Analyse
│   ├── wizard-steps.ts                 # Wizard-Konfiguration
│   ├── export-pdf.ts
│   └── export-word.ts
├── middleware.ts                        # Auth-Guard (Redirect zu /auth/login)
├── stores/appStore.ts                  # Zustand Store + Supabase-Persistenz
└── types/index.ts                      # Alle TypeScript-Typen

supabase/
└── migrations/
    ├── 00000000000000_local_dev_schema.sql   # Lokales Schema (Docker)
    └── 20240101000000_initial_schema.sql     # Produktions-Schema (Supabase)

docker-compose.yml                      # PostgreSQL 16 + pgAdmin
```

---

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `GOOGLE_AI_API_KEY` | Google Gemini API Key ([kostenlos holen](https://aistudio.google.com/app/apikey)) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Projekt-URL (nur für Cloud-Betrieb) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon-Key (nur für Cloud-Betrieb) |

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
| Supabase DB-Layer | 66 Tests (CRUD, Auth, Fehlerbehandlung) |
| Middleware (Auth-Guard) | 10 Tests |
| Auth Callback + Schema | 11 Tests |
| API-Routen (analyze, chat, jira) | Integration-Tests |
| Docker-Infrastruktur | 34 Validierungstests |

