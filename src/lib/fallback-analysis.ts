import { WizardData, Risk, SollItem, Wave, AnalysisResult } from '@/types';

// ══════════════════════════════
// RULES CATALOG (exportiert für die Regelwerk-Anzeige)
// ══════════════════════════════
export interface RuleCatalogEntry {
  id: string;
  category: string;
  title: string;
  triggerDescription: string;
  severity: 'high' | 'medium' | 'low' | 'variable';
  scoreImpact: string;
  contextSensitive: boolean;
  recommendation: string;
}

export const RULES_CATALOG: RuleCatalogEntry[] = [
  // ── Testing & Qualität ──
  { id: 'testing-missing', category: 'Testing & Qualität', title: 'Fehlendes / Minimales Testing',
    triggerDescription: 'Wenn kein oder minimales Testing (none/minimal) angegeben ist.',
    severity: 'variable', scoreImpact: '+15 Pkt. für "comprehensive" · +10 für unit/integration/e2e · +3 für "minimal"',
    contextSensitive: true,
    recommendation: 'Einheitliches Testing-Framework mit Coverage-Gate in CI/CD einführen. Bei Monorepos: Shared Testing Utilities nutzen.' },
  { id: 'mongodb-no-testing', category: 'Testing & Qualität', title: 'MongoDB ohne Schema-Tests (Schema-Drift-Risiko)',
    triggerDescription: 'MongoDB als Datenbank UND kein oder minimales Testing.',
    severity: 'high', scoreImpact: 'Kein zusätzlicher Score-Einfluss (s. Testing-Regel)',
    contextSensitive: false,
    recommendation: 'MongoDB hat keine Schemavalidierung – Datenmutationen durch Bugs bleiben ohne Tests unbemerkt. Mongoose-Schemas + umfangreiche Integrationstests einführen.' },

  // ── CI/CD & Deployment ──
  { id: 'cicd-missing', category: 'CI/CD & Deployment', title: 'Inkonsistente oder fehlende CI/CD',
    triggerDescription: 'CI/CD ist "inconsistent", "none" oder nicht gesetzt.',
    severity: 'variable', scoreImpact: '+15 Pkt. für "standardized" · +8 für GitHub Actions / GitLab CI / Jenkins · +5 für andere Werte',
    contextSensitive: true,
    recommendation: 'Reusable Workflow-Templates erstellen, die von allen Apps genutzt werden. Quality Gates (Tests, Linting, Security-Scan) in jede Pipeline integrieren.' },

  // ── Monitoring & Observability ──
  { id: 'monitoring-missing', category: 'Monitoring & Observability', title: 'Kein Monitoring / Error Tracking',
    triggerDescription: 'Monitoring ist "none" oder nicht gesetzt.',
    severity: 'high', scoreImpact: '+10 Pkt. für Sentry/Dashboard + Uptime/Logging · +7 für Sentry oder Dashboard · +4 für Uptime/Analytics/Logging',
    contextSensitive: true,
    recommendation: 'Empfehlung (skalierend): Sentry (Error Tracking) + Uptime-Monitoring + zentrales Dashboard. Bei Enterprise: APM, Distributed Tracing, Centralized Logging, SLOs/SLIs.' },
  { id: 'monitoring-no-analytics', category: 'Monitoring & Observability', title: 'Keine Business-Analytics / Web Analytics',
    triggerDescription: 'Weder Web-Analytics noch Dashboard aktiv UND Ziel-Apps ≥ 20.',
    severity: 'low', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: false,
    recommendation: 'Plausible Analytics, Posthog oder Google Analytics 4 integrieren, um Nutzerverhalten und Business-Kennzahlen messbar zu machen.' },

  // ── Architektur & Code-Sharing ──
  { id: 'codesharing-missing', category: 'Architektur & Code-Sharing', title: 'Kein Code-Sharing / Copy-Paste',
    triggerDescription: 'Code-Sharing ist "none", "copypaste" oder nicht gesetzt.',
    severity: 'high', scoreImpact: '+15 Pkt. für Monorepo · +10 für Shared Library · +3 für Git Submodules',
    contextSensitive: true,
    recommendation: 'Shared Monorepo (Turborepo/Nx) einführen. Jede App profitiert sofort von Bugfixes in Shared Packages. Private npm Registry (GitHub Packages) für versionierte Releases.' },
  { id: 'git-submodules', category: 'Architektur & Code-Sharing', title: 'Git Submodules: Fehleranfälliges Code-Sharing',
    triggerDescription: 'Git Submodules als Code-Sharing-Methode ausgewählt.',
    severity: 'medium', scoreImpact: 'Nur +3 Pkt. (gegenüber +10 für SharedLib oder +15 für Monorepo)',
    contextSensitive: false,
    recommendation: 'Migration zu Monorepo (Turborepo/Nx) oder Private npm Registry. Deutlich stabiler, entwicklerfreundlicher und frei von Synchronisationsproblemen.' },
  { id: 'design-system-missing', category: 'Architektur & Code-Sharing', title: 'Kein Design System',
    triggerDescription: 'Design System ist "none".',
    severity: 'variable', scoreImpact: '+10 Pkt. für "full" · +5 Pkt. für "partial" · 0 Pkt. für "none"',
    contextSensitive: true,
    recommendation: 'Shared UI-Library mit Design Tokens auf Basis eines Komponentenframeworks (z.B. shadcn/ui) einführen. Storybook für lebendige Komponentendokumentation.' },
  { id: 'tech-fragmentation', category: 'Architektur & Code-Sharing', title: 'Hohe Technologie-Fragmentierung',
    triggerDescription: '≥ 3 verschiedene Tech Stacks ODER ≥ 3 verschiedene Datenbank-Technologien.',
    severity: 'variable', scoreImpact: 'Kein direkter Score-Einfluss (erhöhte kognitive Last & Wartungsaufwand)',
    contextSensitive: true,
    recommendation: 'Technology Radar einführen (Adopt / Trial / Assess / Hold). Neue Apps nur mit dem Standard-Stack starten. Langfristige Konsolidierung planen.' },
  { id: 'mixed-db-strategy', category: 'Architektur & Code-Sharing', title: 'Gemischte Datenbank-Strategie (relational + nicht-relational)',
    triggerDescription: 'Sowohl relationale (PostgreSQL, MySQL, MariaDB, SQLite) als auch nicht-relationale Datenbanken (MongoDB, Firebase) gleichzeitig im Einsatz.',
    severity: 'medium', scoreImpact: 'Kein direkter Score-Einfluss',
    contextSensitive: true,
    recommendation: 'ADR schreiben, das begründet, warum beide Datenbanktypen benötigt werden. Abstraktionsschicht (Repository Pattern) zwischen Anwendung und Datenbanktyp einführen.' },

  // ── Dokumentation ──
  { id: 'documentation-missing', category: 'Dokumentation', title: 'Fehlende Dokumentation',
    triggerDescription: 'Dokumentation ist "none", "outdated" oder nicht gesetzt.',
    severity: 'variable', scoreImpact: '+10 Pkt. für ADR + Wiki/Storybook · +7 Pkt. für ADR allein · +3 Pkt. für README',
    contextSensitive: true,
    recommendation: 'Living Documentation: Architecture Decision Records (ADRs) für alle Architekturentscheidungen, README pro App, Runbooks für Operations, Storybook für UI-Komponenten.' },

  // ── Infrastruktur & Hosting ──
  { id: 'hosting-fragmentation', category: 'Infrastruktur & Hosting', title: 'Fragmentierte Hosting-Landschaft',
    triggerDescription: '≥ 3 verschiedene Hosting-Plattformen aktiv.',
    severity: 'medium', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: true,
    recommendation: 'Langfristig konsolidieren. Infrastructure-as-Code (Terraform/Pulumi) für alle Umgebungen einführen. FinOps für Kostenoptimierung.' },
  { id: 'strato-hosting', category: 'Infrastruktur & Hosting', title: 'Strato Shared Hosting: Skalierbarkeits-Limit',
    triggerDescription: 'Strato als Hosting ausgewählt UND Team größer als "small".',
    severity: 'medium', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: false,
    recommendation: 'Migration zu modernem Hosting einplanen: Hetzner VPS + Docker, Vercel (für Node.js/Next.js) oder AWS/Azure. Hetzner ist kostengünstig und erlaubt vollständige Container-Setups.' },
  { id: 'selfhosted-no-docker', category: 'Infrastruktur & Hosting', title: 'Self-Hosting ohne Containerisierung',
    triggerDescription: 'Self-hosted als Hosting + kein Docker + Ziel-Apps ≥ 10.',
    severity: 'medium', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: false,
    recommendation: 'Docker + Docker Compose einführen. GitHub Actions → Docker Build → SSH-Deploy für automatisierte Deployments. Langfristig: k3s (leichtgewichtiges Kubernetes) evaluieren.' },
  { id: 'no-caching-at-scale', category: 'Infrastruktur & Hosting', title: 'Kein Caching (Redis) bei Cloud-Skalierung',
    triggerDescription: 'Redis nicht in der Datenbank-Auswahl + Cloud-Hosting (AWS, Azure oder GCP) + Ziel-Apps ≥ 20.',
    severity: 'low', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: true,
    recommendation: 'Redis als Caching-Layer für Session-Management, API-Response-Caching und häufige Datenbankabfragen einführen. Reduziert Cloud-Kosten und verbessert Antwortzeiten deutlich.' },
  { id: 'no-iac-cloud', category: 'Infrastruktur & Hosting', title: 'Cloud-Hosting ohne Infrastructure-as-Code',
    triggerDescription: 'AWS, Azure oder GCP als Hosting + kein standardisiertes CI/CD + Skalierung "large" oder "enterprise".',
    severity: 'medium', scoreImpact: 'Kein direkter Score-Einfluss',
    contextSensitive: true,
    recommendation: 'Terraform oder Pulumi für alle Cloud-Ressourcen einführen. IaC ermöglicht reproduzierbare Umgebungen, Disaster Recovery und Audit-Trails für Infrastrukturänderungen.' },
  { id: 'container-enterprise', category: 'Infrastruktur & Hosting', title: 'Keine Container-Strategie (Enterprise)',
    triggerDescription: 'Self-hosted oder Docker NICHT im Hosting + Skalierung "enterprise".',
    severity: 'medium', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: false,
    recommendation: 'Container-Strategie definieren: Docker für alle Workloads, orchestriert mit Kubernetes (EKS/AKS/GKE) oder k3s. Standardisierte Base-Images im internen Registry.' },

  // ── Technologie & Stack ──
  { id: 'java-dotnet-vercel', category: 'Technologie & Stack', title: 'Java/.NET inkompatibel mit Vercel',
    triggerDescription: 'Java oder .NET im Tech Stack + Vercel als Hosting.',
    severity: 'high', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: false,
    recommendation: 'Vercel ist für Serverless Node.js/Next.js optimiert. Für Java/.NET bitte Railway, Render, AWS ECS oder Azure App Service verwenden. Vercel nur für reine Frontend-Apps behalten.' },
  { id: 'laravel-vercel', category: 'Technologie & Stack', title: 'Laravel auf Vercel: Stark eingeschränkt',
    triggerDescription: 'Laravel im Tech Stack + Vercel als Hosting.',
    severity: 'high', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: false,
    recommendation: 'PHP/Laravel auf Vercel unterstützt keine Sessions, Queues, DB-Verbindungen oder Cron Jobs zuverlässig. Laravel auf Hetzner VPS (Docker), DigitalOcean, Ploi oder AWS EC2 deployen.' },
  { id: 'sqlite-multi-app', category: 'Technologie & Stack', title: 'SQLite ungeeignet für Multi-App-Skalierung',
    triggerDescription: 'SQLite als Datenbank + Ziel-Apps ≥ 20.',
    severity: 'medium', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: false,
    recommendation: 'SQLite ist dateibasiert und unterstützt keinen parallelen Zugriff aus mehreren Prozessen. Migration auf PostgreSQL oder MySQL planen. Supabase bietet kostenlosen PostgreSQL-Service.' },
  { id: 'firebase-vendor-lock', category: 'Technologie & Stack', title: 'Firebase Vendor Lock-in bei hoher Skalierung',
    triggerDescription: 'Firebase als Datenbank + Ziel-Apps ≥ 50.',
    severity: 'medium', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: false,
    recommendation: 'Firebase-Kosten skalieren nicht-linear. Abstraktionsschicht einführen. Firebase-Kosten-Kalkulation durchführen und Alternative (Supabase, PostgreSQL-basiert) evaluieren.' },

  // ── Team & Organisation ──
  { id: 'legacy-systems', category: 'Team & Organisation', title: 'Legacy-Systeme ohne Sicherheitspatches',
    triggerDescription: 'Legacy-Systeme als "Ja" markiert.',
    severity: 'high', scoreImpact: '+10 Pkt. wenn kein Legacy vorhanden · 0 Pkt. wenn Legacy vorhanden',
    contextSensitive: true,
    recommendation: 'Strangler Fig Pattern für schrittweise Ablösung. Sofort: Netz-Isolation + WAF. Bei Enterprise: dediziertes Migrations-Team aufsetzen.' },
  { id: 'branching-missing', category: 'Team & Organisation', title: 'Fehlende Branching-Strategie',
    triggerDescription: 'Branching ist "none" oder "basic" UND Team ≥ 5 Entwickler.',
    severity: 'variable', scoreImpact: '+10 Pkt. für Trunk-Based · +8 für Git Flow · +3 für basic · 0 für none',
    contextSensitive: true,
    recommendation: 'Git Flow oder Trunk-Based Development einführen. Branch-Schutzregeln auf main/develop aktivieren. Pull Request Reviews verpflichtend.' },
  { id: 'onboarding-slow', category: 'Team & Organisation', title: 'Langsames Onboarding (≥ 2 Wochen)',
    triggerDescription: 'Onboarding-Zeit ist "weeks" (2–4 Wochen) oder "month" (> 1 Monat).',
    severity: 'variable', scoreImpact: '+5 Pkt. für "days"/"week" · +2 Pkt. für "weeks" · 0 für "month"',
    contextSensitive: true,
    recommendation: 'Standard-Architektur + CLI-Tool + Onboarding-Runbook. Dev Containers für sofort lauffähige Entwicklungsumgebungen. Ziel: neuer Entwickler produktiv in 1–2 Tagen.' },
  { id: 'apps-per-dev-ratio', category: 'Team & Organisation', title: 'Ungünstiges Apps-zu-Entwickler-Verhältnis',
    triggerDescription: '≥ 4 Apps pro Entwickler UND ≥ 8 Apps insgesamt.',
    severity: 'variable', scoreImpact: 'Kein direkter Score-Einfluss',
    contextSensitive: true,
    recommendation: 'Team-Ownership-Modell einführen (kein Einzelpersonen-Ownership). Automatisierung maximal priorisieren. Neue Apps nur bei klar definierter Teamzuständigkeit starten.' },
  { id: 'bus-factor', category: 'Team & Organisation', title: 'Bus-Faktor: Kritische Wissenskonzentration',
    triggerDescription: '≤ 5 Entwickler + ≥ 5 Apps + keine Dokumentation.',
    severity: 'high', scoreImpact: 'Kein direkter Score-Einfluss',
    contextSensitive: false,
    recommendation: 'Sofort: Jede App bekommt README + Deployment-Runbook. Pair Programming für kritische Systeme einführen. Kein System darf nur einer Person bekannt sein.' },

  // ── Security & Compliance ──
  { id: 'auth-selfbuilt', category: 'Security & Compliance', title: 'Selbst gebaute Authentifizierung (OWASP A07)',
    triggerDescription: 'authStrategy ist "selfbuilt" (Custom Login) oder "jwt" (JWT selbst implementiert).',
    severity: 'high', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: false,
    recommendation: 'Migration zu Managed Auth Provider: Auth0 (kostenlos bis 7.500 User), Supabase Auth, NextAuth.js oder Keycloak (selbst hostbar). Kein Custom Auth für Produktionssysteme.' },
  { id: 'sec-no-dependency-scan', category: 'Security & Compliance', title: 'Kein Dependency-Scanning: CVE-Blindflug',
    triggerDescription: 'Kein Dependency Scanning in den Sicherheitsmaßnahmen + Team nicht "small" oder Ziel-Apps ≥ 20.',
    severity: 'variable', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: true,
    recommendation: 'GitHub Dependabot kostenlos aktivieren. Snyk Free für erweiterte Analyse. Renovate für automatisierte Dependency-Updates. SLA für kritische CVEs definieren (Patch < 24h).' },
  { id: 'sec-no-secrets', category: 'Security & Compliance', title: 'Kein Secrets Management: Credentials-Leck-Risiko',
    triggerDescription: 'Kein Secrets Management konfiguriert + Cloud-Hosting (AWS, Azure oder GCP) aktiv.',
    severity: 'high', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: false,
    recommendation: 'Sofort: git-secrets installieren, .env aus .gitignore prüfen. Mittelfristig: AWS SSM Parameter Store (kostenlos), Azure Key Vault oder Doppler/Infisical als SaaS.' },
  { id: 'sec-no-sast', category: 'Security & Compliance', title: 'Kein SAST / Statische Code-Analyse',
    triggerDescription: 'Kein SAST konfiguriert + Ziel-Apps ≥ 20.',
    severity: 'variable', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: true,
    recommendation: 'GitHub Code Scanning (CodeQL) kostenlos für alle Repos aktivieren. SonarCloud als Alternative. Als Required Check in Branch Protection einbinden.' },
  { id: 'sec-no-review', category: 'Security & Compliance', title: 'Kein Code Review Prozess',
    triggerDescription: 'reviewProcess ist "none" UND Team ≥ 5 Entwickler.',
    severity: 'variable', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: true,
    recommendation: 'Branch Protection aktivieren: min. 1 Approval für alle Merges. Automatisierte CI-Checks als Required Status Checks. CODEOWNERS-Datei für sensible Bereiche.' },

  // ── API-Strategie ──
  { id: 'api-no-spec', category: 'API-Strategie', title: 'REST/GraphQL ohne API-Spezifikation',
    triggerDescription: 'REST oder GraphQL als API-Strategie, aber kein OpenAPI/Swagger-Spec + Team ≥ 10 Entwickler.',
    severity: 'medium', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: true,
    recommendation: 'API-First: OpenAPI 3.1 Spec als Single Source of Truth. swagger-jsdoc für automatische Generierung aus Code-Kommentaren. Stoplight oder Redocly für Dokumentations-Portal.' },
  { id: 'api-no-versioning', category: 'API-Strategie', title: 'APIs ohne Versionierung: Breaking-Change-Falle',
    triggerDescription: 'REST, GraphQL oder gRPC als API-Strategie + keine API-Versionierung + Ziel-Apps ≥ 20.',
    severity: 'medium', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: false,
    recommendation: 'URL-Versionierung (/api/v1/) sofort einführen. Deprecation-Header nutzen. Alte Versionen mind. 3 Monate parallel betreiben. GraphQL: Schema-Evolution (Field Deprecation) statt Hard-Versioning.' },
  { id: 'api-no-definition', category: 'API-Strategie', title: 'Keine API-Strategie definiert',
    triggerDescription: 'Kein API-Typ ausgewählt (REST, GraphQL, gRPC) bei ≥ 3 Apps.',
    severity: 'low', scoreImpact: 'Kein Score-Einfluss',
    contextSensitive: true,
    recommendation: 'API-Strategie festlegen: REST für einfache CRUD-APIs, GraphQL für flexible Client-Anforderungen, gRPC für Service-zu-Service-Kommunikation mit hoher Performance. ADR erstellen.' },
];

export interface ScoreCriterion {
  category: string;
  criterion: string;
  maxPoints: number;
  breakdown: { value: string; points: number }[];
}

export const SCORE_CRITERIA: ScoreCriterion[] = [
  { category: 'Testing', criterion: 'Testing-Abdeckung', maxPoints: 15,
    breakdown: [
      { value: 'Umfassend (comprehensive)', points: 15 },
      { value: 'Unit, Integration oder E2E', points: 10 },
      { value: 'Minimal', points: 3 },
      { value: 'Keines', points: 0 },
    ] },
  { category: 'CI/CD', criterion: 'CI/CD-Reifegrad', maxPoints: 15,
    breakdown: [
      { value: 'Standardisiert (alle Apps gleich)', points: 15 },
      { value: 'GitHub Actions / GitLab CI / Jenkins', points: 8 },
      { value: 'Anderes CI/CD-System', points: 5 },
      { value: 'Keine oder inkonsistent', points: 0 },
    ] },
  { category: 'Monitoring', criterion: 'Monitoring & Observability', maxPoints: 10,
    breakdown: [
      { value: 'Sentry/Dashboard + Uptime + Logging', points: 10 },
      { value: 'Sentry oder Dashboard', points: 7 },
      { value: 'Uptime, Analytics oder Logging', points: 4 },
      { value: 'Keines', points: 0 },
    ] },
  { category: 'Dokumentation', criterion: 'Dokumentationsqualität', maxPoints: 10,
    breakdown: [
      { value: 'ADR + Wiki oder Storybook', points: 10 },
      { value: 'ADR, Wiki oder Storybook (einzeln)', points: 7 },
      { value: 'Nur READMEs', points: 3 },
      { value: 'Keine oder veraltet', points: 0 },
    ] },
  { category: 'Code-Sharing', criterion: 'Code-Sharing-Strategie', maxPoints: 15,
    breakdown: [
      { value: 'Monorepo', points: 15 },
      { value: 'Shared Library / npm Package', points: 10 },
      { value: 'Git Submodules', points: 3 },
      { value: 'Copy-Paste oder keines', points: 0 },
    ] },
  { category: 'Design System', criterion: 'Design System Vollständigkeit', maxPoints: 10,
    breakdown: [
      { value: 'Vollständig (full)', points: 10 },
      { value: 'Teilweise (partial)', points: 5 },
      { value: 'Keines', points: 0 },
    ] },
  { category: 'Branching', criterion: 'Branching-Strategie', maxPoints: 10,
    breakdown: [
      { value: 'Trunk-Based Development', points: 10 },
      { value: 'Git Flow', points: 8 },
      { value: 'Basic (main/develop)', points: 3 },
      { value: 'Keine', points: 0 },
    ] },
  { category: 'Legacy', criterion: 'Legacy-Freiheit', maxPoints: 10,
    breakdown: [
      { value: 'Keine Legacy-Systeme', points: 10 },
      { value: 'Legacy-Systeme vorhanden', points: 0 },
    ] },
  { category: 'Onboarding', criterion: 'Onboarding-Geschwindigkeit', maxPoints: 5,
    breakdown: [
      { value: '1–3 Tage oder 1 Woche', points: 5 },
      { value: '2–4 Wochen', points: 2 },
      { value: '> 1 Monat', points: 0 },
    ] },
];

// ── Scale Detection ──
type Scale = 'small' | 'medium' | 'large' | 'enterprise';

function detectScale(d: WizardData): { scale: Scale; teamNum: number; appNum: number; targetNum: number } {
  const teamMap: Record<string, number> = { '1-5': 3, '5-15': 10, '15-30': 22, '30+': 50 };
  const appMap: Record<string, number> = { '0': 0, '1-5': 3, '5-10': 7, '10-20': 15, '20+': 30 };
  const targetMap: Record<string, number> = { '10': 10, '20': 20, '50': 50, '100': 100 };

  const teamNum = teamMap[d.teamSize || ''] || parseInt(d.teamSizeC || '5') || 5;
  const appNum = appMap[d.appCount || ''] || parseInt(d.appCountC || '1') || 1;
  const targetNum = targetMap[d.targetApps || ''] || parseInt(d.targetAppsC || '10') || 10;

  let scale: Scale = 'small';
  if (teamNum > 30 || targetNum >= 100) scale = 'enterprise';
  else if (teamNum > 15 || targetNum >= 50) scale = 'large';
  else if (teamNum > 5 || targetNum >= 20) scale = 'medium';

  return { scale, teamNum, appNum, targetNum };
}

function scaleLabel(s: Scale): string {
  return { small: 'Kleines Team', medium: 'Mittelgroßes Team', large: 'Großes Team', enterprise: 'Enterprise / Konzern' }[s];
}

// ── Multi-select helpers ──
function has(val: string | undefined, ...keys: string[]): boolean {
  if (!val) return false;
  return keys.some(k => val.split(',').includes(k));
}
function hasAny(val: string | undefined): boolean {
  return !!val && val.split(',').filter(Boolean).length > 0;
}
function countTechs(val: string | undefined): number {
  if (!val) return 0;
  return val.split(',').filter(v => v && v !== '_c').length;
}

// ══════════════════════════════
// MAIN ANALYSIS
// ══════════════════════════════
export function fallbackAnalysis(d: WizardData): AnalysisResult {
  const { scale, teamNum, appNum, targetNum } = detectScale(d);
  const risks: Risk[] = [];
  const soll: SollItem[] = [];

  // ── RISKS (scaled) ──

  // Legacy
  if (d.legacyApps === 'yes') {
    const detail = d.legacyDetail ? ` (${d.legacyDetail})` : '';
    const severity = scale === 'enterprise' ? 'high' : 'high';
    const rec = scale === 'enterprise'
      ? 'Dediziertes Migrations-Team aufsetzen. Strangler Fig Pattern für schrittweise Ablösung. Sofort: Netz-Isolation + WAF.'
      : scale === 'large'
      ? 'Migration priorisieren. Strangler Fig Pattern oder Big Bang mit Feature Parity. Sofort: Netz-Isolation.'
      : 'Migrieren, kapseln oder ablösen. Kurzfristig: vom öffentlichen Netz isolieren.';
    risks.push({ title: 'Legacy-Systeme ohne Sicherheitspatches', severity,
      description: `EOL-Technologien erhalten keine Sicherheitsupdates${detail}. Bei ${appNum} Apps und Ziel ${targetNum}+ ist die technische Schuld ${scale === 'enterprise' ? 'ein strategisches Unternehmensrisiko' : 'ein wachsendes Risiko'}.`,
      recommendation: rec });
  }

  // Code-Sharing
  const sharing = d.codeSharing || '';
  if (has(sharing, 'copypaste', 'none') || !hasAny(sharing)) {
    const severity: Risk['severity'] = targetNum >= 50 ? 'high' : 'high';
    const desc = targetNum >= 100
      ? `Bei ${targetNum}+ geplanten Apps ist Copy-Paste eine existenzielle Bedrohung. Ein Bug in einer Shared-Funktion müsste in ${targetNum} Repositories gefixt werden.`
      : targetNum >= 50
      ? `Bei ${targetNum}+ Apps wird jeder Bug exponentiell teurer. Kopierte Versionen driften auseinander und werden unwartbar.`
      : `Bugs werden in jede App kopiert und müssen überall einzeln gefixt werden. Bei Ziel ${targetNum} Apps wird das schnell untragbar.`;
    const rec = scale === 'enterprise'
      ? 'Platform Team aufbauen. Internal Developer Platform mit Shared Packages, Private Registry, automatisierten Updates (Renovate/Dependabot).'
      : scale === 'large'
      ? 'Shared Monorepo (Turborepo/Nx) mit privater npm Registry. Automatisierte Dependency-Updates. Dedizierte Architektur-Verantwortliche.'
      : 'Shared Monorepo (z.B. Turborepo) mit privater npm Registry (GitHub Packages) einführen.';
    risks.push({ title: 'Kein Code-Sharing / Copy-Paste', severity, description: desc, recommendation: rec });
  }

  // Testing
  const testing = d.testing || '';
  if (has(testing, 'none', 'minimal') || !hasAny(testing)) {
    const severity: Risk['severity'] = targetNum >= 50 ? 'high' : 'medium';
    const desc = scale === 'enterprise'
      ? `Bei ${teamNum}+ Entwicklern und ${targetNum}+ Apps ohne einheitliches Testing sind Regressionen unvermeidlich. Jeder Deploy ist ein Produktionsrisiko.`
      : `Ohne automatisierte Tests gibt es kein Sicherheitsnetz. Bei ${targetNum} geplanten Apps wird jeder Deploy ein Risiko.`;
    const rec = scale === 'enterprise'
      ? 'QA-Strategie definieren: Unit/Integration/E2E-Pyramide. Shared Testing Library. Coverage-Gates in CI/CD (min. 80%). Contract Testing für Service-Grenzen. Dedicated QA-Rolle.'
      : scale === 'large'
      ? 'Testing-Framework standardisieren. Shared Test-Utilities. Coverage-Gate in CI/CD (min. 70%). Automatisierte Regression Tests für kritische Flows.'
      : 'Einheitliches Testing-Framework einführen + Coverage-Gate in CI/CD Pipeline.';
    risks.push({ title: 'Fehlendes Testing', severity, description: desc, recommendation: rec });
  }

  // Monitoring
  const mon = d.monitoring || '';
  if (has(mon, 'none') || !hasAny(mon)) {
    const severity: Risk['severity'] = targetNum >= 20 ? 'high' : 'high';
    const desc = targetNum >= 100
      ? `${targetNum}+ Apps ohne Monitoring ist Blindflug auf Autobahn-Geschwindigkeit. Ausfälle, Performance-Degradation und Fehler bleiben systematisch unentdeckt.`
      : targetNum >= 20
      ? `Bei ${targetNum}+ Apps kann niemand mehr manuell überwachen. Fehler werden erst durch Kundenmeldungen entdeckt.`
      : `Ohne Monitoring bleiben Fehler und Ausfälle unbemerkt. Bei wachsender App-Landschaft wird das untragbar.`;
    const rec = scale === 'enterprise'
      ? 'Observability Stack aufbauen: APM (Datadog/New Relic), Distributed Tracing, Centralized Logging (ELK/Loki), Alerting mit Eskalationsstufen, SLOs/SLIs definieren, Incident Response Prozess.'
      : scale === 'large'
      ? 'Zentrales Monitoring: Sentry (Error Tracking) + Uptime-Monitoring + Grafana Dashboard. Alert-Regeln mit Eskalation. On-Call Rotation einführen.'
      : 'Zentrales Dashboard + Error Tracking (Sentry) + Uptime-Monitoring einführen.';
    risks.push({ title: 'Kein Monitoring / Error Tracking', severity, description: desc, recommendation: rec });
  }

  // Documentation
  const doc = d.documentation || '';
  if (has(doc, 'none', 'outdated') || !hasAny(doc)) {
    const severity: Risk['severity'] = teamNum >= 15 ? 'high' : 'medium';
    const desc = teamNum >= 30
      ? `Bei ${teamNum}+ Entwicklern ist fehlende Dokumentation ein Skalierungs-Blocker. Teams arbeiten in Silos, Onboarding dauert Wochen, Architektur-Entscheidungen sind nicht nachvollziehbar.`
      : `Wissen existiert nur in den Köpfen einzelner Entwickler (Bus-Faktor-Risiko). Onboarding neuer Mitarbeiter dauert unverhältnismäßig lang.`;
    const rec = scale === 'enterprise'
      ? 'Documentation-as-Code Strategie: ADRs (verpflichtend), API-Dokumentation (OpenAPI), Runbooks pro Service, Internal Developer Portal (Backstage/Port), Architecture Guidelines.'
      : scale === 'large'
      ? 'Living Documentation: ADRs für alle Entscheidungen, Storybook für UI, Runbooks für Ops, zentrales Wiki. Documentation Owner pro Team.'
      : 'Living Documentation einführen: ADRs, Storybook, Runbooks. Onboarding-Guide schreiben.';
    risks.push({ title: 'Fehlende Dokumentation', severity, description: desc, recommendation: rec });
  }

  // CI/CD
  const ci = d.cicd || '';
  if (has(ci, 'inconsistent', 'none') || !hasAny(ci)) {
    const severity: Risk['severity'] = targetNum >= 50 ? 'high' : 'medium';
    const desc = targetNum >= 100
      ? `Individuelle CI/CD für ${targetNum}+ Apps ist nicht wartbar. Unterschiedliche Qualitätsstandards führen zu inkonsistenter Softwarequalität.`
      : `Unterschiedliche Pipeline-Konfigurationen pro App. Die Wartung wird bei ${targetNum} geplanten Apps unverhältnismäßig aufwändig.`;
    const rec = scale === 'enterprise'
      ? 'Platform Engineering: Golden Paths mit standardisierten Pipelines. Self-Service Portal für Deployments. Feature Flags, Canary Deployments, Blue-Green. GitOps mit ArgoCD/Flux.'
      : scale === 'large'
      ? 'Reusable Workflows im Shared Repo. Standardisierte Pipeline-Templates. Automatisierte Quality Gates. Optional: Feature Flags für schrittweises Rollout.'
      : 'Reusable GitHub Actions Workflows im Shared Monorepo definieren. Eine Änderung, alle Apps profitieren.';
    risks.push({ title: 'Inkonsistente CI/CD', severity, description: desc, recommendation: rec });
  }

  // Design System
  if ((d.designSystem || '') === 'none') {
    const severity: Risk['severity'] = targetNum >= 50 ? 'medium' : 'low';
    const desc = targetNum >= 50
      ? `Bei ${targetNum}+ Apps ohne Design System wird die UX komplett fragmentiert. UI-Entwicklung wird doppelt so teuer durch Duplikation.`
      : 'Jede App sieht anders aus. UI-Komponenten werden zwischen Apps dupliziert.';
    const rec = scale === 'enterprise'
      ? 'Design System Team aufbauen. Komponentenbibliothek mit Storybook, Design Tokens, Figma-Sync. Versioniert und dokumentiert. Adoption Tracking.'
      : 'Shared UI-Library mit Design Tokens auf Basis eines Komponentenframeworks (z.B. shadcn/ui) einführen.';
    risks.push({ title: 'Kein Design System', severity, description: desc, recommendation: rec });
  }

  // Onboarding (scaled)
  const onb = d.onboardingTime || '';
  if (has(onb, 'weeks', 'month')) {
    const severity: Risk['severity'] = teamNum >= 15 ? 'high' : 'medium';
    const desc = teamNum >= 30
      ? `Bei ${teamNum}+ Entwicklern und regelmäßigem Hiring ist langsames Onboarding ein massiver Kostenfaktor. Jede Woche Einarbeitung kostet Produktivität im gesamten Team.`
      : `Neue Entwickler brauchen Wochen um produktiv zu werden. Das bremst das Team-Wachstum.`;
    const rec = scale === 'enterprise'
      ? 'Internal Developer Portal mit Self-Service Onboarding. Standardisierte Dev Environments (Dev Containers/Gitpod). Buddy-System. Strukturierter Onboarding-Plan mit Milestones.'
      : 'Standard-Architektur + CLI-Tool + Onboarding Runbook. Ziel: produktiv in 1–2 Tagen.';
    risks.push({ title: 'Langsames Onboarding', severity, description: desc, recommendation: rec });
  }

  // Multi-Stack complexity
  const stackCount = countTechs(d.primaryStack);
  const dbCount = countTechs(d.database);
  if (stackCount >= 3 || dbCount >= 3) {
    const severity: Risk['severity'] = stackCount >= 4 ? 'high' : 'medium';
    risks.push({ title: 'Hohe Technologie-Fragmentierung', severity,
      description: `${stackCount} verschiedene Tech Stacks und ${dbCount} verschiedene Datenbanken im Einsatz. Das erhöht die Wartungskomplexität und erschwert Code-Sharing und Onboarding erheblich.`,
      recommendation: scale === 'enterprise'
        ? 'Technology Radar einführen. Adopt/Trial/Assess/Hold Kategorien. Strategische Konsolidierung planen, aber pragmatisch: nicht alles auf einmal migrieren.'
        : 'Langfristige Konsolidierung auf 1–2 Haupt-Stacks anstreben. Neue Apps nur noch mit dem Standard-Stack starten.' });
  }

  // Hosting complexity
  const hostCount = countTechs(d.hosting);
  if (hostCount >= 3) {
    risks.push({ title: 'Fragmentierte Hosting-Landschaft', severity: 'medium',
      description: `${hostCount} verschiedene Hosting-Plattformen. Das erschwert einheitliches Monitoring, Deployment und Kostenoptimierung.`,
      recommendation: scale === 'enterprise'
        ? 'Cloud-Strategie definieren (Multi-Cloud oder Konsolidierung). FinOps einführen für Kostenoptimierung. Infrastructure-as-Code (Terraform/Pulumi) standardisieren.'
        : 'Mittelfristig konsolidieren. Docker-basierte Architektur ermöglicht späteren Wechsel. Hosting-Strategie dokumentieren.' });
  }

  // Strato Shared Hosting
  if (has(d.hosting, 'strato') && scale !== 'small') {
    risks.push({ title: 'Strato Shared Hosting: Skalierbarkeits-Limit', severity: 'medium',
      description: `Strato Shared Hosting bietet keine Docker-Unterstützung, keine automatisierten Deployments und stark eingeschränkte Ressourcen. Bei ${targetNum}+ geplanten Apps wird das schnell zum Engpass.`,
      recommendation: 'Migration zu einem modernen Hosting (Hetzner VPS + Docker, Vercel, oder AWS/Azure) einplanen. Hetzner ist preisgünstig und erlaubt vollständige Container-Setups.' });
  }

  // Git Submodules
  if (has(d.codeSharing, 'git-sub')) {
    risks.push({ title: 'Git Submodules: Fehleranfälliges Code-Sharing', severity: 'medium',
      description: 'Git Submodules sind bekannt für Merge-Konflikte, schwieriges Dependency-Management und häufige Synchronisationsfehler. Neue Entwickler verlieren regelmäßig Zeit mit Submodule-Problemen.',
      recommendation: 'Migration zu einem Monorepo (Turborepo/Nx) oder einer Private npm Registry (GitHub Packages). Beide Ansätze sind deutlich stabiler und entwicklerfreundlicher.' });
  }

  // Branching-Strategie
  const branching = d.branching || '';
  if ((branching === 'none' || branching === 'basic') && teamNum >= 5) {
    const severity: Risk['severity'] = teamNum >= 15 ? 'high' : 'medium';
    risks.push({ title: 'Fehlende Branching-Strategie', severity,
      description: `Bei ${teamNum} Entwicklern ohne klare Branching-Strategie entstehen Merge-Konflikte, instabile Releases und unkoordinierte Feature-Entwicklung.`,
      recommendation: scale === 'enterprise'
        ? 'Trunk-Based Development mit Feature Flags (für ${targetNum}+ Apps ideal). Kurze Feature-Branches (max. 1–2 Tage). Release-Branches nur für kritische Fixes.'
        : teamNum >= 10
        ? 'Git Flow oder Trunk-Based Development einführen. Branch-Schutzregeln auf main/develop. Pull Request Reviews verpflichtend.'
        : 'Einfaches Git Flow: main + develop + feature/* Branches. Branch-Schutz auf main aktivieren.' });
  }

  // SQLite in Multi-App-Kontext
  if (has(d.database, 'sqlite') && targetNum >= 20) {
    risks.push({ title: 'SQLite ungeeignet für Multi-App-Skalierung', severity: 'medium',
      description: `SQLite ist dateibasiert und unterstützt keinen parallelen Zugriff aus mehreren Prozessen. Bei ${targetNum}+ geplanten Apps auf gemeinsamer Infrastruktur entsteht ein ernsthaftes Datenbankproblem.`,
      recommendation: 'Migration auf PostgreSQL oder MySQL planen. Supabase bietet kostenlosen PostgreSQL-Hosted-Service als einfachen Einstieg.' });
  }

  // Firebase / Supabase Vendor Lock-in bei großer Skalierung
  if (has(d.database, 'firebase') && targetNum >= 50) {
    risks.push({ title: 'Firebase Vendor Lock-in bei hoher Skalierung', severity: 'medium',
      description: `Firebase-Kosten skalieren stark nicht-linear. Bei ${targetNum}+ Apps können die Lese-/Schreib-Operationen zu unerwarteten Kostenexplosionen führen.`,
      recommendation: 'Firebase-Kosten-Kalkulation durchführen. Abstraktionsschicht über Firebase legen, um spätere Migration zu ermöglichen. Alternative: Supabase (PostgreSQL-basiert, selbst hostbar).' });
  }

  // Hosting + Stack Inkompatibilität (Idee 2)
  const primaryStackList = (d.primaryStack || '').split(',').filter(Boolean);
  const hostingList = (d.hosting || '').split(',').filter(Boolean);
  if ((primaryStackList.includes('java') || primaryStackList.includes('dotnet')) && hostingList.includes('vercel')) {
    risks.push({ title: 'Java/.NET inkompatibel mit Vercel', severity: 'high',
      description: 'Vercel ist für Serverless Node.js/Next.js optimiert. Java Spring Boot und .NET benötigen persistent laufende Server-Prozesse und sind auf Vercel nicht lauffähig.',
      recommendation: 'Für Java/.NET: Railway, Render, AWS ECS oder Azure App Service verwenden. Vercel nur für reine Frontend-Apps behalten.' });
  }
  if (primaryStackList.includes('laravel') && hostingList.includes('vercel')) {
    risks.push({ title: 'Laravel auf Vercel: Stark eingeschränkt', severity: 'high',
      description: 'PHP/Laravel auf Vercel unterstützt keine Sessions, Queues, DB-Verbindungen oder Cron Jobs zuverlässig. Produktiveinsatz ist nicht empfohlen.',
      recommendation: 'Laravel-Apps auf Hetzner VPS (Docker), DigitalOcean, Ploi oder AWS EC2 deployen. Vercel für reine Frontend-Assets reservieren.' });
  }
  if (hostingList.includes('selfhosted') && !hostingList.includes('docker') && targetNum >= 10) {
    risks.push({ title: 'Self-Hosting ohne Docker: Manuelle Deployments', severity: 'medium',
      description: `Self-Hosted ohne Container-Virtualisierung bedeutet manuelle Server-Konfiguration für jede App. Bei ${targetNum}+ geplanten Apps wird das ein Vollzeit-Job.`,
      recommendation: 'Docker + Docker Compose einführen. GitHub Actions für automatisierte Deployments. Langfristig: k3s (leichtgewichtiges Kubernetes) evaluieren.' });
  }

  // Team/Apps-Verhältnis (Idee 3)
  const appsPerDev = appNum / Math.max(teamNum, 1);
  if (appsPerDev >= 4 && appNum >= 8) {
    const severity: Risk['severity'] = appsPerDev >= 7 ? 'high' : 'medium';
    risks.push({ title: 'Ungünstiges Apps-zu-Entwickler-Verhältnis', severity,
      description: `${appNum} Apps bei ${teamNum} Entwicklern = ~${Math.round(appsPerDev)} Apps pro Person. Urlaub, Krankheit oder Kündigung erzeugen sofort kritische Wissenslücken.`,
      recommendation: scale === 'enterprise'
        ? 'Team-Ownership-Modell (kein Einzelpersonen-Ownership). Platform-Team aufbauen, das Wartungsaufwand durch Automatisierung reduziert.'
        : 'App-Ownership klar dokumentieren. Automatisierung priorisieren. Neue Apps nur bei klar definierter Zuständigkeit starten.' });
  }

  // Bus-Faktor: Wissenskonzentration (Idee 6)
  if (teamNum <= 5 && appNum >= 5 && !has(doc, 'readme', 'adr', 'wiki', 'storybook')) {
    risks.push({ title: 'Bus-Faktor: Kritische Wissenskonzentration', severity: 'high',
      description: `Bei ${teamNum} Entwicklern und ${appNum}+ Apps ohne Dokumentation liegt kritisches Systemwissen bei 1–2 Personen. Ausfall oder Kündigung = sofortiger Stillstand der betroffenen Apps.`,
      recommendation: 'Sofort: Jede App bekommt README + Deployment-Runbook. Pair Programming für kritische Systeme einführen. Kein System darf nur einer Person bekannt sein.' });
  }

  // ── NEUE REGELN ──

  // MongoDB ohne Testing → Schema-Drift ist ein kritisches Risiko
  const dbList = (d.database || '').split(',').filter(Boolean);
  if (dbList.includes('mongodb') && (has(testing, 'none', 'minimal') || !hasAny(testing))) {
    const mongoTestTool = primaryStackList.includes('laravel') ? 'PHPUnit + Pest'
      : primaryStackList.includes('dotnet') ? 'xUnit / NUnit'
      : primaryStackList.includes('java') ? 'JUnit 5 + Testcontainers'
      : 'Vitest / Jest';
    risks.push({ title: 'MongoDB ohne Schema-Tests: Stille Datenmutation', severity: 'high',
      description: `MongoDB erzwingt kein Schema – ohne Tests können Bugs Datensätze in falschem Format schreiben oder Felder löschen, ohne dass der Fehler bemerkt wird. Bei ${appNum} Apps erhöht sich dieses Risiko exponentiell.`,
      recommendation: `Mongoose-Schemas mit strikter Validierung einführen. ${mongoTestTool}-Integrationstests für alle DB-Operationen vorschreiben. Zod- oder Joi-Validierung an allen API-Grenzen.` });
  }

  // Keine Business-Analytics bei wachsender App-Landschaft
  if (!has(mon, 'analytics', 'dashboard') && targetNum >= 20) {
    risks.push({ title: 'Keine Business-Analytics: Blind Scale', severity: 'low',
      description: `Bei ${targetNum}+ geplanten Apps ohne Web-Analytics oder Business-Dashboard ist kein datengetriebenes Wachstum möglich. Produktentscheidungen basieren auf Annahmen statt Nutzerdaten.`,
      recommendation: scale === 'enterprise'
        ? 'Zentrales Analytics-Stack: Posthog oder Amplitude für Produktanalytics, Grafana für technische KPIs. Einheitliche Event-Tracking-Library für alle Apps.'
        : 'Plausible Analytics (DSGVO-konform, selbst hostbar) oder Posthog für alle Apps integrieren. Shared Analytics-Wrapper als Shared Package verteilen.' });
  }

  // Gemischte DB-Strategie (relational + nicht-relational)
  const relationalDbs = ['postgres', 'mysql', 'mariadb', 'sqlite', 'supabase'];
  const nonRelationalDbs = ['mongodb', 'firebase'];
  const hasRelational = relationalDbs.some(db => dbList.includes(db));
  const hasNonRelational = nonRelationalDbs.some(db => dbList.includes(db));
  if (hasRelational && hasNonRelational && dbCount >= 2) {
    risks.push({ title: 'Gemischte Datenbank-Strategie ohne klares Konzept', severity: 'medium',
      description: `Gleichzeitiger Einsatz von relationalen (${relationalDbs.filter(db => dbList.includes(db)).join(', ')}) und nicht-relationalen Datenbanken (${nonRelationalDbs.filter(db => dbList.includes(db)).join(', ')}) erhöht die Betriebskomplexität. Zwei verschiedene Backup-, Monitoring- und Skalierungsstrategien werden nötig.`,
      recommendation: `ADR erstellen: Für welchen Anwendungsfall wird welcher Datenbanktyp genutzt? Repository Pattern als Abstraktionsschicht einführen. ${scale === 'enterprise' ? 'Service-Ownership klären: welches Team ist für welche Datenbank verantwortlich?' : 'Mittelfristig prüfen, ob ein Typ ausreicht (PostgreSQL kann auch JSON/Document-Daten gut speichern).'}` });
  }

  // Kein Caching (Redis) bei Cloud-Hosting mit hoher Skalierung
  if (!dbList.includes('redis') && (hostingList.includes('aws') || hostingList.includes('azure') || hostingList.includes('gcp')) && targetNum >= 20) {
    risks.push({ title: 'Kein Caching (Redis) bei Cloud-Skalierung', severity: 'low',
      description: `Bei ${targetNum}+ Apps auf Cloud-Infrastruktur ohne Caching-Layer treffen alle Requests direkt die Datenbank. Cloud-Datenbankkosten skalieren linear mit Last – ungecachte API-Responses können Cloud-Kosten vervielfachen.`,
      recommendation: `Redis (managed: AWS ElastiCache, Azure Cache for Redis oder Upstash als serverlose Alternative) als Caching-Layer einführen. Typische Use Cases: Session-Management, API-Response-Caching (TTL 5–60s), Rate-Limiting, Job-Queues.` });
  }

  // Infrastructure-as-Code fehlt bei Cloud + großer Skalierung
  const cloudHostings = ['aws', 'azure', 'gcp'];
  const usesCloud = cloudHostings.some(h => hostingList.includes(h));
  if (usesCloud && (scale === 'large' || scale === 'enterprise') && !has(ci, 'standardized')) {
    risks.push({ title: 'Cloud-Infrastruktur ohne Infrastructure-as-Code', severity: 'medium',
      description: `${cloudHostings.filter(h => hostingList.includes(h)).map(h => h.toUpperCase()).join('/')} ohne IaC bedeutet: manuelle Klick-Deployments, keine reproduzierbaren Umgebungen und kein Audit-Trail für Infrastrukturänderungen. Bei ${targetNum}+ Apps entsteht "Cloud-Chaos".`,
      recommendation: scale === 'enterprise'
        ? 'Terraform oder Pulumi für alle Cloud-Ressourcen (Pflicht). GitOps: Infrastrukturänderungen nur über Pull Requests. Kostenschätzung vor jedem Apply (terraform plan). Drift-Detection automatisieren.'
        : 'Terraform-Starter-Setup für alle Cloud-Ressourcen. State in S3/Azure Blob speichern. Basis-Module für VPC, Datenbank, Container-Service.' });
  }

  // Keine Container-Strategie bei Enterprise
  if ((scale === 'enterprise') && !hostingList.includes('docker') && !hostingList.includes('aws') && !hostingList.includes('azure') && !hostingList.includes('gcp')) {
    risks.push({ title: 'Keine Container-Strategie (Enterprise-Risiko)', severity: 'medium',
      description: `Enterprise-Projekte ohne Container-Strategie leiden unter: langsamen, manuellen Deployments, schwer reproduzierbaren Umgebungen und erschwertem horizontalen Skalieren. Bei ${targetNum}+ Apps ist das ein strukturelles Problem.`,
      recommendation: 'Docker für alle Workloads einführen. Container-Orchestrierung evaluieren: Kubernetes (EKS/AKS/GKE) für Hochlast, k3s/k3d für leichtgewichtige Setups. Standardisierte Base-Images im internen Container-Registry.' });
  }

  // ── SICHERHEIT & AUTH ──
  const sec = d.security || '';
  const auth = d.authStrategy || '';
  const apiStrat = d.apiStrategy || '';
  const review = d.reviewProcess || '';

  // Selbst gebaute Authentifizierung (OWASP A07)
  if (auth === 'selfbuilt' || auth === 'jwt') {
    const severity: Risk['severity'] = auth === 'selfbuilt' ? 'high' : 'medium';
    risks.push({ title: auth === 'selfbuilt' ? 'Selbst gebautes Auth-System: Sicherheitslücken vorprogrammiert' : 'JWT selbst implementiert: Fehleranfällige Auth-Logik',
      severity,
      description: auth === 'selfbuilt'
        ? `Selbst implementierte Authentifizierungssysteme sind eine der häufigsten Ursachen für Sicherheitsvorfälle (OWASP A07). Session-Management, Passwort-Hashing, Rate-Limiting, Token-Rotation – jede Komponente kann kritische Fehler enthalten. Bei ${appNum} Apps multipliziert sich die Angriffsfläche.`
        : 'JWT-Implementierungen sind oft fehlerhaft: falsche Algorithmen ("none"-Angriff), fehlende Token-Rotation, zu lange Ablaufzeiten, unsichere Secrets. Custom JWT-Code wird selten umfassend auf Sicherheit geprüft.',
      recommendation: scale === 'enterprise'
        ? 'Sofort: Migration zu Enterprise Identity Provider (Keycloak on-prem, Azure AD B2C oder Okta). Zero-Trust Architektur implementieren. IAM-Audit aller bestehenden Tokens und Sessions durchführen.'
        : 'Migration zu Managed Auth Provider: Auth0 (kostenlos bis 7.500 User), Supabase Auth, NextAuth.js oder Keycloak (selbst hostbar, kostenlos). Kein Custom Auth für Produktionssysteme.' });
  }

  // Kein Dependency-Scanning
  if (!has(sec, 'dependency-scan') && (scale !== 'small' || targetNum >= 20)) {
    const severity: Risk['severity'] = scale === 'enterprise' ? 'high' : 'medium';
    risks.push({ title: 'Kein Dependency-Scanning: Unbekannte CVEs in Abhängigkeiten',
      severity,
      description: `Ohne automatisiertes Vulnerability-Scanning werden kritische CVEs (wie Log4Shell, Spring4Shell) erst Wochen nach Veröffentlichung entdeckt. Bei ${appNum} Apps und ${targetNum}+ geplanten Apps skaliert das Risiko proportional mit jeder neuen Abhängigkeit.`,
      recommendation: scale === 'enterprise'
        ? 'Snyk Enterprise oder GitHub Advanced Security aktivieren. SLA für kritische CVEs definieren (Patch < 24h). Renovate mit Auto-Merge für Patch-Updates konfigurieren. Security-Champions in jedem Team benennen.'
        : 'GitHub Dependabot aktivieren (kostenlos, direkt in Repo-Settings). Snyk Free für erweiterte CVSS-Scores. Renovate für automatisierte PRs bei Dependency-Updates.' });
  }

  // Kein Secrets Management bei Cloud-Hosting
  if (!has(sec, 'secrets') && usesCloud) {
    risks.push({ title: 'Kein Secrets Management: Credentials-Leck-Risiko',
      severity: 'high',
      description: `Ohne dediziertes Secrets Management landen API-Keys, Datenbank-Passwörter und Zertifikate in .env-Dateien oder als Klartext in CI/CD-Variablen. Git-Histories sind dauerhaft – einmal commitete Secrets bleiben für immer. Auf ${cloudHostings.filter(h => hostingList.includes(h)).map(h => h.toUpperCase()).join('/')} ist das ein aktives Sicherheitsrisiko.`,
      recommendation: scale === 'enterprise'
        ? 'HashiCorp Vault (self-hosted) oder cloud-nativer Service (AWS Secrets Manager, Azure Key Vault). Rotation aller bestehenden Credentials. truffleHog oder git-secrets für Repository-Scan durchführen. Zero-Trust: jeder Service hat eigene Credentials.'
        : 'Sofort: git-secrets installieren + .env in .gitignore prüfen. Mittelfristig: AWS SSM Parameter Store (kostenlos), Azure Key Vault oder Doppler/Infisical als günstige SaaS-Lösung.' });
  }

  // Kein SAST / Code-Analyse
  if (!has(sec, 'sast') && targetNum >= 20) {
    const severity: Risk['severity'] = scale === 'enterprise' ? 'high' : 'medium';
    risks.push({ title: 'Kein SAST / Statische Code-Analyse',
      severity,
      description: `Ohne statische Code-Analyse werden Sicherheitslücken wie SQL-Injection, XSS, unsichere Deserialisierung oder hardcodierte Secrets erst in der Produktion entdeckt. Bei ${targetNum}+ Apps steigt die Angriffsfläche proportional zur Codebasis – ohne SAST ist Security Debt nicht messbar.`,
      recommendation: scale === 'enterprise'
        ? 'SonarQube (self-hosted) oder GitHub Code Scanning (CodeQL) als verpflichtender PR-Check. Security-Findings als Deployment Blocker (High/Critical). Regelmäßige Penetration Tests (halbjährlich). OWASP SAMM als Reifegradmodell.'
        : 'GitHub Code Scanning (CodeQL) ist kostenlos und direkt im Repo aktivierbar. SonarCloud als Alternative (kostenlos für Open Source). Als Required Status Check in Branch Protection einbinden.' });
  }

  // Kein Code Review Prozess
  if ((review === 'none' || !review) && teamNum >= 5) {
    const severity: Risk['severity'] = teamNum >= 15 ? 'high' : 'medium';
    risks.push({ title: 'Kein Code Review Prozess: Kein Vier-Augen-Prinzip',
      severity,
      description: `Bei ${teamNum} Entwicklern ohne verpflichtende Code Reviews gibt es kein Vier-Augen-Prinzip. Bugs, Security-Lücken und Architektur-Abweichungen werden nicht erkannt. Wissensilos entstehen, da Code nur von einer Person verstanden wird. Insbesondere bei Security-kritischem Code ist das ein hohes Risiko.`,
      recommendation: scale === 'enterprise'
        ? 'Branch-Schutzregeln: min. 2 Approvals + 1 Architecture Review für kritische Services. CODEOWNERS-Datei für sensible Verzeichnisse (auth/, infra/, db/). Automatisierte Checks (Linting, Tests, SAST) als Required Status Checks.'
        : teamNum >= 10
        ? 'GitHub/GitLab Branch Protection: min. 1 Approval für alle Merges. Automatisierte CI-Checks als Required. Klare PR-Richtlinien (Beschreibung, Tests, Dokumentation). Review-Rotation einführen.'
        : 'Branch Protection aktivieren: min. 1 Approval. Automatisierte Tests als Required Check. Kurze PR-Checkliste einführen.' });
  }

  // REST/GraphQL ohne OpenAPI-Spezifikation
  if (has(apiStrat, 'rest', 'graphql') && !has(apiStrat, 'openapi') && teamNum >= 10) {
    risks.push({ title: 'APIs ohne Spezifikation: Implicit Contracts',
      severity: 'medium',
      description: `REST/GraphQL-APIs ohne OpenAPI-Spec / SDL bedeuten implizite Verträge zwischen Teams. Kein automatisch generierter Client-Code, keine Typsicherheit zwischen Services, schwieriges Onboarding. Ab ${teamNum} Entwicklern häufen sich Missverständnisse über API-Contracts, was zu Regressions und Integrationsproblemen führt.`,
      recommendation: scale === 'enterprise'
        ? 'API-First Development: OpenAPI 3.1 Spec als Single Source of Truth (verpflichtend). Contract Testing mit Pact. API-Gateway (Kong, AWS API GW) mit automatischer Dokumentation. Versionierte SDK-Generierung (openapi-generator).'
        : 'swagger-jsdoc oder tsoa für automatische Spec-Generierung aus Code. Swagger UI oder Redocly für Dokumentationsportal. Spec als Required Teil jedes Feature-PRs.' });
  }

  // API ohne Versionierung
  if (has(apiStrat, 'rest', 'graphql', 'grpc') && !has(apiStrat, 'versioning') && targetNum >= 20) {
    risks.push({ title: 'APIs ohne Versionierung: Breaking-Change-Falle',
      severity: 'medium',
      description: `Bei ${targetNum}+ geplanten Apps und nicht versionierten APIs erzwingt jede Breaking Change eine simultane Aktualisierung aller Consumer. Das führt zu "API Freeze" – Teams trauen sich nicht mehr, APIs zu verbessern, da die Koordination zu aufwändig ist.`,
      recommendation: scale === 'enterprise'
        ? 'Semantic Versioning für alle APIs (/v1/, /v2/). Deprecation Policy (min. 6 Monate Notice). API-Gateway mit Version-Routing und Auslauf-Tracking. GraphQL: Schema-Evolution (Field Deprecation) statt Hard Versioning.'
        : 'URL-Versionierung (/api/v1/) sofort einführen. Deprecation-Header (Sunset, Deprecation) nutzen. Alte Versionen mind. 3 Monate parallel betreiben. Changelog für API-Änderungen führen.' });
  }

  // Keine API-Strategie definiert bei mehreren Apps
  if ((!hasAny(apiStrat) || has(apiStrat, 'none')) && appNum >= 3) {
    risks.push({ title: 'Keine API-Strategie: Wilde Integration',
      severity: 'low',
      description: `Bei ${appNum} Apps ohne definierte API-Strategie entstehen unterschiedliche Integrationsmuster in jeder App. REST hier, proprietäres RPC dort – das erschwert spätere Konsolidierung und Cross-App-Features massiv.`,
      recommendation: scale === 'enterprise'
        ? 'API-Strategie als ADR dokumentieren. API-Gateway für einheitlichen Einstiegspunkt. Event-Driven Architecture (Kafka/RabbitMQ) für asynchrone Kommunikation evaluieren.'
        : 'API-Strategie festlegen: REST für CRUD-APIs, GraphQL für flexible Frontend-Anforderungen. Einheitliche Response-Formate und Fehlerstruktur als Shared Package definieren.' });
  }

  // ── SOLL (scaled) ──
  soll.push({ area: 'Tech Stack', target: scale === 'enterprise'
    ? 'Technology Radar mit klaren Adopt/Hold Kategorien. Golden Path für neue Apps.'
    : 'Einheitlicher Standard-Stack für alle neuen Apps' });

  if (!has(sharing, 'sharedlib', 'monorepo')) {
    soll.push({ area: 'Code-Sharing', target: scale === 'enterprise'
      ? 'Internal Developer Platform mit versionierten Packages, Private Registry, automatisierten Updates'
      : 'Shared Monorepo mit versionierten Packages (@company/*)' });
  }
  if ((d.designSystem || '') === 'none') {
    soll.push({ area: 'Design System', target: scale === 'enterprise'
      ? 'Dediziertes Design System Team, Komponentenbibliothek mit Storybook + Figma-Sync'
      : 'Einheitliches Design System mit UI-Komponentenbibliothek' });
  }
  if (!has(ci, 'standardized')) {
    soll.push({ area: 'CI/CD', target: scale === 'enterprise'
      ? 'Platform Engineering: Golden Paths, Self-Service Deployments, Feature Flags, GitOps'
      : 'Standardisierte Reusable Workflows' });
  }
  if (!has(testing, 'comprehensive')) {
    soll.push({ area: 'Testing', target: scale === 'enterprise'
      ? 'Test-Strategie mit Pyramide (Unit/Integration/E2E), Coverage-Gates, Contract Testing'
      : 'Einheitliches Testing-Framework mit Coverage-Gate' });
  }
  if (!has(mon, 'sentry', 'dashboard')) {
    soll.push({ area: 'Monitoring', target: scale === 'enterprise'
      ? 'Full Observability: APM, Distributed Tracing, Centralized Logging, SLOs/SLIs, Incident Response'
      : 'Zentrales Dashboard + Error Tracking + Uptime-Monitoring' });
  }
  if (!has(doc, 'living', 'adr')) {
    soll.push({ area: 'Dokumentation', target: scale === 'enterprise'
      ? 'Internal Developer Portal (Backstage), ADRs, API-Docs, Runbooks, Architecture Guidelines'
      : 'Living Documentation: ADRs, Storybook, Runbooks' });
  }
  soll.push({ area: 'Neue App erstellen', target: scale === 'enterprise'
    ? 'Self-Service Portal: Neue App in unter 15 Minuten mit allen Standards, Monitoring und Pipelines'
    : 'CLI-Tool: Neue App in unter 30 Minuten produktionsbereit' });
  soll.push({ area: 'Onboarding', target: scale === 'enterprise'
    ? 'Strukturiertes Onboarding-Programm mit Developer Portal, Dev Containers, Buddy-System (Ziel: 1 Woche)'
    : 'Neue Entwickler produktiv in 1–2 Tagen' });
  if (d.legacyApps === 'yes') {
    soll.push({ area: 'Legacy', target: scale === 'enterprise'
      ? 'Legacy-Modernisierungsstrategie mit Strangler Fig Pattern, priorisiert nach Business Value und Risiko'
      : 'Legacy-Systeme migriert, gekapselt oder abgelöst' });
  }
  if (scale === 'enterprise') {
    soll.push({ area: 'Governance', target: 'Architecture Review Board, Technology Radar, ADR-Pflicht, Compliance-Dashboard' });
    soll.push({ area: 'Platform Team', target: 'Dediziertes Team für Developer Experience, Tooling und Infrastruktur' });
  }
  if (scale === 'large') {
    soll.push({ area: 'Governance', target: 'Architecture Reviews (regelmäßig), ADR-Pflicht für größere Entscheidungen' });
  }
  if (branching === 'none' || branching === 'basic') {
    soll.push({ area: 'Branching', target: scale === 'enterprise'
      ? 'Trunk-Based Development mit Feature Flags, Branch-Schutz, verpflichtende PR-Reviews'
      : 'Git Flow oder Trunk-Based Development, Branch-Schutzregeln auf main' });
  }

  // Security & Auth SOLL-Items
  if (auth === 'selfbuilt' || auth === 'jwt') {
    soll.push({ area: 'Authentifizierung', target: scale === 'enterprise'
      ? 'Enterprise Identity Provider (Keycloak, Azure AD B2C oder Okta). Zero-Trust Architektur. IAM-Audit aller Sessions.'
      : 'Managed Auth: Auth0, Supabase Auth oder NextAuth.js. Kein Custom-Auth in Production.' });
  }
  if (!has(sec, 'dependency-scan') || !has(sec, 'sast')) {
    soll.push({ area: 'Security Automation', target: scale === 'enterprise'
      ? 'GitHub Advanced Security / Snyk Enterprise. SLA für CVE-Patches. Dependency-Updates automatisiert (Renovate). Security-Champion in jedem Team.'
      : 'GitHub Dependabot + Code Scanning (CodeQL) in CI/CD aktivieren. Automatische Security-PRs für Patch-Updates.' });
  }
  if (!has(sec, 'secrets') && usesCloud) {
    soll.push({ area: 'Secrets Management', target: scale === 'enterprise'
      ? 'HashiCorp Vault + automatische Secret Rotation. Keine Credentials in Repositories oder CI/CD-Variablen.'
      : 'Cloud Secrets Manager (AWS SSM / Azure Key Vault) oder Doppler. git-secrets im Repository aktivieren.' });
  }
  if ((review === 'none' || !review) && teamNum >= 5) {
    soll.push({ area: 'Code Review', target: scale === 'enterprise'
      ? 'Branch Protection: min. 2 Approvals. CODEOWNERS für sensible Bereiche. Architecture Reviews für alle größeren Änderungen.'
      : 'Branch Protection: min. 1 Approval verpflichtend. Automatisierte Tests als Required Status Check.' });
  }

  // API SOLL-Items
  if (has(apiStrat, 'rest', 'graphql') && !has(apiStrat, 'openapi')) {
    soll.push({ area: 'API-Dokumentation', target: scale === 'enterprise'
      ? 'API-First: OpenAPI 3.1 Spec als Pflicht. API-Gateway mit automatischer Dokumentation. Versionierte Client-SDKs generieren.'
      : 'OpenAPI/Swagger Spec für alle REST-APIs. swagger-jsdoc für automatische Generierung. Redocly für Dokumentationsportal.' });
  }
  if (has(apiStrat, 'rest', 'graphql', 'grpc') && !has(apiStrat, 'versioning') && targetNum >= 20) {
    soll.push({ area: 'API-Versionierung', target: scale === 'enterprise'
      ? 'Semantische API-Versionierung (/v1/, /v2/). Deprecation Policy (6 Monate). API-Gateway mit Version-Routing.'
      : 'URL-Versionierung (/api/v1/) einführen. Deprecation-Header. Changelog für Breaking Changes.' });
  }

  // CI/CD + Hosting spezifische Soll-Empfehlungen (Idee 4)
  if (hostingList.includes('vercel') && !has(ci, 'standardized')) {
    soll.push({ area: 'Deployment (Vercel)', target: 'Vercel Git Integration: automatische Preview Deployments für PRs, Production Deploy auf main. Vercel CLI in CI/CD Pipeline.' });
  }
  if (hostingList.includes('aws') && !has(ci, 'standardized')) {
    soll.push({ area: 'Deployment (AWS)', target: 'GitHub Actions + AWS ECR (Container Registry) + ECS/EKS für automatisierte Deployments. IAM Roles für CI/CD konfigurieren.' });
  }
  if (hostingList.includes('azure') && !has(ci, 'standardized')) {
    soll.push({ area: 'Deployment (Azure)', target: 'GitHub Actions + Azure Container Registry + Azure Container Apps oder App Service für automatisierte Deployments.' });
  }
  if (hostingList.includes('gcp') && !has(ci, 'standardized')) {
    soll.push({ area: 'Deployment (GCP)', target: 'GitHub Actions + Google Artifact Registry + Cloud Run für serverlose Container-Deployments.' });
  }
  if ((hostingList.includes('hetzner') || hostingList.includes('selfhosted') || hostingList.includes('docker')) && !has(ci, 'standardized')) {
    soll.push({ area: 'Deployment (Self-Hosted)', target: 'GitHub Actions → Docker Build → Push zu Registry → SSH-Deploy. Watchtower für automatisierte Container-Updates.' });
  }

  // ── WAVES (scaled, stack-spezifisch) ── (Idee 1)
  const waves: Wave[] = [];

  // Stack-spezifische Tool-Auswahl
  const isAngular = primaryStackList.includes('angular');
  const isNextReact = primaryStackList.includes('nextjs');
  const isVue = primaryStackList.includes('vue');
  const isLaravelStack = primaryStackList.includes('laravel');
  const isDotNet = primaryStackList.includes('dotnet');
  const isJava = primaryStackList.includes('java');
  const monorepoTool = isAngular ? 'Nx' : (isNextReact || isVue) ? 'Turborepo' : isDotNet ? '.NET Solution (Multi-Projekt)' : isJava ? 'Maven Multi-Module / Gradle Composite' : isLaravelStack ? 'Composer Packages + Monorepo' : 'Turborepo/Nx';
  const registryTool = isLaravelStack ? 'Private Packagist Registry' : isDotNet ? 'Azure Artifacts / NuGet' : isJava ? 'Nexus / Artifactory (Maven)' : 'GitHub Packages (npm)';
  const testingTool = isNextReact || isVue || isAngular ? 'Vitest + Playwright (E2E)' : isLaravelStack ? 'PHPUnit + Pest' : isDotNet ? 'xUnit / NUnit' : isJava ? 'JUnit 5 + Testcontainers' : 'Jest + Testing Library';

  if (scale === 'enterprise') {
    waves.push({ number: 1, title: 'Foundation & Platform Setup', duration: '2–4 Wochen',
      items: ['Platform Team definieren und Verantwortlichkeiten klären', 'Technology Radar erstellen (Adopt/Trial/Assess/Hold)', `Shared Monorepo mit ${monorepoTool} aufsetzen`, `${registryTool} + automatisierte Dependency-Updates (Renovate)`, 'Reusable CI/CD Pipelines mit Quality Gates', 'Architecture Decision Records einführen (verpflichtend)'] });
    waves.push({ number: 2, title: 'Design System & Developer Experience', duration: '3–6 Wochen',
      items: ['Design System Team aufbauen', 'Komponentenbibliothek mit Storybook', 'Design Tokens + Figma-Sync', 'Shared Utilities & Types Packages', 'Internal Developer Portal (Backstage) evaluieren', 'Pilot-Migration von 2–3 Apps'] });
    const w3ItemsEnterprise = [`Test-Strategie: ${testingTool} (Unit/Integration/E2E-Pyramide)`, 'Shared Testing Library + Contract Testing', 'Observability Stack: APM + Distributed Tracing + Centralized Logging', 'SLOs/SLIs für kritische Services definieren', 'Alerting mit Eskalationsstufen', 'Incident Response Prozess etablieren'];
    if (auth === 'selfbuilt' || auth === 'jwt' || !has(sec, 'dependency-scan') || !has(sec, 'sast')) w3ItemsEnterprise.push('Security: Dependency Scanning + SAST einrichten, Auth-Provider migrieren');
    if (!has(sec, 'secrets') && usesCloud) w3ItemsEnterprise.push('Secrets Management: HashiCorp Vault oder Cloud Secrets Manager einführen');
    waves.push({ number: 3, title: 'Testing, Monitoring, Security & Observability', duration: '4–6 Wochen', items: w3ItemsEnterprise });
    waves.push({ number: 4, title: 'Self-Service & Migration', duration: '4–8 Wochen',
      items: ['Self-Service Portal für neue Apps (Golden Path)', `Migration der ${appNum} bestehenden Apps (priorisiert nach Risiko)`, 'Standardisierte Dev Environments (Dev Containers/Gitpod)', 'Onboarding-Programm mit Buddy-System', 'Compliance-Dashboard für Architektur-Konformität'] });
    const w5 = ['FinOps: Cloud-Kosten optimieren', 'Architecture Review Board etablieren', 'Inner Source Programm', 'Schulungsprogramm (regelmäßig)'];
    if (d.legacyApps === 'yes') w5.unshift('Legacy-Modernisierung (Strangler Fig Pattern)');
    waves.push({ number: 5, title: 'Governance, Legacy & Optimierung', duration: 'Fortlaufend', items: w5 });

  } else if (scale === 'large') {
    waves.push({ number: 1, title: 'Foundation & Config', duration: '1–2 Wochen',
      items: [`${monorepoTool} Monorepo aufsetzen`, 'Config-Packages (ESLint, Prettier, TypeScript, Styling)', `${registryTool} + automatisierte Updates`, 'Reusable CI/CD Workflows mit Quality Gates', 'Architektur-Dokumentation + ADR-Template'] });
    waves.push({ number: 2, title: 'Design System & Shared UI', duration: '2–3 Wochen',
      items: ['UI-Komponentenbibliothek (15+ Komponenten)', 'Shared Core Utilities & Types', 'Storybook als Dokumentation', 'Design Tokens definieren', 'Pilot-Migration einer bestehenden App'] });
    const w3ItemsLarge = [`${testingTool} + Coverage-Gate (min. 70%)`, 'Shared Testing Utilities', 'Error Handling Standard + Sentry', 'Uptime-Monitoring + Alerting', 'Testing Guide + Best Practices Dokumentation'];
    if (auth === 'selfbuilt' || auth === 'jwt' || !has(sec, 'dependency-scan')) w3ItemsLarge.push('Security: Dependabot + CodeQL aktivieren, Auth-Provider evaluieren');
    waves.push({ number: 3, title: 'Backend, Testing, Security & Monitoring', duration: '2–3 Wochen', items: w3ItemsLarge });
    waves.push({ number: 4, title: 'CLI, Migration & Onboarding', duration: '2–4 Wochen',
      items: ['CLI-Tool / Scaffolding für neue Apps', `Alle ${appNum} bestehenden Apps migrieren`, 'App-Versionierung (Git Tags)', 'Onboarding Runbook + Architektur-Workshop', 'Architecture Reviews einführen (alle 2 Wochen)'] });
    const w5 = ['Zentrales App-Dashboard', 'Erweitertes Monitoring (Grafana)', 'Feature Flags evaluieren', 'Schulungen (halbjährlich)'];
    if (d.legacyApps === 'yes') w5.unshift('Legacy-Systeme ablösen oder kapseln');
    waves.push({ number: 5, title: 'Legacy, Dashboard & Optimierung', duration: 'Flexibel (später)', items: w5 });

  } else if (scale === 'medium') {
    waves.push({ number: 1, title: 'Foundation & Config', duration: '3–5 Tage',
      items: [`${monorepoTool} Monorepo aufsetzen`, 'Config-Packages erstellen', 'Reusable CI/CD Workflows', 'Architektur-Dokumentation anlegen'] });
    waves.push({ number: 2, title: 'Design System & UI', duration: '4–6 Tage',
      items: ['UI-Komponentenbibliothek', 'Shared Utilities & Types', 'Storybook deployen', 'Pilot-Migration einer App'] });
    const w3ItemsMedium = [`${testingTool} einrichten`, 'Testing Guide schreiben', 'Error Handling Standard', 'Coverage-Gate in CI'];
    if (auth === 'selfbuilt' || auth === 'jwt') w3ItemsMedium.push('Auth-Provider migrieren (Auth0 / Supabase Auth)');
    if (!has(sec, 'dependency-scan')) w3ItemsMedium.push('Dependabot + CodeQL aktivieren');
    waves.push({ number: 3, title: 'Backend, Testing & Security', duration: '4–6 Tage', items: w3ItemsMedium });
    waves.push({ number: 4, title: 'CLI & Migration', duration: '3–5 Tage',
      items: ['CLI-Tool / Scaffolding', `${appNum} bestehende Apps migrieren`, 'Versionierung einführen', 'Onboarding Runbook'] });
    const w5 = ['Dashboard', 'Monitoring & Alerting', 'Schulungen'];
    if (d.legacyApps === 'yes') w5.unshift('Legacy ablösen');
    waves.push({ number: 5, title: 'Legacy, Dashboard & Monitoring', duration: 'Flexibel', items: w5 });

  } else {
    waves.push({ number: 1, title: 'Foundation & Config', duration: '2–3 Tage',
      items: [`${monorepoTool} aufsetzen`, 'Config-Packages', 'Reusable CI/CD', 'README & Doku anlegen'] });
    waves.push({ number: 2, title: 'Design System & UI', duration: '3–4 Tage',
      items: ['UI-Bibliothek', 'Shared Utilities', 'Storybook', 'Pilot-Migration'] });
    const w3ItemsSmall = [`${testingTool} einrichten`, 'Error Handling', 'Coverage-Gate', 'Testing Guide'];
    if (auth === 'selfbuilt' || auth === 'jwt') w3ItemsSmall.push('Auth-Provider evaluieren (Auth0 / Supabase Auth)');
    if (!has(sec, 'dependency-scan')) w3ItemsSmall.push('Dependabot aktivieren');
    waves.push({ number: 3, title: 'Backend, Testing & Security', duration: '3–4 Tage', items: w3ItemsSmall });
    waves.push({ number: 4, title: 'CLI & Migration', duration: '2–4 Tage',
      items: ['CLI-Tool', 'Apps migrieren', 'Versionierung', 'Runbook'] });
    const w5 = ['Dashboard', 'Monitoring', 'Schulungen'];
    if (d.legacyApps === 'yes') w5.unshift('Legacy ablösen');
    waves.push({ number: 5, title: 'Legacy & Monitoring', duration: 'Flexibel', items: w5 });
  }

  // ── ARCHITECTURE SCORE (Idee 5) ──
  let score = 0;
  if (has(testing, 'comprehensive')) score += 15;
  else if (has(testing, 'unit', 'integration', 'e2e')) score += 10;
  else if (has(testing, 'minimal')) score += 3;
  if (has(ci, 'standardized')) score += 15;
  else if (has(ci, 'github-actions', 'gitlab-ci', 'jenkins')) score += 8;
  else if (hasAny(ci) && !has(ci, 'none', 'inconsistent')) score += 5;
  if (has(mon, 'sentry', 'dashboard') && has(mon, 'uptime', 'logging')) score += 10;
  else if (has(mon, 'sentry', 'dashboard')) score += 7;
  else if (has(mon, 'uptime', 'analytics', 'logging')) score += 4;
  if (has(doc, 'adr') && has(doc, 'wiki', 'storybook')) score += 10;
  else if (has(doc, 'adr', 'wiki', 'storybook')) score += 7;
  else if (has(doc, 'readme')) score += 3;
  if (has(sharing, 'monorepo')) score += 15;
  else if (has(sharing, 'sharedlib')) score += 10;
  else if (has(sharing, 'git-sub')) score += 3;
  if (d.designSystem === 'full') score += 10;
  else if (d.designSystem === 'partial') score += 5;
  if (branching === 'trunk') score += 10;
  else if (branching === 'gitflow') score += 8;
  else if (branching === 'basic') score += 3;
  if (d.legacyApps !== 'yes') score += 10;
  if (has(onb, 'days', 'week')) score += 5;
  else if (has(onb, 'weeks')) score += 2;
  const scoreLabel = score >= 86 ? 'Sehr gut' : score >= 71 ? 'Gut' : score >= 51 ? 'Mittel' : score >= 31 ? 'Niedrig' : 'Kritisch';

  // ── SUMMARY ──
  const highCount = risks.filter(r => r.severity === 'high').length;
  const totalWeeks = scale === 'enterprise' ? '15–28 Wochen' : scale === 'large' ? '8–14 Wochen' : scale === 'medium' ? '3–5 Wochen' : '2–3 Wochen';
  const stackNames = (d.primaryStack || '').split(',').filter(Boolean).map(s => ({
    nextjs:'Next.js', vue:'Vue/Nuxt', angular:'Angular', laravel:'Laravel', rails:'Rails',
    dotnet:'.NET', python:'Python', java:'Java/Spring', go:'Go'
  }[s] || s)).join(', ');
  const stackInfo = stackNames ? ` · Stack: ${stackNames}` : '';
  const branchingInfo = branching && branching !== 'none' ? ` · Branching: ${branching}` : '';
  const summary = `${scaleLabel(scale)} (${teamNum} Entwickler, ${appNum} Apps${stackInfo}${branchingInfo}). ` +
    `Ziel: ${targetNum}+ Apps. ${risks.length} Risiken identifiziert (${highCount} hoch). ` +
    `Geschätzter Umsetzungszeitraum Wellen 1–4: ${totalWeeks}.`;

  return { risks, soll, waves, summary, source: 'fallback', score, scoreLabel };
}
