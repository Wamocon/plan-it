/**
 * Supabase Seed-Skript – 20 realistische Demo-Projekte
 * =====================================================
 * Verwendung:
 *   1. Setze folgende Umgebungsvariablen (z. B. in .env.local):
 *      NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
 *      SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key
 *      SEED_USER_ID=uuid-deines-supabase-users
 *
 *   2. Skript ausführen:
 *      npx tsx scripts/seed-supabase.ts
 *
 * HINWEIS: Die SEED_USER_ID muss ein existierender User in auth.users sein.
 *          Den Service Role Key findest du im Supabase Dashboard unter
 *          Project Settings → API → service_role (secret).
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// .env.local laden (falls vorhanden), dann .env
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config({ path: envPath });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_USER_ID = process.env.SEED_USER_ID;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !SEED_USER_ID) {
  console.error(
    "❌ Fehlende Umgebungsvariablen:\n" +
      "   NEXT_PUBLIC_SUPABASE_URL\n" +
      "   SUPABASE_SERVICE_ROLE_KEY\n" +
      "   SEED_USER_ID\n\n" +
      "Bitte in .env.local oder als Umgebungsvariablen setzen."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Projektdaten ──────────────────────────────────────────────────────────────

const PROJECTS = [
  // ── 1. AutoFactory OS – Automotive (Score: 19 / Kritisch) ──────────────────
  {
    wizard_data: {
      projectName: "AutoFactory OS",
      clientName: "Müller Automotive Group",
      teamSize: "30+",
      appCount: "20+",
      targetApps: "80",
      primaryStack: "dotnet,angular",
      database: "mssql,oracle",
      hosting: "selfhosted",
      legacyApps: "yes",
      legacyDetail:
        "SAP R/3 ERP (1998), .NET Framework 1.1, COM+-Komponenten, Crystal Reports 8",
      codeSharing: "copypaste",
      designSystem: "none",
      cicd: "none",
      testing: "none",
      monitoring: "none",
      documentation: "outdated",
      branching: "none",
      onboardingTime: "month",
    },
    analysis: {
      score: 19,
      scoreLabel: "Kritisch",
      source: "fallback",
      summary:
        "Hochrisikoumfeld in der Fertigungsindustrie: SAP R/3 und .NET Framework 1.1 bilden das Rückgrat einer modernen Produktionslinie ohne jede Absicherung. Kein CI/CD, keine Tests, COM+-Komponenten ohne Support. Produktionsausfälle sind programmiert.",
      risks: [
        {
          title: ".NET Framework 1.1 – EOL seit 2008",
          severity: "high",
          description:
            "Backend-Steuerungssysteme laufen auf .NET 1.1 ohne Sicherheitsupdates seit 15 Jahren. Bekannte CVEs sind ungepacht.",
          recommendation:
            "Sofortige Netzwerksegmentierung. .NET 8 Migration über Strangler Fig – neue Services ausschließlich auf .NET 8.",
        },
        {
          title: "SAP R/3 ohne unterstützte ABAP-Versionen",
          severity: "high",
          description:
            "SAP R/3 erhält seit 2025 keinen Mainstream-Support mehr. Custom ABAP-Code ist nicht kompatibel mit SAP S/4HANA.",
          recommendation:
            "SAP S/4HANA Migration planen. Greenfield- vs. Brownfield-Analyse mit SAP-Beratern durchführen.",
        },
        {
          title: "COM+-Komponenten ohne Dokumentation",
          severity: "high",
          description:
            "Kritische Fertigungslogik steckt in COM+-Komponenten ohne Quellcode-Dokumentation. Kein Entwickler kennt alle Dependencies.",
          recommendation:
            "Reverse Engineering + Dokumentation als Workshop (1 Woche). Schrittweise Kapselung in .NET 8 Services.",
        },
        {
          title: "Kein Monitoring der Produktionssysteme",
          severity: "medium",
          description:
            "Produktionsausfälle werden erst durch Bandstillstand entdeckt. Keine automatischen Alerts.",
          recommendation:
            "Prometheus + Grafana für Basis-Monitoring. Uptime-Alerting innerhalb von 48h umsetzbar.",
        },
      ],
      soll: [
        {
          area: "Sicherheit",
          target:
            "Alle EOL-Systeme isoliert oder migriert – kein ungepatchtes System im Netz",
        },
        {
          area: "SAP",
          target: "S/4HANA Migrationspfad definiert und initiiert",
        },
        {
          area: "Monitoring",
          target:
            "Produktionsausfälle werden in < 2 Minuten per Alert erkannt",
        },
        {
          area: "Dokumentation",
          target: "Alle COM+-Komponenten dokumentiert und in Migrationspfad",
        },
      ],
      waves: [
        {
          number: 1,
          title: "Notfallabsicherung",
          duration: "3 Wochen",
          items: [
            "Netzwerksegmentierung aller Legacy-Systeme",
            "Prometheus Basis-Monitoring aufsetzen",
            "COM+-Komponenten Inventar erstellen",
            "SAP S/4HANA Assessment beauftragen",
          ],
        },
        {
          number: 2,
          title: "Modernisierung",
          duration: "6 Monate",
          items: [
            ".NET 8 für alle neuen Services verpflichtend",
            "CI/CD Pipeline einrichten (GitHub Actions)",
            "Erste Unit-Tests für Kern-Services",
            "SAP Migration Pilot starten",
          ],
        },
        {
          number: 3,
          title: "Transformation",
          duration: "18 Monate",
          items: [
            ".NET Framework 1.1 vollständig abgelöst",
            "SAP S/4HANA live",
            "Test-Coverage > 50 %",
            "Vollständiges CI/CD für alle Teams",
          ],
        },
      ],
    },
    created_at: "2024-03-15T08:00:00Z",
  },

  // ── 2. MedConnect Plus – Telemedizin SaaS (Score: 74 / Sehr gut) ───────────
  {
    wizard_data: {
      projectName: "MedConnect Plus",
      clientName: "MedConnect Health AG",
      teamSize: "15-30",
      appCount: "10-20",
      targetApps: "50",
      primaryStack: "nextjs,python",
      database: "postgres,redis",
      hosting: "aws",
      legacyApps: "no",
      codeSharing: "monorepo",
      designSystem: "full",
      cicd: "github-actions,standardized",
      testing: "unit,integration,e2e,comprehensive",
      monitoring: "sentry,logging,dashboard,uptime",
      documentation: "adr,storybook,wiki",
      branching: "trunk",
      onboardingTime: "days",
    },
    analysis: {
      score: 74,
      scoreLabel: "Sehr gut",
      source: "fallback",
      summary:
        "Gut aufgestellte Telemedizin-Plattform mit DSGVO-Compliance und modernem Stack. Trunk-Based Development, umfassende Tests und ADR-Dokumentation. Verbesserungspotenzial bei HIPAA-Auditierbarkeit und Disaster-Recovery-Tests.",
      risks: [
        {
          title: "HIPAA-Audit-Logs nicht automatisiert",
          severity: "medium",
          description:
            "Patientendatenzugriffe werden geloggt, aber nicht automatisch auf Anomalien geprüft. HIPAA verlangt regelmäßige Audit-Reviews.",
          recommendation:
            "AWS CloudTrail + Macie für automatisches Anomaly-Detection auf Patientendaten. Wöchentlicher automatischer Audit-Report.",
        },
        {
          title: "Kein GetestetES Disaster Recovery",
          severity: "medium",
          description:
            "Ein Disaster-Recovery-Plan existiert, wurde aber noch nie getestet. RTO/RPO-Ziele sind unbekannt.",
          recommendation:
            "Quartalsweiser DR-Test. RPO < 1h, RTO < 4h als Ziele definieren und messen.",
        },
        {
          title: "Python-Services ohne async/await Optimierung",
          severity: "low",
          description:
            "Einige Python-Microservices nutzen synchrones IO. Bei hoher Last entstehen Thread-Pool-Engpässe.",
          recommendation:
            "FastAPI + async/await für alle I/O-bound Services migrieren. uvicorn mit Worker-Scaling.",
        },
      ],
      soll: [
        { area: "Compliance", target: "HIPAA Audit-Log-Anomalien automatisch erkannt und eskaliert" },
        { area: "Resilience", target: "Quartalsweiser DR-Test – RPO < 1h, RTO < 4h nachgewiesen" },
        { area: "Performance", target: "Alle Python-Services async – kein synchrones IO in Hotpaths" },
      ],
      waves: [
        {
          number: 1,
          title: "Compliance & Resilience",
          duration: "4 Wochen",
          items: [
            "AWS CloudTrail + Macie konfigurieren",
            "DR-Test planen und durchführen",
            "RTO/RPO messen und dokumentieren",
            "Audit-Report-Automation implementieren",
          ],
        },
        {
          number: 2,
          title: "Performance",
          duration: "6 Wochen",
          items: [
            "Python-Services auf FastAPI async migrieren",
            "Load-Testing-Suite erweitern",
            "uvicorn Worker-Konfiguration optimieren",
            "Monitoring-Dashboard aktualisieren",
          ],
        },
      ],
    },
    created_at: "2025-01-20T10:00:00Z",
  },

  // ── 3. LegalHub Enterprise – Anwaltssoftware (Score: 31 / Kritisch) ─────────
  {
    wizard_data: {
      projectName: "LegalHub Enterprise",
      clientName: "Kanzleiverbund Fischer & Partner",
      teamSize: "5-15",
      appCount: "5-10",
      targetApps: "20",
      primaryStack: "dotnet,angular",
      database: "mssql",
      hosting: "selfhosted",
      legacyApps: "yes",
      legacyDetail:
        "Access 2007 Datenbanken, VBA-Makros, Word-Add-ins (.COM), Crystal Reports 11",
      codeSharing: "copypaste",
      designSystem: "none",
      cicd: "none",
      testing: "none",
      monitoring: "uptime",
      documentation: "outdated",
      branching: "basic",
      onboardingTime: "month",
    },
    analysis: {
      score: 31,
      scoreLabel: "Kritisch",
      source: "fallback",
      summary:
        "Anwaltssoftware mit ernsthafter technischer Schuld: Access 2007 für Mandantendaten, VBA-Makros ohne Tests und keine Backup-Strategie. DSGVO-Risiko durch nicht verschlüsselte Mandantenakten.",
      risks: [
        {
          title: "Access 2007 – keine Verschlüsselung",
          severity: "high",
          description:
            "Sensible Mandantendaten (Verträge, Finanzdaten) stecken in Access 2007-Datenbanken ohne Verschlüsselung. DSGVO-Verstoß.",
          recommendation:
            "Sofortige Migration zu SQL Server mit Transparent Data Encryption. Access als Frontend behalten (read-only) wenn nötig.",
        },
        {
          title: "VBA-Makros ohne Versionskontrolle",
          severity: "high",
          description:
            "Kritische Abrechnungslogik steckt in Excel/Word-VBA-Makros ohne Git. Ein Hardwaredefekt würde die Makros unwiederbringlich verlieren.",
          recommendation:
            "VBA-Code in Git einchecken (VBAX). Schrittweise Migration zu .NET Klassen.",
        },
        {
          title: "Kein regelmäßiges Backup getestet",
          severity: "high",
          description:
            "Backups laufen täglich, wurden aber seit 2 Jahren nicht auf Wiederherstellbarkeit getestet. Bei Datenverlust ist Recovery unbekannt.",
          recommendation:
            "Sofortiger Restore-Test. Automatisierter monatlicher Restore-Test in Testumgebung einrichten.",
        },
        {
          title: "COM Word-Add-ins unter Windows 11 instabil",
          severity: "medium",
          description:
            "Die COM-basierten Word-Add-ins crashen regelmäßig unter Windows 11 und Office 365. Kein Support-Kontakt mehr beim ursprünglichen Anbieter.",
          recommendation:
            "Migration zu modernen Office.js Add-ins (Microsoft Office Add-in Framework). Zeitaufwand: ~3 Monate.",
        },
      ],
      soll: [
        { area: "Datenschutz", target: "Alle Mandantendaten verschlüsselt in SQL Server – DSGVO-konform" },
        { area: "Datensicherung", target: "Monatlicher automatischer Restore-Test besteht – Recovery garantiert" },
        { area: "Code", target: "VBA-Code in Git, Abrechnung in .NET migriert" },
        { area: "Office-Integration", target: "Alle COM Add-ins zu Office.js migriert – stabil unter Windows 11" },
      ],
      waves: [
        {
          number: 1,
          title: "Datenschutz-Notfall",
          duration: "3 Wochen",
          items: [
            "SQL Server Migration vorbereiten",
            "Backup Restore-Test sofort durchführen",
            "VBA-Code in Git einchecken",
            "DSGVO-Risikoanalyse beauftragen",
          ],
        },
        {
          number: 2,
          title: "Modernisierung",
          duration: "3 Monate",
          items: [
            "Access → SQL Server Migration abschließen",
            "Abrechnungslogik zu .NET migrieren",
            "Office.js Add-in Pilot (1 Kanzlei)",
            "CI/CD Pipeline einrichten",
          ],
        },
      ],
    },
    created_at: "2024-09-05T09:00:00Z",
  },

  // ── 4. EduCloud Campus – Bildungsplattform (Score: 62 / Gut) ────────────────
  {
    wizard_data: {
      projectName: "EduCloud Campus",
      clientName: "Bildungswerk Digital GmbH",
      teamSize: "5-15",
      appCount: "5-10",
      targetApps: "30",
      primaryStack: "nextjs,laravel",
      database: "postgres,redis",
      hosting: "hetzner,docker",
      legacyApps: "no",
      codeSharing: "sharedlib",
      designSystem: "partial",
      cicd: "github-actions",
      testing: "unit,integration",
      monitoring: "sentry,uptime",
      documentation: "readme,wiki",
      branching: "gitflow",
      onboardingTime: "weeks",
    },
    analysis: {
      score: 62,
      scoreLabel: "Gut",
      source: "fallback",
      summary:
        "Solide LMS-Plattform für Online-Bildung. Guter Technologie-Stack, CI/CD und Monitoring. Verbesserungsbedarf bei E2E-Testing für kritische Lernflows, Video-Streaming-Performance und DSGVO-Einwilligungsmanagement.",
      risks: [
        {
          title: "Keine E2E-Tests für Kurs-Kaufprozess",
          severity: "high",
          description:
            "Der kritische Funnel (Kursansicht → Bezahlung → Einschreibung) hat keine automatisierten Tests. Checkout-Bugs werden erst von Nutzern gemeldet.",
          recommendation:
            "Playwright E2E für alle Kauf- und Lernflows. Nightly-CI-Run. P0-Szenarien zuerst abdecken.",
        },
        {
          title: "Video-Streaming ohne CDN",
          severity: "medium",
          description:
            "Lehrvideos werden direkt vom Hetzner-Server ausgeliefert. Bei 500+ gleichzeitigen Nutzern droht Bandbreitenengpass.",
          recommendation:
            "Cloudflare R2 + Stream für Video-Hosting und CDN-Auslieferung. S3-kompatible API, einfache Migration.",
        },
        {
          title: "DSGVO-Einwilligungsmanagement fehlt",
          severity: "medium",
          description:
            "Analytics-Cookies werden ohne explizite Einwilligung gesetzt. DSGVO-Beschwerde eines Datenschutzbeauftragten liegt vor.",
          recommendation:
            "Konsentmanager oder CookieYes integrieren. Analytics nur nach Opt-In aktivieren.",
        },
      ],
      soll: [
        { area: "Testing", target: "Playwright E2E für alle kritischen Lernflows – Nightly Run im CI" },
        { area: "Performance", target: "Videos über Cloudflare R2 CDN – unter 2s Pufferzeit weltweit" },
        { area: "DSGVO", target: "Cookie-Banner aktiv, Analytics nur nach Opt-In – keine Beschwerden" },
      ],
      waves: [
        {
          number: 1,
          title: "Compliance & Tests",
          duration: "3 Wochen",
          items: [
            "Cookie-Consent-Banner (CookieYes) integrieren",
            "Playwright Setup + erste Kauf-Tests",
            "Cloudflare R2 Pilot für 10 Videos",
          ],
        },
        {
          number: 2,
          title: "Skalierung",
          duration: "6 Wochen",
          items: [
            "Alle Videos zu Cloudflare R2 migrieren",
            "E2E-Suite auf 20+ Szenarien erweitern",
            "Design System Lücken schließen",
            "Gitflow → Trunk-Based Migration evaluieren",
          ],
        },
      ],
    },
    created_at: "2025-02-10T11:00:00Z",
  },

  // ── 5. FinTech Pay – Payment Startup (Score: 84 / Hervorragend) ─────────────
  {
    wizard_data: {
      projectName: "FinTech Pay",
      clientName: "FinTech Pay GmbH",
      teamSize: "5-15",
      appCount: "5-10",
      targetApps: "20",
      primaryStack: "go,nextjs",
      database: "postgres,redis",
      hosting: "aws",
      legacyApps: "no",
      codeSharing: "monorepo",
      designSystem: "full",
      cicd: "github-actions,standardized",
      testing: "unit,integration,e2e,comprehensive",
      monitoring: "sentry,logging,dashboard,uptime",
      documentation: "adr,readme,wiki",
      branching: "trunk",
      onboardingTime: "days",
    },
    analysis: {
      score: 84,
      scoreLabel: "Hervorragend",
      source: "fallback",
      summary:
        "Exzellent aufgestelltes FinTech-Startup: Go-Backend mit umfassenden Tests, Trunk-Based Development und vollständiges Monitoring. Kleines Verbesserungspotenzial bei PCI-DSS-Dokumentation und Penetration-Testing.",
      risks: [
        {
          title: "PCI-DSS Dokumentation unvollständig",
          severity: "medium",
          description:
            "Die technische Implementation erfüllt PCI-DSS, aber die formale Dokumentation für eine mögliche QSA-Prüfung fehlt noch.",
          recommendation:
            "PCI-DSS SAQ-D oder ROC vorbereiten. Alle Controls dokumentieren. QSA-Beratergespräch buchen.",
        },
        {
          title: "Kein regelmäßiges Penetration Testing",
          severity: "low",
          description:
            "Letzter Pen-Test war vor 14 Monaten. PCI-DSS verlangt jährliche Tests, bei Änderungen sogar öfter.",
          recommendation:
            "Jährlicher Pen-Test durch zertifizierten Dienstleister (z. B. Cure53). Bug-Bounty-Programm als Ergänzung.",
        },
      ],
      soll: [
        { area: "Compliance", target: "PCI-DSS Dokumentation vollständig – QSA-Prüfung besteht" },
        { area: "Security", target: "Jährlicher Pen-Test + Bug-Bounty-Programm aktiv" },
      ],
      waves: [
        {
          number: 1,
          title: "Compliance Finish",
          duration: "4 Wochen",
          items: [
            "PCI-DSS Controls dokumentieren",
            "Pen-Test-Dienstleister beauftragen",
            "Bug-Bounty-Programm (HackerOne) einrichten",
            "QSA-Beratergespräch durchführen",
          ],
        },
      ],
    },
    created_at: "2025-03-01T09:00:00Z",
  },

  // ── 6. InsuranceCore – Versicherungsplattform (Score: 17 / Kritisch) ────────
  {
    wizard_data: {
      projectName: "InsuranceCore",
      clientName: "VersicherungsGruppe West AG",
      teamSize: "30+",
      appCount: "20+",
      targetApps: "100",
      primaryStack: "java,jsx",
      database: "oracle",
      hosting: "selfhosted",
      legacyApps: "yes",
      legacyDetail:
        "COBOL (1992), PL/SQL Stored Procedures, EJB 2.x, IBM WebSphere 6, JSP-Weboberflächen",
      codeSharing: "copypaste",
      designSystem: "none",
      cicd: "none",
      testing: "unit,minimal",
      monitoring: "uptime",
      documentation: "outdated,wiki",
      branching: "basic",
      onboardingTime: "month",
    },
    analysis: {
      score: 17,
      scoreLabel: "Kritisch",
      source: "fallback",
      summary:
        "Hochkomplexe Versicherungsinfrastruktur mit COBOL-Kernbankprozessen aus 1992. EJB 2.x und IBM WebSphere 6 erhielten 2014 den letzten Sicherheitspatch. Regulatorische Risiken durch BaFin-Anforderungen. Sofortiger Handlungsbedarf.",
      risks: [
        {
          title: "COBOL-Kernsystem (1992) ohne aktiven Support",
          severity: "high",
          description:
            "Alle Versicherungsberechnungen laufen auf COBOL-Code aus 1992. Kein Entwickler im Unternehmen kennt COBOL noch vollständig.",
          recommendation:
            "COBOL-to-Java Transpiler (COBOL IT) evaluieren. Alternativ: API-Kapselung über Strangler Fig. Externe COBOL-Experten für Wissenstransfer einbeziehen.",
        },
        {
          title: "IBM WebSphere 6 – EOL seit 2013",
          severity: "high",
          description:
            "Der Application Server erhält seit über 10 Jahren keine Sicherheitspatches. Über 30 CVEs sind für diese Version bekannt.",
          recommendation:
            "Migration zu WildFly oder Spring Boot auf modernem JDK. Schrittweise, Service für Service.",
        },
        {
          title: "BaFin MaRisk-Verstoß durch fehlende Dokumentation",
          severity: "high",
          description:
            "Kernprozesse sind nicht dokumentiert. MaRisk (AT 7.2) verlangt vollständige Prozessdokumentation für Kernbankprozesse.",
          recommendation:
            "Prozessdokumentation-Projekt starten. Legal/IT-Task-Force einrichten. BaFin konsultieren.",
        },
        {
          title: "Oracle DB ohne aktuelle Lizenzierung",
          severity: "medium",
          description:
            "Oracle-Lizenzen sollen laut IT-Inventar abgelaufen sein. Audit-Risiko im sechsstelligen Bereich.",
          recommendation:
            "Oracle-Lizenz-Audit sofort in Auftrag geben. PostgreSQL als Migrationsziel evaluieren.",
        },
      ],
      soll: [
        { area: "COBOL", target: "Alle Kernprozesse auf moderne Sprache migriert oder sicher isoliert" },
        { area: "AppServer", target: "IBM WebSphere vollständig durch WildFly/Spring Boot ersetzt" },
        { area: "Compliance", target: "MaRisk-konforme Prozessdokumentation – BaFin-Prüfung besteht" },
        { area: "Lizenzierung", target: "Oracle-Lizenzrisiko beseitigt" },
      ],
      waves: [
        {
          number: 1,
          title: "Sofortmaßnahmen",
          duration: "4 Wochen",
          items: [
            "WAF vor WebSphere schalten",
            "Oracle Lizenz-Audit starten",
            "COBOL-Experten beauftragen",
            "BaFin-Kontakt aufnehmen",
          ],
        },
        {
          number: 2,
          title: "Stabilisierung",
          duration: "6 Monate",
          items: [
            "WebSphere → WildFly Migration Pilot (1 Service)",
            "COBOL API-Kapselung starten",
            "MaRisk-Dokumentation erstellen",
            "CI/CD für neue Services",
          ],
        },
        {
          number: 3,
          title: "Transformation",
          duration: "24 Monate",
          items: [
            "WebSphere vollständig abgelöst",
            "COBOL-Anteil < 20 %",
            "Oracle zu PostgreSQL migriert",
            "Vollständige BaFin-Compliance",
          ],
        },
      ],
    },
    created_at: "2024-04-12T07:00:00Z",
  },

  // ── 7. SmartHome Hub – IoT-Plattform (Score: 48 / Ausbaufähig) ──────────────
  {
    wizard_data: {
      projectName: "SmartHome Hub",
      clientName: "SmartLiving Technologies GmbH",
      teamSize: "5-15",
      appCount: "5-10",
      targetApps: "25",
      primaryStack: "nextjs,python,go",
      database: "postgres,redis,timescaledb",
      hosting: "aws,docker",
      legacyApps: "no",
      codeSharing: "sharedlib",
      designSystem: "partial",
      cicd: "github-actions",
      testing: "unit,integration",
      monitoring: "uptime,logging",
      documentation: "readme",
      branching: "gitflow",
      onboardingTime: "weeks",
    },
    analysis: {
      score: 48,
      scoreLabel: "Ausbaufähig",
      source: "fallback",
      summary:
        "IoT-Plattform mit modernem Technologie-Stack. Solide Basis, aber fehlende End-to-End-Tests für Device-Kommunikation, kein zentrales Alerting und ein unvollständiges Design System bremsen die Skalierung.",
      risks: [
        {
          title: "Keine Device-Integration Tests",
          severity: "high",
          description:
            "MQTT- und WebSocket-Kommunikation mit IoT-Geräten hat keine automatisierten Tests. Firmware-Updates können silently breaken.",
          recommendation:
            "Hardware-in-the-Loop Simulator für gängige Geräteklassen. Cypress + MQTT-Mock für Integration Tests.",
        },
        {
          title: "TimescaleDB ohne Retention Policy",
          severity: "medium",
          description:
            "Sensor-Zeitreihendaten wachsen unbegrenzt. Ohne Retention Policy wird die DB in 18 Monaten überläuft.",
          recommendation:
            "TimescaleDB Continuous Aggregates + automatische Retention Policy (raw: 90 Tage, aggregiert: 2 Jahre).",
        },
        {
          title: "OTA-Firmware Updates ohne Rollback",
          severity: "medium",
          description:
            "Over-the-Air Updates für IoT-Geräte haben keine automatische Rollback-Funktion. Ein fehlerhaftes Update kann tausende Geräte bricken.",
          recommendation:
            "AWS IoT Greengrass mit Delta-Updates und automatischem Rollback bei Fehler. Canary-Rollouts (5% → 25% → 100%).",
        },
      ],
      soll: [
        { area: "Testing", target: "Device-Integration Tests mit MQTT-Mock – kein blindes Firmware-Update" },
        { area: "Datenbank", target: "TimescaleDB Retention Policy aktiv – kontrolliertes Datenwachstum" },
        { area: "OTA", target: "Firmware-Updates mit Canary-Rollout und automatischem Rollback" },
      ],
      waves: [
        {
          number: 1,
          title: "Stabilisierung",
          duration: "4 Wochen",
          items: [
            "MQTT-Mock Framework aufsetzen",
            "TimescaleDB Retention Policy konfigurieren",
            "AWS IoT Greengrass Rollback evaluieren",
          ],
        },
        {
          number: 2,
          title: "Ausbau",
          duration: "8 Wochen",
          items: [
            "Device-Integration Test Suite",
            "OTA Canary-Rollout implementieren",
            "Design System vervollständigen",
            "Trunk-Based Migration planen",
          ],
        },
      ],
    },
    created_at: "2024-11-20T13:00:00Z",
  },

  // ── 8. MediaStream Pro – Streamingplattform (Score: 79 / Sehr gut) ──────────
  {
    wizard_data: {
      projectName: "MediaStream Pro",
      clientName: "MediaStream GmbH",
      teamSize: "15-30",
      appCount: "10-20",
      targetApps: "40",
      primaryStack: "nextjs,go",
      database: "postgres,redis",
      hosting: "aws,cloudfront",
      legacyApps: "no",
      codeSharing: "monorepo",
      designSystem: "full",
      cicd: "github-actions,standardized",
      testing: "unit,integration,e2e,comprehensive",
      monitoring: "sentry,dashboard,uptime,logging",
      documentation: "adr,storybook,wiki",
      branching: "trunk",
      onboardingTime: "days",
    },
    analysis: {
      score: 79,
      scoreLabel: "Sehr gut",
      source: "fallback",
      summary:
        "Professionell aufgestellte Streamingplattform. HLS/DASH Delivery, vollständige Testabdeckung und ADR-Dokumentation. Optimierungspotenzial bei CDN-Kosten und adaptive Bitraten-Implementierung für mobiles Netz.",
      risks: [
        {
          title: "Adaptive Bitrate fehlt auf Mobilgeräten",
          severity: "medium",
          description:
            "HLS-Streams liefern keine adaptiven Bitraten für schwache Mobilverbindungen. Nutzer auf 3G/4G erleben Buffering.",
          recommendation:
            "HLS.js mit ABR-Konfiguration für Mobile. AWS MediaConvert Ladder mit 360p, 720p, 1080p.",
        },
        {
          title: "CloudFront-Kosten ohne Cost-Cap",
          severity: "low",
          description:
            "Bei viralen Inhalten können CloudFront Egress-Kosten explosiv steigen. Kein Budget-Alert aktiv.",
          recommendation:
            "AWS Budgets mit € Alert bei 120%. CloudFront-Pricing-Klassen optimieren. Spot-CDN-Instanzen evaluieren.",
        },
      ],
      soll: [
        { area: "Streaming", target: "Adaptive Bitrate für alle Mobilgeräte – kein Buffering auf 4G" },
        { area: "Kosten", target: "CloudFront Budget-Alert aktiv – kein Cost-Shock" },
      ],
      waves: [
        {
          number: 1,
          title: "Streaming-Optimierung",
          duration: "3 Wochen",
          items: [
            "HLS.js ABR auf Mobile konfigurieren",
            "MediaConvert Bitrate-Ladder aktualisieren",
            "AWS Budget Alert aktivieren",
            "Mobile-Performance-Test mit Throttling",
          ],
        },
      ],
    },
    created_at: "2025-02-15T10:00:00Z",
  },

  // ── 9. LogiTrack 360 – Supply Chain (Score: 22 / Kritisch) ──────────────────
  {
    wizard_data: {
      projectName: "LogiTrack 360",
      clientName: "LogiTrack Supply GmbH",
      teamSize: "5-15",
      appCount: "10-20",
      targetApps: "30",
      primaryStack: "dotnet,angular",
      database: "mssql,mysql",
      hosting: "selfhosted,azure",
      legacyApps: "yes",
      legacyDetail:
        "Delphi 7 Warehousing-Clients, FoxPro 2.6 Lagerverwaltung, Windows XP POS-Stationen",
      codeSharing: "copypaste",
      designSystem: "none",
      cicd: "jenkins",
      testing: "none",
      monitoring: "uptime",
      documentation: "outdated",
      branching: "basic",
      onboardingTime: "month",
    },
    analysis: {
      score: 22,
      scoreLabel: "Kritisch",
      source: "fallback",
      summary:
        "Supply-Chain-System mit kritischen Altlasten: FoxPro 2.6 (EOL 2007) und Windows XP Stationen im Produktivnetz. Keine Tests für geschäftskritische Lagerprozesse. Sicherheitsrisiko und Compliance-Problem.",
      risks: [
        {
          title: "FoxPro 2.6 – EOL seit 2007",
          severity: "high",
          description:
            "Die gesamte Lagerverwaltung läuft auf FoxPro 2.6. Keine Datenbankfunktionalität wie Transaktionen, Fremdschlüssel oder Replikation.",
          recommendation:
            "Migration zu SQL Server over ODBC-Brücke als Zwischenschritt. Dann schrittweise .NET 8 Neuentwicklung.",
        },
        {
          title: "Windows XP im Produktivnetz",
          severity: "high",
          description:
            "Windows XP Stationen haben Netzwerkzugriff auf alle Lagersysteme. Keine Sicherheitsupdates seit 2014. EternalBlue-Exploit aktiv ausnutzbar.",
          recommendation:
            "Sofortige Netzwerksegmentierung. Windows XP auf Kiosk-Modus ohne Netzwerkzugriff. Hardware-Refresh-Plan erstellen.",
        },
        {
          title: "Delphi 7 Clients ohne Build-System",
          severity: "high",
          description:
            "Warehousing-Clients in Delphi 7 haben kein reproduzierbares Build-System. Source-Code und IDE nur auf einem einzigen Laptop.",
          recommendation:
            "Quellcode sofort in Git. Build-Umgebung als Docker-Container. Schrittweise Migration zu modernen .NET-Clients.",
        },
      ],
      soll: [
        { area: "Sicherheit", target: "Windows XP und FoxPro netzwerksegmentiert und auf Migrationspfad" },
        { area: "Code", target: "Alle Quellcodes in Git – kein Single Point of Failure mehr" },
        { area: "Datenbank", target: "FoxPro vollständig durch SQL Server ersetzt" },
      ],
      waves: [
        {
          number: 1,
          title: "Notabsicherung",
          duration: "2 Wochen",
          items: [
            "Windows XP netzwerksegmentieren",
            "Delphi-Quellcode sofort in Git",
            "FoxPro-Daten auf SQL Server spiegeln (read-only)",
            "Sicherheits-Audit beauftragen",
          ],
        },
        {
          number: 2,
          title: "Migration",
          duration: "6 Monate",
          items: [
            "FoxPro vollständig durch SQL Server ersetzen",
            ".NET 8 Client für Lagerverwaltung",
            "Windows XP Terminals ersetzen (Android-Kiosk)",
            "CI/CD Pipeline aufsetzen",
          ],
        },
      ],
    },
    created_at: "2024-06-18T08:00:00Z",
  },

  // ── 10. RetailOS Next – POS Retail (Score: 53 / Ausbaufähig) ────────────────
  {
    wizard_data: {
      projectName: "RetailOS Next",
      clientName: "Handelskette Mitte GmbH",
      teamSize: "5-15",
      appCount: "5-10",
      targetApps: "20",
      primaryStack: "nextjs,laravel",
      database: "mysql,redis",
      hosting: "aws,docker",
      legacyApps: "no",
      codeSharing: "sharedlib",
      designSystem: "partial",
      cicd: "github-actions",
      testing: "unit,integration",
      monitoring: "sentry,uptime",
      documentation: "readme,wiki",
      branching: "gitflow",
      onboardingTime: "weeks",
    },
    analysis: {
      score: 53,
      scoreLabel: "Ausbaufähig",
      source: "fallback",
      summary:
        "Moderne POS-Plattform für den Einzelhandel. CI/CD und Basis-Monitoring sind vorhanden. Schwachpunkte: kein Offline-Fallback für POS-Ausfall, fehlende E2E-Tests für den Kassenflow und unvollständiges Design System.",
      risks: [
        {
          title: "Kein Offline-Kassenbetrieb",
          severity: "high",
          description:
            "Bei Internetausfall fallen alle POS-Terminals aus. Letzte Netzwerkunterbrechung kostete 4 Stunden Umsatz.",
          recommendation:
            "PWA mit Service Worker für Offline-Kassenbetrieb. IndexedDB für lokale Transaktionen. Sync bei Wiederverbindung.",
        },
        {
          title: "Keine E2E-Tests für Kassierprozess",
          severity: "medium",
          description:
            "Der kritische Kassierprozess (Scan → Rabatt → Zahlung → Bon) hat keine automatisierten Tests.",
          recommendation:
            "Playwright E2E für alle Kassierprozesse. Hardware-Mock für Barcode-Scanner und Kartenleser.",
        },
        {
          title: "MySQL ohne Read-Replicas",
          severity: "low",
          description:
            "Alle POS-Terminals lesen direkt vom Primary-MySQL. Bei 50 Terminals an Stoßzeiten gibt es Datenbanklatenz.",
          recommendation:
            "MySQL Read-Replicas für alle Lesezugriffe. RDS Read Replica auf AWS.",
        },
      ],
      soll: [
        { area: "Verfügbarkeit", target: "Offline-POS aktiv – kein Umsatzverlust bei Netzausfall" },
        { area: "Testing", target: "E2E für Kassierprozess – Nightly-CI-Run" },
        { area: "Performance", target: "MySQL Read-Replicas – Datenbanklatenz < 50ms" },
      ],
      waves: [
        {
          number: 1,
          title: "Verfügbarkeit",
          duration: "4 Wochen",
          items: [
            "PWA Service Worker für Offline-Betrieb",
            "IndexedDB Transaktionsspeicher",
            "Playwright Setup + erste Kassen-Tests",
          ],
        },
        {
          number: 2,
          title: "Stabilisierung",
          duration: "6 Wochen",
          items: [
            "MySQL Read-Replica konfigurieren",
            "E2E-Suite auf 15 Szenarien erweitern",
            "Sync-Konfliktlösung für Offline-Daten",
            "Design System vervollständigen",
          ],
        },
      ],
    },
    created_at: "2025-01-05T12:00:00Z",
  },

  // ── 11. HealthSync – Wellness App (Score: 67 / Gut) ─────────────────────────
  {
    wizard_data: {
      projectName: "HealthSync",
      clientName: "HealthSync Digital GmbH",
      teamSize: "1-5",
      appCount: "1-5",
      targetApps: "10",
      primaryStack: "nextjs,python",
      database: "postgres",
      hosting: "vercel,aws",
      legacyApps: "no",
      codeSharing: "monorepo",
      designSystem: "full",
      cicd: "github-actions,standardized",
      testing: "unit,integration,e2e",
      monitoring: "sentry,uptime",
      documentation: "readme,storybook",
      branching: "trunk",
      onboardingTime: "days",
    },
    analysis: {
      score: 67,
      scoreLabel: "Gut",
      source: "fallback",
      summary:
        "Gut strukturierte Wellness-App mit modernem Stack. Trunk-Based Development und vollständiges Design System. Schwachpunkt: Healthdaten-Synchronisation mit Apple Health/Google Fit ungetestet und kein Lasttest für Peak-Nutzung (Neujahr).",
      risks: [
        {
          title: "Health-API Sync ohne Tests",
          severity: "medium",
          description:
            "Apple Health und Google Fit Synchronisation funktioniert nur manuell getestet. Änderungen an der Integration brechen Silent.",
          recommendation:
            "Mock-Services für Apple HealthKit und Google Fit API. Automatisierte Integration Tests in CI.",
        },
        {
          title: "Kein Lasttest für Neujahrs-Peak",
          severity: "medium",
          description:
            "Wellness-Apps erleben jedes Jahr zum Neujahr 10x normale Last. Kein Lasttest vorhanden.",
          recommendation:
            "k6 Lasttest mit 10x normaler Last. Vercel Edge Functions für Skalierung nutzen.",
        },
      ],
      soll: [
        { area: "Integration", target: "Health-API Sync automatisch getestet in CI" },
        { area: "Performance", target: "Neujahrs-Peak getestet – kein Ausfall bei 10x Last" },
      ],
      waves: [
        {
          number: 1,
          title: "Testing & Performance",
          duration: "3 Wochen",
          items: [
            "Apple HealthKit Mock Service",
            "Google Fit Mock Service",
            "k6 Lasttest aufsetzen (10x)",
            "Vercel Edge Config für Skalierung prüfen",
          ],
        },
      ],
    },
    created_at: "2025-02-20T14:00:00Z",
  },

  // ── 12. TechStartup Alpha – Early Stage (Score: 37 / Kritisch) ──────────────
  {
    wizard_data: {
      projectName: "TechStartup Alpha",
      clientName: "Alpha Ventures GmbH",
      teamSize: "1-5",
      appCount: "1-5",
      targetApps: "10",
      primaryStack: "nextjs",
      database: "postgres",
      hosting: "vercel",
      legacyApps: "no",
      codeSharing: "copypaste",
      designSystem: "none",
      cicd: "none",
      testing: "none",
      monitoring: "none",
      documentation: "none",
      branching: "basic",
      onboardingTime: "weeks",
    },
    analysis: {
      score: 37,
      scoreLabel: "Kritisch",
      source: "fallback",
      summary:
        "Typisches Early-Stage-Startup: schnell gebaut, aber mit Schulden die beim Scale-out zum Problem werden. Kein CI/CD, keine Tests, kein Monitoring. Für die erste Wachstumsphase müssen die Grundlagen nachgeholt werden.",
      risks: [
        {
          title: "Kein CI/CD – manuelle Deployments",
          severity: "high",
          description:
            "Jedes Deployment ist ein manueller git push. Kein Testing vor Production, keine automatischen Rollbacks.",
          recommendation:
            "GitHub Actions mit Vercel Preview Deployments. 30 Minuten Setup für automatisches CI.",
        },
        {
          title: "Keine Fehlererfassung",
          severity: "high",
          description:
            "Produktionsfehler werden erst durch Nutzerbeschwerden bekannt. Keine Fehlermetriken.",
          recommendation:
            "Sentry in 15 Minuten integrieren. Kostenlos im Starter-Tier ausreichend.",
        },
        {
          title: "Keine Backup-Strategie",
          severity: "medium",
          description:
            "PostgreSQL auf Supabase hat automatische Backups, aber kein getestetes Restore-Verfahren.",
          recommendation:
            "Supabase Point-in-Time Recovery aktivieren. Monatlichen Restore-Test durchführen.",
        },
      ],
      soll: [
        { area: "CI/CD", target: "GitHub Actions + Vercel Preview Deployments – kein manueller Push" },
        { area: "Monitoring", target: "Sentry aktiv – alle Fehler sofort sichtbar" },
        { area: "Backup", target: "Restore-Prozess dokumentiert und getestet" },
      ],
      waves: [
        {
          number: 1,
          title: "Basis aufbauen",
          duration: "1 Woche",
          items: [
            "GitHub Actions CI/CD aufsetzen",
            "Sentry integrieren",
            "Supabase PITR aktivieren",
            "Erste Unit-Tests schreiben",
          ],
        },
        {
          number: 2,
          title: "Qualität sichern",
          duration: "3 Wochen",
          items: [
            "Test-Coverage auf 40 % bringen",
            "Staging-Umgebung einrichten",
            "Monitoring-Dashboard",
            "Runbook für häufige Incidents",
          ],
        },
      ],
    },
    created_at: "2025-03-10T09:00:00Z",
  },

  // ── 13. CRMPro Enterprise – CRM (Score: 71 / Sehr gut) ──────────────────────
  {
    wizard_data: {
      projectName: "CRMPro Enterprise",
      clientName: "CRMPro Solutions AG",
      teamSize: "15-30",
      appCount: "10-20",
      targetApps: "40",
      primaryStack: "nextjs,go",
      database: "postgres,elasticsearch",
      hosting: "gcp,docker",
      legacyApps: "no",
      codeSharing: "monorepo",
      designSystem: "full",
      cicd: "github-actions,standardized",
      testing: "unit,integration,e2e,comprehensive",
      monitoring: "sentry,logging,dashboard",
      documentation: "adr,wiki,storybook",
      branching: "trunk",
      onboardingTime: "days",
    },
    analysis: {
      score: 71,
      scoreLabel: "Sehr gut",
      source: "fallback",
      summary:
        "Solides Enterprise-CRM mit Monorepo, ADRs und umfassender Testabdeckung. Schwachpunkt: Elasticsearch-Performance bei großen Tenants und fehlendes Uptime-Monitoring für externe Kundenzugänge.",
      risks: [
        {
          title: "Elasticsearch Performance-Degradation",
          severity: "medium",
          description:
            "Bei Tenants mit > 500.000 Kontakten gibt es merkliche Suchlatenz (>3s). Index-Sharding ist nicht tenant-spezifisch optimiert.",
          recommendation:
            "Elasticsearch ILM (Index Lifecycle Management) für große Tenants. Separate Index-Tier-Strategie. OpenSearch als Alternative evaluieren.",
        },
        {
          title: "Kein externes Uptime-Monitoring",
          severity: "low",
          description:
            "Internes Monitoring ist exzellent, aber kein externes Check (z. B. aus Frankfurt, London, NYC) für globale Kunden.",
          recommendation:
            "Pingdom oder Better Uptime für externe Multi-Region Checks. SLA-Dashboard für Kunden.",
        },
      ],
      soll: [
        { area: "Performance", target: "Elasticsearch < 500ms Suchlatenz auch für 1M+ Kontakte" },
        { area: "Monitoring", target: "Externes Uptime-Monitoring mit globalem SLA-Dashboard" },
      ],
      waves: [
        {
          number: 1,
          title: "Performance & Monitoring",
          duration: "4 Wochen",
          items: [
            "Elasticsearch ILM konfigurieren",
            "Performance-Test für 1M+-Tenants",
            "Better Uptime (externe Multi-Region Checks)",
            "SLA-Dashboard für Kunden aufbauen",
          ],
        },
      ],
    },
    created_at: "2025-01-25T11:00:00Z",
  },

  // ── 14. GamePortal Live – Gaming (Score: 44 / Ausbaufähig) ──────────────────
  {
    wizard_data: {
      projectName: "GamePortal Live",
      clientName: "GamePortal Entertainment GmbH",
      teamSize: "5-15",
      appCount: "5-10",
      targetApps: "20",
      primaryStack: "nextjs,go",
      database: "postgres,redis",
      hosting: "aws",
      legacyApps: "no",
      codeSharing: "sharedlib",
      designSystem: "partial",
      cicd: "github-actions",
      testing: "unit",
      monitoring: "uptime,sentry",
      documentation: "readme",
      branching: "gitflow",
      onboardingTime: "weeks",
    },
    analysis: {
      score: 44,
      scoreLabel: "Ausbaufähig",
      source: "fallback",
      summary:
        "Gaming-Portal mit solider Basis. WebSocket-Echtzeit-Features werden nicht automatisiert getestet, und Leaderboard-Performance unter Last ist unbekannt. Gitflow verlangsamt Event-basierte Deployments.",
      risks: [
        {
          title: "WebSocket-Handler ohne Tests",
          severity: "high",
          description:
            "Echtzeit-Multiplayer-Features (Lobby, Matchmaking) haben keine Tests. WebSocket-Bugs werden erst im Livebetrieb entdeckt.",
          recommendation:
            "WebSocket-Test-Framework (ws + Jest Mocks). Integration Tests für alle Lobby-Szenarien.",
        },
        {
          title: "Leaderboard ohne Cache-Strategie",
          severity: "medium",
          description:
            "Bei einem Event mit 50.000 Teilnehmern läuft das Leaderboard DB-seitig direkt auf PostgreSQL. Kein Redis-Caching.",
          recommendation:
            "Redis Sorted Sets für Echtzeit-Leaderboard. TTL-basiertes Caching für historische Rankings.",
        },
        {
          title: "Gitflow verlangsamt Event-Deployments",
          severity: "medium",
          description:
            "Event-Hotfixes müssen durch Gitflow-Process, typisch 2+ Stunden. Bei laufenden Events kritisch.",
          recommendation:
            "Trunk-Based Development mit Feature Flags (LaunchDarkly). Sofort-Deploy in < 15 Minuten.",
        },
      ],
      soll: [
        { area: "Testing", target: "WebSocket-Tests in CI – kein Lobby-Bug in Production" },
        { area: "Performance", target: "Leaderboard über Redis Sorted Sets – < 10ms bei 100k Einträgen" },
        { area: "Deployment", target: "Trunk-Based + Feature Flags – Event-Hotfix in 15 Minuten" },
      ],
      waves: [
        {
          number: 1,
          title: "Testing & Performance",
          duration: "3 Wochen",
          items: [
            "WebSocket Mock Framework aufsetzen",
            "Redis Sorted Sets für Leaderboard",
            "Erste WebSocket-Integration Tests",
          ],
        },
        {
          number: 2,
          title: "Deployment",
          duration: "4 Wochen",
          items: [
            "Feature Flag System (LaunchDarkly) einführen",
            "Trunk-Based Migration pilot",
            "Load-Test für 50k concurrent Users",
            "Design System vervollständigen",
          ],
        },
      ],
    },
    created_at: "2024-12-05T15:00:00Z",
  },

  // ── 15. AgroData – AgriTech (Score: 26 / Kritisch) ──────────────────────────
  {
    wizard_data: {
      projectName: "AgroData Platform",
      clientName: "AgroData Cooperative Deutschland",
      teamSize: "1-5",
      appCount: "1-5",
      targetApps: "10",
      primaryStack: "laravel,vue",
      database: "mysql",
      hosting: "selfhosted",
      legacyApps: "yes",
      legacyDetail: "Filemaker Pro 6, Excel-VBA Ernteerfassung, MySQL 5.5 (EOL)",
      codeSharing: "copypaste",
      designSystem: "none",
      cicd: "none",
      testing: "none",
      monitoring: "none",
      documentation: "none",
      branching: "basic",
      onboardingTime: "month",
    },
    analysis: {
      score: 26,
      scoreLabel: "Kritisch",
      source: "fallback",
      summary:
        "AgriTech-Plattform mit ernsthafter technischer Schuld: MySQL 5.5 (EOL 2018), FileMaker Pro 6 und Excel-VBA für Ernteerfassung. Kein Backup getestet, keine Sicherheit. Datenverlust-Risiko ist hoch.",
      risks: [
        {
          title: "MySQL 5.5 – EOL seit 2018",
          severity: "high",
          description:
            "Alle Produktionsdaten sind in MySQL 5.5 die seit 2018 keine Sicherheitsupdates erhält. Über 20 bekannte CVEs ungepacht.",
          recommendation:
            "Sofort auf MySQL 8.0 oder MariaDB 10.11 upgraden. In-place Upgrade möglich mit Testing.",
        },
        {
          title: "FileMaker Pro 6 als Primärdatenbank",
          severity: "high",
          description:
            "Betriebsdaten aus 2001 stecken in FileMaker Pro 6 Datenbanken. Keine aktive SQL-Schnittstelle. Datenverlust bei Hardware-Defekt.",
          recommendation:
            "FileMaker → MySQL Migration via ODBC-Export. Alle historischen Daten sichern und migrieren.",
        },
        {
          title: "ExcelVBA-Ernteerfassung ohne Validierung",
          severity: "high",
          description:
            "Erntedaten werden in Excel-VBA erfasst ohne Validierung und manuell in MySQL importiert. Datenfehler unentdeckt.",
          recommendation:
            "Laravel-Webform mit Validierung für Ernteerfassung. Excel-Import mit Prüfregeln als Übergang.",
        },
      ],
      soll: [
        { area: "Datenbank", target: "MySQL 8.0 + alle FileMaker-Daten migriert" },
        { area: "Erfassung", target: "Laravel-Webform mit Validierung ersetzt Excel-VBA" },
        { area: "Backup", target: "Tägliches Backup mit getesteter Wiederherstellung" },
      ],
      waves: [
        {
          number: 1,
          title: "Datensicherheit",
          duration: "2 Wochen",
          items: [
            "MySQL 8.0 Upgrade",
            "FileMaker-Daten exportieren und sichern",
            "Tägliches automatisches Backup einrichten",
          ],
        },
        {
          number: 2,
          title: "Modernisierung",
          duration: "2 Monate",
          items: [
            "FileMaker → MySQL Migration abschließen",
            "Laravel Ernteerfassungsformular",
            "CI/CD mit GitHub Actions",
            "Erste Tests für kritische Berechnungen",
          ],
        },
      ],
    },
    created_at: "2024-08-30T07:00:00Z",
  },

  // ── 16. HotelChain Central – Hospitality (Score: 58 / Gut) ──────────────────
  {
    wizard_data: {
      projectName: "HotelChain Central",
      clientName: "Hotelkette Süd GmbH",
      teamSize: "5-15",
      appCount: "5-10",
      targetApps: "25",
      primaryStack: "nextjs,laravel",
      database: "mysql,redis",
      hosting: "aws,docker",
      legacyApps: "no",
      codeSharing: "sharedlib",
      designSystem: "partial",
      cicd: "github-actions",
      testing: "unit,integration",
      monitoring: "sentry,uptime,logging",
      documentation: "readme,wiki",
      branching: "gitflow",
      onboardingTime: "weeks",
    },
    analysis: {
      score: 58,
      scoreLabel: "Gut",
      source: "fallback",
      summary:
        "Property Management System für Hotelketten mit solider Basis. CI/CD und Monitoring sind vorhanden. Schwachpunkt: keine E2E-Tests für den Buchungsflow und kein Performance-Test für Hochsaison-Last.",
      risks: [
        {
          title: "Buchungsflow ohne E2E-Tests",
          severity: "high",
          description:
            "Der kritische Flow (Zimmersuche → Buchung → Zahlung → Bestätigung) hat keine automatisierten Tests. Ausfälle in der Hochsaison sind der Worst Case.",
          recommendation:
            "Playwright E2E für alle Buchungsflows. Nightly-Run in CI. Zusätzlicher Last-Test vor Hochsaison.",
        },
        {
          title: "Kein Channel-Manager Failover",
          severity: "medium",
          description:
            "Wenn die OTA-Channel-Manager Verbindung (Booking.com, Expedia) ausfällt, werden neue Buchungen nicht mehr synchronisiert. Kein Fallback.",
          recommendation:
            "Queue-basierte Channel-Manager Integration (SQS). Dead-Letter-Queue für verpasste Synchronisationen.",
        },
        {
          title: "PCI-DSS Zahlungsdaten nicht segmentiert",
          severity: "medium",
          description:
            "Zahlungsdaten fließen durch Laravel-Anwendung statt direkt zu Stripe/PSP. Erhöhter PCI-DSS Scope.",
          recommendation:
            "Stripe.js direkt im Frontend einbinden (Hosted Fields). Laravel sieht nur den Token, keine Kartendaten.",
        },
      ],
      soll: [
        { area: "Testing", target: "Playwright E2E für Buchungsflow – kein Ausfall in Hochsaison" },
        { area: "Integration", target: "Channel-Manager mit Queue-Failover – keine verpassten Buchungen" },
        { area: "Security", target: "Stripe Hosted Fields – PCI-DSS Scope minimal" },
      ],
      waves: [
        {
          number: 1,
          title: "Quick Wins",
          duration: "3 Wochen",
          items: [
            "Stripe.js Hosted Fields integrieren",
            "Playwright Setup + erste Buchungstests",
            "SQS Channel-Manager Queue aufsetzen",
          ],
        },
        {
          number: 2,
          title: "Stabilisierung",
          duration: "6 Wochen",
          items: [
            "E2E-Suite auf 20+ Buchungsszenarien",
            "Dead-Letter-Queue für Channel-Manager",
            "Hochsaison-Lasttest",
            "Design System erweist vervollständigen",
          ],
        },
      ],
    },
    created_at: "2024-10-01T10:00:00Z",
  },

  // ── 17. CyberSec Shield – Security SaaS (Score: 92 / Hervorragend) ──────────
  {
    wizard_data: {
      projectName: "CyberSec Shield",
      clientName: "CyberSec Shield GmbH",
      teamSize: "5-15",
      appCount: "5-10",
      targetApps: "20",
      primaryStack: "go,nextjs",
      database: "postgres,redis",
      hosting: "aws",
      legacyApps: "no",
      codeSharing: "monorepo",
      designSystem: "full",
      cicd: "github-actions,standardized",
      testing: "unit,integration,e2e,comprehensive",
      monitoring: "sentry,logging,dashboard,uptime",
      documentation: "adr,storybook,wiki,readme",
      branching: "trunk",
      onboardingTime: "days",
    },
    analysis: {
      score: 92,
      scoreLabel: "Hervorragend",
      source: "fallback",
      summary:
        "Vorbildliches Security-SaaS: SOC 2 Typ II zertifiziert, Trunk-Based Development, comprehensive Testing und vollständige Threat-Modellierung. Kleines Optimierungspotenzial bei Dependency-Scanning und Secrets-Rotation.",
      risks: [
        {
          title: "Dependency-Scanning nicht im CI",
          severity: "low",
          description:
            "Dependencies werden manuell auf Vulnerabilities geprüft. Bei einem Security-Produkt ist das ein Bild-Widerspruch.",
          recommendation:
            "Dependabot + Trivy im CI erzwingen. SBOM als Release-Artefakt generieren.",
        },
        {
          title: "Secrets-Rotation ohne Automatisierung",
          severity: "low",
          description:
            "API-Keys und DB-Passwörter werden manuell rotiert (alle 6 Monate). Automatisierung wäre konsequenter.",
          recommendation:
            "AWS Secrets Manager mit automatischer Rotation. 90-Tage Cycle als Minimum.",
        },
      ],
      soll: [
        { area: "Supply Chain", target: "Dependabot + Trivy im CI – SBOM für jedes Release" },
        { area: "Secrets", target: "Automatische Secrets-Rotation alle 90 Tage über AWS Secrets Manager" },
      ],
      waves: [
        {
          number: 1,
          title: "Security Hardening",
          duration: "2 Wochen",
          items: [
            "Dependabot aktivieren + CODEOWNERS setzen",
            "Trivy Container-Scan in CI",
            "SBOM-Generierung als Release-Step",
            "AWS Secrets Manager Rotation einrichten",
          ],
        },
      ],
    },
    created_at: "2025-02-28T08:00:00Z",
  },

  // ── 18. TravelBook AI – Travel Tech (Score: 41 / Ausbaufähig) ───────────────
  {
    wizard_data: {
      projectName: "TravelBook AI",
      clientName: "TravelBook Technologies GmbH",
      teamSize: "5-15",
      appCount: "5-10",
      targetApps: "20",
      primaryStack: "nextjs,python",
      database: "postgres,redis",
      hosting: "vercel,aws",
      legacyApps: "no",
      codeSharing: "copypaste",
      designSystem: "partial",
      cicd: "github-actions",
      testing: "unit",
      monitoring: "sentry",
      documentation: "readme",
      branching: "basic",
      onboardingTime: "weeks",
    },
    analysis: {
      score: 41,
      scoreLabel: "Ausbaufähig",
      source: "fallback",
      summary:
        "KI-gestützte Reiseplanungsplattform mit modernem Stack, aber technischen Schulden: Copy-Paste-Code-Sharing, keine Tests für den KI-Buchungsflow und DSGVO-Lücken bei Reisedaten.",
      risks: [
        {
          title: "KI-Buchungsflow ohne Tests",
          severity: "high",
          description:
            "Der KI-generierte Reiseplan (OpenAI GPT-4) fließt direkt in den Buchungsflow ohne Validierung oder Tests. Halluzinierte Flugdaten könnten gebucht werden.",
          recommendation:
            "Strenge Schema-Validierung für KI-Output (Zod). Tests mit gemockten KI-Responses. Human-in-the-loop für kritische Buchungsschritte.",
        },
        {
          title: "DSGVO: Reisedaten in Prompt-Logs",
          severity: "high",
          description:
            "OpenAI API-Logs enthalten Klartext-Reisedaten inklusive Passdaten-Fragmente. Widerrechtlich unter DSGVO.",
          recommendation:
            "PII-Scrubbing vor jedem AI-API-Call. Anonymisierte Logs. Data Processing Agreement mit OpenAI prüfen.",
        },
        {
          title: "Copy-Paste über 8 Services",
          severity: "medium",
          description:
            "Shared Utilities (Auth, API-Client) wurden in alle Microservices kopiert. Bug-Fixes müssen 8x gepflegt werden.",
          recommendation:
            "Shared npm-Package in Monorepo. Turborepo für Caching. Zero Copy-Paste in 6 Wochen erreichbar.",
        },
      ],
      soll: [
        { area: "KI-Sicherheit", target: "Zod-Validierung für alle KI-Outputs – keine Halluzinationen in Buchungen" },
        { area: "DSGVO", target: "PII-Scrubbing aktiv – keine Personendaten in KI-Logs" },
        { area: "Code-Sharing", target: "Shared npm-Package für alle Services – zero Copy-Paste" },
      ],
      waves: [
        {
          number: 1,
          title: "Sicherheit & Compliance",
          duration: "3 Wochen",
          items: [
            "Zod Schema-Validierung für KI-Output",
            "PII-Scrubber vor AI-API-Calls",
            "OpenAI DPA prüfen und unterzeichnen",
          ],
        },
        {
          number: 2,
          title: "Code-Qualität",
          duration: "6 Wochen",
          items: [
            "Turborepo Monorepo aufsetzen",
            "Shared npm-Package extrahieren",
            "Test-Coverage auf 50 % bringen",
            "E2E für Buchungsflow",
          ],
        },
      ],
    },
    created_at: "2025-01-18T13:00:00Z",
  },

  // ── 19. EnergyGrid Monitor – Utilities (Score: 15 / Kritisch) ───────────────
  {
    wizard_data: {
      projectName: "EnergyGrid Monitor",
      clientName: "Stadtwerke Nordbayern GmbH",
      teamSize: "5-15",
      appCount: "10-20",
      targetApps: "30",
      primaryStack: "dotnet,angular",
      database: "mssql,oracle",
      hosting: "selfhosted",
      legacyApps: "yes",
      legacyDetail:
        "SCADA-System (Win NT 4.0), PLC-Protokoll OPC-DA (veraltet), .NET Framework 2.0 Dispatcher, Crystal Reports 7",
      codeSharing: "copypaste",
      designSystem: "none",
      cicd: "none",
      testing: "none",
      monitoring: "uptime",
      documentation: "outdated",
      branching: "none",
      onboardingTime: "month",
    },
    analysis: {
      score: 15,
      scoreLabel: "Kritisch",
      source: "fallback",
      summary:
        "Kritische Infrastruktur mit alarmierendem Zustand: Windows NT 4.0 SCADA-System für Stromnetzsteuerung, OPC-DA ohne Verschlüsselung und .NET Framework 2.0 im Produktivbetrieb. BSI-Grundschutz-Verletzung. Sofortmaßnahmen erforderlich.",
      risks: [
        {
          title: "Windows NT 4.0 SCADA – EOL seit 2004",
          severity: "high",
          description:
            "Die Stromnetzsteuerung läuft auf Windows NT 4.0 (EOL 2004). Kein Sicherheitspatch in 20 Jahren. Kritische Infrastruktur gemäß BSI-KritisV.",
          recommendation:
            "Notfall-Netzwerksegmentierung SOFORT. Air-Gap wo möglich. SCADA-Modernisierung mit Siemens/Schneider-Partnern. Zeitrahmen: 24 Monate.",
        },
        {
          title: "OPC-DA ohne Authentifizierung und Verschlüsselung",
          severity: "high",
          description:
            "OPC-DA Protokoll überträgt Steuerbefehle für das Stromnetz im Klartext ohne Authentifizierung. Ein Angreifer im Netz kann Befehle injizieren.",
          recommendation:
            "OPC-UA als sicherer Nachfolger mit TLS und Zertifikatsauthentifizierung. Übergang über OPC-Proxy möglich.",
        },
        {
          title: "BSI KritisV – Meldepficht nicht erfüllt",
          severity: "high",
          description:
            "Als kritische Infrastruktur gelten besondere BSI-Anforderungen. ISMS nach ISO 27001 fehlt. Bußgeld bis 100.000 EUR.",
          recommendation:
            "BSI-Meldung sofort vornehmen. ISMS-Projekt nach ISO 27001 starten. Externen CISO für Übergangszeitraum engagieren.",
        },
        {
          title: "Kein Disaster Recovery für Stromnetzausfall",
          severity: "high",
          description:
            "Ein Systemausfall des SCADA bedeutet manuelle Steuerung des Stromnetzes. Keine dokumentierten Notfallprozeduren.",
          recommendation:
            "Disaster Recovery Plan für SCADA-Ausfall. Handbuch-Betrieb testen und dokumentieren. Hot-Standby auf modernem System.",
        },
      ],
      soll: [
        { area: "Sicherheit", target: "SCADA air-gapped oder auf modernem OS – kein Windows NT im Netz" },
        { area: "Protokolle", target: "OPC-UA mit TLS ersetzt OPC-DA vollständig" },
        { area: "Compliance", target: "BSI KritisV ISMS zertifiziert – ISO 27001" },
        { area: "Notfall", target: "SCADA-Ausfall-Prozedur dokumentiert und jährlich geübt" },
      ],
      waves: [
        {
          number: 1,
          title: "NOTFALL (jetzt)",
          duration: "2 Wochen",
          items: [
            "SCADA sofort netzwerksegmentieren (Firewall + DMZ)",
            "BSI-Meldung durchführen",
            "Externen CISO engagieren",
            "Notfall-Prozedur für manuellen Betrieb dokumentieren",
          ],
        },
        {
          number: 2,
          title: "Stabilisierung",
          duration: "6 Monate",
          items: [
            "OPC-UA Pilot (2 PLC)",
            "Hot-Standby SCADA auf modernem System",
            "ISMS ISO 27001 Projekt starten",
            "Technologiepartner für SCADA-Modernisierung beauftragen",
          ],
        },
        {
          number: 3,
          title: "Modernisierung",
          duration: "24 Monate",
          items: [
            "Windows NT 4.0 vollständig abgelöst",
            "OPC-UA vollständig migriert",
            "ISO 27001 Zertifizierung",
            "DR-Test jährlich bestanden",
          ],
        },
      ],
    },
    created_at: "2024-02-10T07:00:00Z",
  },

  // ── 20. DevOps Platform – Internal Developer Platform (Score: 95 / Hervorragend)
  {
    wizard_data: {
      projectName: "DevOps Platform",
      clientName: "Intern (Platform Engineering)",
      teamSize: "5-15",
      appCount: "10-20",
      targetApps: "50",
      primaryStack: "go,nextjs,python",
      database: "postgres,redis",
      hosting: "aws,hetzner",
      legacyApps: "no",
      codeSharing: "monorepo",
      designSystem: "full",
      cicd: "github-actions,standardized",
      testing: "unit,integration,e2e,comprehensive",
      monitoring: "sentry,logging,dashboard,uptime",
      documentation: "adr,storybook,wiki,readme",
      branching: "trunk",
      onboardingTime: "hours",
    },
    analysis: {
      score: 95,
      scoreLabel: "Hervorragend",
      source: "fallback",
      summary:
        "Beste-Klasse Internal Developer Platform: Golden-Path-Workflows, Platform-Team-Modell nach Team Topologies, vollständige Testabdeckung und ADRs für alle wichtigen Entscheidungen. Benchmark-Projekt für alle anderen Teams.",
      risks: [
        {
          title: "Wissenskonzentration im Platform-Team",
          severity: "low",
          description:
            "Das Platform-Team hat 4 Mitglieder – kritisches Infrastrukturwissen ist auf wenige Personen konzentriert.",
          recommendation:
            "Pair-Programming-Rotation mit Stream-Aligned Teams. Runbooks für alle kritischen Operationen. Bus-Faktor auf 3+ erhöhen.",
        },
      ],
      soll: [
        { area: "Knowledge", target: "Bus-Faktor 3+ für alle kritischen Platform-Bereiche" },
      ],
      waves: [
        {
          number: 1,
          title: "Knowledge Distribution",
          duration: "3 Monate",
          items: [
            "Pair-Programming Rotation mit allen Teams",
            "Runbooks für alle kritischen Ops vervollständigen",
            "Platform-Engineering-Guild aufbauen",
            "Wissenstransfer-Sessions (1/Monat)",
          ],
        },
      ],
    },
    created_at: "2025-03-15T08:00:00Z",
  },
];

// ── Tasks für ausgewählte Projekte ────────────────────────────────────────────

function buildTasks(
  projectIndex: number,
  projectId: string,
  userId: string
): Array<{
  project_id: string;
  user_id: string;
  wave_number: number;
  wave_title: string;
  item: string;
  status: "open" | "in-progress" | "done";
  note: string | null;
}> {
  const taskSets: Record<
    number,
    Array<{
      wave_number: number;
      wave_title: string;
      item: string;
      status: "open" | "in-progress" | "done";
      note: string | null;
    }>
  > = {
    // AutoFactory OS (Index 0)
    0: [
      { wave_number: 1, wave_title: "Notfallabsicherung", item: "Netzwerksegmentierung aller Legacy-Systeme", status: "done", note: "Firewall-Regeln gesetzt, Legacy-VLAN isoliert" },
      { wave_number: 1, wave_title: "Notfallabsicherung", item: "Prometheus Basis-Monitoring aufsetzen", status: "in-progress", note: null },
      { wave_number: 1, wave_title: "Notfallabsicherung", item: "COM+-Komponenten Inventar erstellen", status: "open", note: null },
      { wave_number: 1, wave_title: "Notfallabsicherung", item: "SAP S/4HANA Assessment beauftragen", status: "open", note: null },
      { wave_number: 2, wave_title: "Modernisierung", item: ".NET 8 für alle neuen Services verpflichtend", status: "open", note: null },
    ],
    // FinTech Pay (Index 4)
    4: [
      { wave_number: 1, wave_title: "Compliance Finish", item: "PCI-DSS Controls dokumentieren", status: "done", note: "Alle 264 Controls erfasst" },
      { wave_number: 1, wave_title: "Compliance Finish", item: "Pen-Test-Dienstleister beauftragen", status: "done", note: "Cure53 beauftragt, Termin: April 2026" },
      { wave_number: 1, wave_title: "Compliance Finish", item: "Bug-Bounty-Programm (HackerOne) einrichten", status: "in-progress", note: "Scope definiert, Launch-Datum noch offen" },
      { wave_number: 1, wave_title: "Compliance Finish", item: "QSA-Beratergespräch durchführen", status: "open", note: null },
    ],
    // TechStartup Alpha (Index 11)
    11: [
      { wave_number: 1, wave_title: "Basis aufbauen", item: "GitHub Actions CI/CD aufsetzen", status: "done", note: "Lint + Build automatisch" },
      { wave_number: 1, wave_title: "Basis aufbauen", item: "Sentry integrieren", status: "done", note: "DSN gesetzt, erste Fehler sichtbar" },
      { wave_number: 1, wave_title: "Basis aufbauen", item: "Supabase PITR aktivieren", status: "done", note: null },
      { wave_number: 1, wave_title: "Basis aufbauen", item: "Erste Unit-Tests schreiben", status: "in-progress", note: "3 Tests vorhanden, Ziel: 20" },
      { wave_number: 2, wave_title: "Qualität sichern", item: "Test-Coverage auf 40 % bringen", status: "open", note: null },
      { wave_number: 2, wave_title: "Qualität sichern", item: "Staging-Umgebung einrichten", status: "open", note: null },
    ],
    // TravelBook AI (Index 17)
    17: [
      { wave_number: 1, wave_title: "Sicherheit & Compliance", item: "Zod Schema-Validierung für KI-Output", status: "done", note: "Schema für FlightResult, HotelResult implementiert" },
      { wave_number: 1, wave_title: "Sicherheit & Compliance", item: "PII-Scrubber vor AI-API-Calls", status: "in-progress", note: "Regex für Name, Passnummer, Email" },
      { wave_number: 1, wave_title: "Sicherheit & Compliance", item: "OpenAI DPA prüfen und unterzeichnen", status: "open", note: null },
      { wave_number: 2, wave_title: "Code-Qualität", item: "Turborepo Monorepo aufsetzen", status: "open", note: null },
      { wave_number: 2, wave_title: "Code-Qualität", item: "Shared npm-Package extrahieren", status: "open", note: null },
    ],
    // DevOps Platform (Index 19)
    19: [
      { wave_number: 1, wave_title: "Knowledge Distribution", item: "Pair-Programming Rotation mit allen Teams", status: "in-progress", note: "3 Teams onboarded, 2 ausstehend" },
      { wave_number: 1, wave_title: "Knowledge Distribution", item: "Runbooks für alle kritischen Ops vervollständigen", status: "done", note: "12 Runbooks published im Wiki" },
      { wave_number: 1, wave_title: "Knowledge Distribution", item: "Platform-Engineering-Guild aufbauen", status: "open", note: null },
      { wave_number: 1, wave_title: "Knowledge Distribution", item: "Wissenstransfer-Sessions (1/Monat)", status: "open", note: null },
    ],
  };

  const tasks = taskSets[projectIndex] ?? [];
  return tasks.map((t) => ({ ...t, project_id: projectId, user_id: userId }));
}

// ── Hauptfunktion ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Supabase Seed-Skript gestartet");
  console.log(`   URL:     ${SUPABASE_URL}`);
  console.log(`   User-ID: ${SEED_USER_ID}\n`);

  let insertedProjects = 0;
  let insertedTasks = 0;
  const projectIds: string[] = [];

  for (let i = 0; i < PROJECTS.length; i++) {
    const p = PROJECTS[i];
    const name = (p.wizard_data as { projectName: string }).projectName;

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: SEED_USER_ID,
        wizard_data: p.wizard_data,
        analysis: p.analysis,
        created_at: p.created_at,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  ❌ Projekt "${name}" fehlgeschlagen:`, error.message);
      projectIds.push("");
      continue;
    }

    const projectId = data.id as string;
    projectIds.push(projectId);
    insertedProjects++;

    const score = (p.analysis as { score: number }).score;
    const label = (p.analysis as { scoreLabel: string }).scoreLabel;
    console.log(
      `  ✅ [${String(i + 1).padStart(2, "0")}] ${name.padEnd(28)} Score: ${score} / ${label}`
    );

    // Tasks einfügen
    const tasks = buildTasks(i, projectId, SEED_USER_ID!);
    if (tasks.length > 0) {
      const { error: taskError } = await supabase.from("tasks").insert(tasks);
      if (taskError) {
        console.warn(`       ⚠️  Tasks fehlgeschlagen: ${taskError.message}`);
      } else {
        insertedTasks += tasks.length;
        console.log(`       📋 ${tasks.length} Tasks eingefügt`);
      }
    }

    // analysis_snapshots einfügen
    const analysis = p.analysis as {
      score: number;
      scoreLabel: string;
      source: string;
      risks: Array<{ severity: string }>;
    };
    const highCount = analysis.risks.filter((r) => r.severity === "high").length;

    await supabase.from("analysis_snapshots").insert({
      project_id: projectId,
      user_id: SEED_USER_ID,
      score: analysis.score,
      score_label: analysis.scoreLabel,
      risk_count: analysis.risks.length,
      high_count: highCount,
      source: analysis.source,
      taken_at: p.created_at,
    });
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`✅ ${insertedProjects} / ${PROJECTS.length} Projekte eingefügt`);
  console.log(`📋 ${insertedTasks} Tasks eingefügt`);
  console.log("─────────────────────────────────────────");

  if (insertedProjects < PROJECTS.length) {
    console.warn(
      "\n⚠️  Einige Projekte konnten nicht eingefügt werden.\n" +
        "   Stelle sicher, dass die SEED_USER_ID in auth.users existiert\n" +
        "   und der SUPABASE_SERVICE_ROLE_KEY korrekt ist."
    );
  } else {
    console.log("\n🎉 Seed erfolgreich abgeschlossen!");
  }
}

main().catch((err) => {
  console.error("Unerwarteter Fehler:", err);
  process.exit(1);
});
