# 📐 Architekturplaner

Interaktives Tool zur Planung, Analyse und Dokumentation von Unternehmensarchitekturen.

## Features

- **Projekt-Dashboard** — Übersicht aller Architektur-Projekte mit Status und Risiken
- **4-Schritte-Wizard** — Mit Freitextfeldern bei jeder Auswahl ("Andere..." Option)
- **KI-gestützte Analyse** — Google Gemini analysiert den Ist-Zustand individuell
- **Regelbasierter Fallback** — Funktioniert auch ohne API Key
- **Zielzustand-Empfehlung** — Automatisch generierte Soll-Architektur
- **5-Wellen-Umsetzungsplan** — Mit Deliverables und Zeitschätzungen

## Analyse-Architektur

```
Wizard-Daten
    │
    ▼
┌─────────────────────┐
│ POST /api/analyze    │
│                      │
│ ┌─ Gemini API Key?──┐│
│ │  JA: KI-Analyse   ││  ← Individuelle Analyse basierend auf
│ │  (Google Gemini)   ││    konkreten Daten, EOL-Checks, etc.
│ │                    ││
│ │  NEIN: Fallback    ││  ← Regelbasierte If-Then-Analyse
│ │  (lokal)           ││    Funktioniert immer, generischer
│ └────────────────────┘│
└─────────────────────┘
    │
    ▼
Analysebericht (Ist + Soll + Umsetzung)
```

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

## Tech Stack

- **Next.js 15** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS**
- **Zustand** (State Management)
- **Google Generative AI** (Gemini 2.0 Flash, Free Tier)

## Projektstruktur

```
src/
├── app/
│   ├── page.tsx               # Dashboard
│   ├── wizard/page.tsx        # Wizard
│   ├── project/[id]/page.tsx  # Analyse-Ansicht
│   └── api/analyze/route.ts   # KI-Analyse API (Gemini + Fallback)
├── components/
│   ├── ui/SmartSelect.tsx     # Select mit Freitext-Option
│   ├── layout/Header.tsx
│   ├── wizard/WizardForm.tsx
│   └── analysis/AnalysisView.tsx
├── lib/
│   ├── fallback-analysis.ts   # Regelbasierte Analyse (Backup)
│   ├── wizard-steps.ts        # Wizard-Konfiguration
│   └── utils.ts
├── stores/appStore.ts         # Zustand Store
└── types/index.ts
```

## Nächste Schritte

- [ ] Supabase-Integration (Persistenz)
- [ ] PDF/DOCX Export der Berichte
- [ ] Kunden-Portal mit Auth
- [ ] Compliance-Dashboard
- [ ] Web-Search Integration für aktuelle EOL-Daten
