import { WizardData, Risk, SollItem, Wave, AnalysisResult } from '@/types';

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
    waves.push({ number: 3, title: 'Testing, Monitoring & Observability', duration: '4–6 Wochen',
      items: [`Test-Strategie: ${testingTool} (Unit/Integration/E2E-Pyramide)`, 'Shared Testing Library + Contract Testing', 'Observability Stack: APM + Distributed Tracing + Centralized Logging', 'SLOs/SLIs für kritische Services definieren', 'Alerting mit Eskalationsstufen', 'Incident Response Prozess etablieren'] });
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
    waves.push({ number: 3, title: 'Backend, Testing & Monitoring', duration: '2–3 Wochen',
      items: [`${testingTool} + Coverage-Gate (min. 70%)`, 'Shared Testing Utilities', 'Error Handling Standard + Sentry', 'Uptime-Monitoring + Alerting', 'Testing Guide + Best Practices Dokumentation'] });
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
    waves.push({ number: 3, title: 'Backend & Testing', duration: '4–6 Tage',
      items: [`${testingTool} einrichten`, 'Testing Guide schreiben', 'Error Handling Standard', 'Coverage-Gate in CI'] });
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
    waves.push({ number: 3, title: 'Backend & Testing', duration: '3–4 Tage',
      items: [`${testingTool} einrichten`, 'Error Handling', 'Coverage-Gate', 'Testing Guide'] });
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
