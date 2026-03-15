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
- **Persistenz** — Alle Daten via Zustand + localStorage (kein Backend erforderlich)

---

## Schnellstart

```bash
# Dependencies installieren
npm install

# (Optional) Google Gemini API Key setzen
# Kostenlos holen: https://aistudio.google.com/app/apikey
cp .env.example .env.local
# GOOGLE_AI_API_KEY=dein_key_hier eintragen

# Starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

**Ohne API Key** funktioniert die App mit regelbasierter Analyse.  
**Mit API Key** analysiert Google Gemini die Daten individuell und gibt spezifischere Empfehlungen.

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
- **Google Generative AI** — Gemini 2.0 Flash
- **jsPDF + docx** — PDF & Word Export
- **lucide-react** — Icons
- **SVG-Charts** — Heatmap, Trendlinie (kein externes Chart-Framework)

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
│   ├── fallback-analysis.ts            # Regelbasierte Analyse
│   ├── wizard-steps.ts                 # Wizard-Konfiguration
│   ├── export-pdf.ts
│   └── export-word.ts
├── stores/appStore.ts                  # Zustand Store (mit Jira-Configs)
└── types/index.ts                      # Alle TypeScript-Typen
```

---

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `GOOGLE_AI_API_KEY` | Google Gemini API Key ([kostenlos holen](https://aistudio.google.com/app/apikey)) |

