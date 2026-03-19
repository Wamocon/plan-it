-- ============================================================
-- plan-it – Lokale Seed-Daten (15 realistische Demoprojekte)
-- Wird beim ersten Docker-Start automatisch ausgeführt.
-- Zum Zurücksetzen: docker compose down -v && docker compose up -d
-- ============================================================

-- Feste Projekt-UUIDs für spätere Task-Referenzen
-- Alle Projekte gehören dem lokalen Dev-Admin (00000000-0000-0000-0000-000000000001)

-- ══════════════════════════════════════════════════════════════
-- PROJEKTE
-- ══════════════════════════════════════════════════════════════

INSERT INTO projects (id, user_id, wizard_data, analysis, created_at) VALUES

-- ── 1. TaskFlow – Startup (Score: 28 / Kritisch) ─────────────
('a1000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "TaskFlow",
   "clientName": "TaskFlow GmbH (intern)",
   "teamSize": "1-5",
   "appCount": "1-5",
   "targetApps": "20",
   "primaryStack": "nextjs",
   "database": "postgres",
   "hosting": "vercel",
   "legacyApps": "no",
   "codeSharing": "copypaste",
   "designSystem": "none",
   "cicd": "none",
   "testing": "none",
   "monitoring": "none",
   "documentation": "readme",
   "branching": "basic",
   "onboardingTime": "weeks"
 }',
 '{
   "score": 28,
   "scoreLabel": "Kritisch",
   "source": "fallback",
   "summary": "Das Startup-Projekt zeigt typische Wachstumsschmerzen: keine Testabdeckung, kein CI/CD und reines Copy-Paste als Code-Sharing-Strategie machen skaliertes Wachstum riskant.",
   "risks": [
     {"title": "Kein CI/CD-Pipeline", "severity": "high", "description": "Deployments geschehen manuell und ungetestet. Jeder Release ist ein potenzielles Produktionsproblem.", "recommendation": "GitHub Actions mit Lint, Test und automatischem Vercel-Deployment einrichten. Ziel: kein manuelles Deployment mehr."},
     {"title": "Fehlende Teststrategie", "severity": "high", "description": "Ohne Tests können Regressionsfehler unbemerkt in Production gelangen. Bei wachsendem Team steigt die Fehlerrate exponentiell.", "recommendation": "Vitest für Unit-Tests und Playwright für E2E einführen. Minimum 60 % Coverage als Gate definieren."},
     {"title": "Copy-Paste statt Shared Components", "severity": "high", "description": "Geteilter Code wird in jede neue App kopiert. Ein Bug muss dann an 20 Stellen gefixt werden.", "recommendation": "Shared Component Library als privates npm-Paket (GitHub Packages) auslagern. Turborepo für Monorepo-Setup nutzen."},
     {"title": "Kein Monitoring / Alerting", "severity": "medium", "description": "Fehler in Production werden erst durch Nutzerbeschwerden bekannt. MTTR (Mean Time to Repair) ist unnötig hoch.", "recommendation": "Sentry für Error-Tracking und UptimeRobot für Availability integrieren. Sofort umsetzbar, kostenlos im Starter-Tier."}
   ],
   "soll": [
     {"area": "CI/CD", "target": "Automatisiertes Deployment mit GitHub Actions – kein manueller Release"},
     {"area": "Testing", "target": "Mindestens 60 % Unit-Test-Coverage, E2E-Tests für kritische User-Flows"},
     {"area": "Code-Sharing", "target": "Shared UI Library in Monorepo – zero Copy-Paste bei neuen Apps"},
     {"area": "Monitoring", "target": "Sentry + Uptime-Monitoring aktiv vor dem nächsten Major Release"}
   ],
   "waves": [
     {"number": 1, "title": "Quick Wins", "duration": "2 Wochen", "items": ["GitHub Actions Pipeline aufsetzen", "Sentry Error-Tracking integrieren", "Vitest installieren und erste Tests schreiben"]},
     {"number": 2, "title": "Fundament", "duration": "4 Wochen", "items": ["Turborepo Monorepo aufsetzen", "Shared UI Library extrahieren", "Test-Coverage auf 40 % bringen"]},
     {"number": 3, "title": "Skalierung", "duration": "6 Wochen", "items": ["Playwright E2E Tests einführen", "Storybook für UI-Komponenten", "Coverage auf 60 % steigern", "Automatisierte Deployment-Gates"]}
   ]
 }',
 '2024-11-03T08:15:00Z'),

-- ── 2. Megabank Core – Enterprise-Bank (Score: 14 / Kritisch) ─
('a1000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "Megabank Core",
   "clientName": "Megabank AG",
   "teamSize": "30+",
   "appCount": "20+",
   "targetApps": "100",
   "primaryStack": "java,angular,dotnet",
   "database": "mysql,redis",
   "hosting": "selfhosted,azure",
   "legacyApps": "yes",
   "legacyDetail": "COBOL-Mainframe (1987), Oracle Forms (2003), IBM MQ, EJB 2.x",
   "codeSharing": "copypaste,git-sub",
   "designSystem": "partial",
   "cicd": "jenkins,inconsistent",
   "testing": "unit,minimal",
   "monitoring": "uptime,logging",
   "documentation": "outdated,wiki",
   "branching": "gitflow",
   "onboardingTime": "month"
 }',
 '{
   "score": 14,
   "scoreLabel": "Kritisch",
   "source": "fallback",
   "summary": "Hochkomplexe Enterprise-Landschaft mit 35+ Jahre alten Kernsystemen. Technische Schulden auf Konzernebene. Regulatorische Risiken (BaFin, DSGVO) durch fehlende Modernisierung. Sofortmaßnahmen erforderlich.",
   "risks": [
     {"title": "COBOL-Mainframe ohne Support (EOL seit 2019)", "severity": "high", "description": "Der Kernbankprozess läuft auf einem COBOL-Mainframe aus 1987, für den keine Sicherheitspatches mehr verfügbar sind. Ein einzelner Exploit könnte Milliarden-Transaktionen lahmlegen.", "recommendation": "Sofortige Netz-Isolation des Mainframes. Strangler-Fig-Pattern für schrittweise API-Kapselung. Dediziertes Migrations-Team (8+ Engineers) aufstellen. Zeitplan: 24 Monate für kritische Kernfunktionen."},
     {"title": "Inkonsistentes CI/CD über 20+ Repositories", "severity": "high", "description": "Jedes Team hat ein eigenes Jenkins-Setup mit unterschiedlichen Stages, Qualitätsgates und Deploy-Mechanismen. Fehler werden in Production entdeckt statt in der Pipeline.", "recommendation": "Zentrales CI/CD-Template (Jenkins Shared Library oder Migration zu GitHub Enterprise). Einheitliche Quality Gates als Pflicht für alle Repositories."},
     {"title": "DSGVO-Risiko durch fehlende Datenisolation", "severity": "high", "description": "Personenbezogene Daten in Oracle Forms-Altanwendungen sind nicht DSGVO-konform gespeichert. BaFin-Prüfung 2025 anstehend.", "recommendation": "Data-Mapping aller Legacy-Systeme. Sofortige Pseudonymisierung wo möglich. Legal/IT-Task-Force für DSGVO-Compliance einrichten."},
     {"title": "Kein einheitliches Design System", "severity": "medium", "description": "100+ geplante Apps ohne gemeinsame UI-Basis bedeutet extreme Inkonsistenz und Wartungsaufwand.", "recommendation": "Corporate Design System auf Basis Angular Material aufbauen. Dediziertes Platform-Team für interne Libraries."},
     {"title": "IBM MQ als Single Point of Failure", "severity": "medium", "description": "Kritische Echtzeit-Transaktionen laufen ausschließlich über IBM MQ. Kein Failover für den Nachrichtenbroker konfiguriert.", "recommendation": "Apache Kafka als modernes Event-Streaming einführen. Schrittweise Migration von IBM MQ über Dual-Write-Pattern."}
   ],
   "soll": [
     {"area": "Legacy-Migration", "target": "COBOL-Mainframe in API-Kapsel (Strangler Fig) – Kernfunktionen bis Q4 2025 abstrahiert"},
     {"area": "CI/CD", "target": "Einheitliches Jenkins Shared Library Template für alle Teams obligatorisch"},
     {"area": "Compliance", "target": "DSGVO-Konformität aller Legacy-Systeme – BaFin-Prüfung besteht"},
     {"area": "Design System", "target": "Corporate Component Library v1.0 für alle neuen Apps verpflichtend"}
   ],
   "waves": [
     {"number": 1, "title": "Notfallmaßnahmen", "duration": "4 Wochen", "items": ["COBOL-Mainframe netz-isolieren (WAF vorschalten)", "DSGVO-Datenmapping starten", "IBM MQ Monitoring & Alerting schärfen", "Security-Audit beauftragen"]},
     {"number": 2, "title": "Stabilisierung", "duration": "3 Monate", "items": ["Jenkins Shared Library Template rollieren", "Oracle Forms REST-API-Kapselung starten", "Kafka-Pilot für 2 kritische Message-Flows", "Platform Team gründen"]},
     {"number": 3, "title": "Modernisierung", "duration": "6 Monate", "items": ["COBOL Strangler Fig erste APIs live", "Angular Corporate Design System v0.1", "DSGVO-Compliance-Nachweis für BaFin", "Roadmap 2026–2028 verabschieden"]},
     {"number": 4, "title": "Transformation", "duration": "12 Monate", "items": ["50 % der Legacy-Transaktionen auf neue APIs umgeleitet", "IBM MQ vollständig durch Kafka ersetzt", "Alle neuen Apps nutzen Design System", "Mainframe-Abschaltungsplan konkret"]}
   ]
 }',
 '2024-08-22T14:30:00Z'),

-- ── 3. ShopNext – E-Commerce Mittelstand (Score: 55 / Mittel) ─
('a1000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "ShopNext Platform",
   "clientName": "ShopNext GmbH",
   "teamSize": "5-15",
   "appCount": "5-10",
   "targetApps": "20",
   "primaryStack": "nextjs,laravel",
   "database": "mysql,redis",
   "hosting": "aws,docker",
   "legacyApps": "no",
   "codeSharing": "sharedlib",
   "designSystem": "partial",
   "cicd": "github-actions",
   "testing": "unit,integration",
   "monitoring": "sentry,uptime",
   "documentation": "readme,outdated",
   "branching": "gitflow",
   "onboardingTime": "weeks"
 }',
 '{
   "score": 55,
   "scoreLabel": "Ausbaufähig",
   "source": "fallback",
   "summary": "Solide E-Commerce-Plattform mit guter Basis – CI/CD und Monitoring sind vorhanden. Aber: kein E2E-Testing, veraltete Dokumentation und ein nicht vollständig fertiggestelltes Design System bremsen die Skalierung.",
   "risks": [
     {"title": "Fehlende E2E-Tests für Checkout-Flow", "severity": "high", "description": "Der kritischste User-Flow (Warenkorb → Bezahlung → Bestätigung) hat keine automatisierten End-to-End-Tests. Regressionen werden erst durch Kunden gemeldet.", "recommendation": "Playwright E2E-Suite für alle kritischen Kaufflüsse einrichten. Nightly-Run in CI. Checkout-Flow als P0 priorisieren."},
     {"title": "MySQL ohne Read-Replicas unter Last", "severity": "medium", "description": "Bei Spitzenlast (Black Friday, Sales) bricht die Datenbankperformance ein. Keine Horizontalskalierung möglich.", "recommendation": "MySQL Read-Replicas für alle SELECT-Queries konfigurieren. ElastiCache Redis für Session und Produktkatalog ausweiten."},
     {"title": "Veraltete API-Dokumentation", "severity": "medium", "description": "Die Swagger-Docs für die Laravel-API entsprechen nicht mehr dem aktuellen Stand. Neue Entwickler verlieren Stunden bei der Integration.", "recommendation": "OpenAPI-Spec automatisch aus Code generieren (L5-Swagger). Docs müssen Teil jedes PR-Reviews sein."},
     {"title": "Kein zentrales Logging-Dashboard", "severity": "low", "description": "Logs sind in verschiedenen AWS CloudWatch-Gruppen verteilt. Fehleranalyse kostet im Schnitt 45 Minuten.", "recommendation": "AWS CloudWatch Logs Insights oder ELK-Stack für korrelierte Suche einrichten."}
   ],
   "soll": [
     {"area": "Testing", "target": "Playwright E2E für Checkout, Login, Produktsuche – läuft im CI-Nightly"},
     {"area": "Datenbank", "target": "MySQL Read-Replicas für 80 % aller Leseanfragen – Black Friday-ready"},
     {"area": "Dokumentation", "target": "OpenAPI automatisch generiert, immer aktuell, Teil des PR-Prozesses"},
     {"area": "Logging", "target": "Zentrale Log-Aggregation – Fehlerdiagnose unter 5 Minuten"}
   ],
   "waves": [
     {"number": 1, "title": "Quick Wins", "duration": "3 Wochen", "items": ["Playwright installieren, erste Checkout-Tests schreiben", "CloudWatch Log Insights strukturieren", "Swagger-Docs auf aktuellen Stand bringen"]},
     {"number": 2, "title": "Stabilisierung", "duration": "6 Wochen", "items": ["MySQL Read-Replicas konfigurieren", "E2E-Suite auf 20+ Szenarien erweitern", "Design System Lücken schließen", "Onboarding-Docs aktualisieren"]}
   ]
 }',
 '2025-01-10T10:00:00Z'),

-- ── 4. CloudSuite Pro – Best-Practice SaaS (Score: 91 / Top) ──
('a1000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "CloudSuite Pro",
   "clientName": "CloudSuite Technologies AG",
   "teamSize": "15-30",
   "appCount": "10-20",
   "targetApps": "50",
   "primaryStack": "nextjs,go",
   "database": "postgres,redis",
   "hosting": "aws,vercel",
   "legacyApps": "no",
   "codeSharing": "monorepo",
   "designSystem": "full",
   "cicd": "github-actions,standardized",
   "testing": "unit,integration,e2e,comprehensive",
   "monitoring": "sentry,logging,dashboard,uptime",
   "documentation": "adr,storybook,wiki,readme",
   "branching": "trunk",
   "onboardingTime": "days"
 }',
 '{
   "score": 91,
   "scoreLabel": "Hervorragend",
   "source": "fallback",
   "summary": "Musterprojekt mit durchgängig professionellen Prozessen. Trunk-Based Development, vollständige Testpipeline, ADR-Dokumentation und ein ausgereiftes Design System bilden ein starkes Fundament für schnelles und sicheres Wachstum.",
   "risks": [
     {"title": "Skalierungsplanung für 50+ Apps", "severity": "low", "description": "Das Monorepo-Setup funktioniert sehr gut bis ~20 Apps. Bei 50+ Apps könnte die CI-Zeit ohne Caching-Strategie auf über 30 Minuten steigen.", "recommendation": "Turbo-Remote-Cache oder GitHub Actions Cache für Monorepo-Builds aktivieren. Nx Cloud als Alternative evaluieren."},
     {"title": "Go-Microservices Observability", "severity": "low", "description": "Die Go-Backend-Services haben noch kein vollständiges Distributed Tracing. Bei Multi-Service-Requests ist Debugging schwierig.", "recommendation": "OpenTelemetry in alle Go-Services integrieren. Jaeger oder AWS X-Ray für Tracing-Dashboard."}
   ],
   "soll": [
     {"area": "Performance", "target": "CI-Pipeline unter 8 Minuten auch bei 50+ Apps durch Remote-Cache"},
     {"area": "Observability", "target": "Distributed Tracing (OpenTelemetry) in allen Go-Services aktiv"}
   ],
   "waves": [
     {"number": 1, "title": "Optimierung", "duration": "4 Wochen", "items": ["Turbo Remote Cache konfigurieren", "OpenTelemetry in Go-Services integrieren", "Jaeger Tracing Dashboard aufsetzen", "CI-Performance-Baseline messen"]},
     {"number": 2, "title": "Skalierung vorbereiten", "duration": "6 Wochen", "items": ["Monorepo-Scaling-Analyse für 50 Apps", "Service-Mesh Pilot (Linkerd)", "Load-Testing-Suite erweitern", "Runbook für alle kritischen Szenarien"]}
   ]
 }',
 '2025-03-01T09:00:00Z'),

-- ── 5. BürgerPortal Bayern – Behörde (Score: 11 / Kritisch) ───
('a1000000-0000-0000-0000-000000000005',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "BürgerPortal Bayern",
   "clientName": "Bayerische Staatskanzlei",
   "teamSize": "5-15",
   "appCount": "10-20",
   "targetApps": "50",
   "primaryStack": "laravel",
   "database": "mysql,mariadb",
   "hosting": "selfhosted",
   "legacyApps": "yes",
   "legacyDetail": "PHP 5.6, Windows Server 2008 R2, Internet Explorer 11-Pflicht",
   "codeSharing": "copypaste",
   "designSystem": "none",
   "cicd": "none",
   "testing": "none",
   "monitoring": "none",
   "documentation": "outdated",
   "branching": "none",
   "onboardingTime": "month"
 }',
 '{
   "score": 11,
   "scoreLabel": "Kritisch",
   "source": "fallback",
   "summary": "Hochkritische Situation: PHP 5.6 und Windows Server 2008 R2 sind seit Jahren EOL und erhalten keine Sicherheitspatches. Behördendaten der Bürger sind gefährdet. Datenschutzbehörde könnte einschreiten.",
   "risks": [
     {"title": "PHP 5.6 EOL – kritische Sicherheitslücken", "severity": "high", "description": "PHP 5.6 erhält seit 2018 keine Updates mehr. Bekannte CVEs (z.B. CVE-2019-11043) sind ausnutzbar. Bürgerdaten sind direkt gefährdet.", "recommendation": "Sofortige WAF-Vorschaltung (ModSecurity). Dringend: PHP-Migration auf 8.2 innerhalb von 3 Monaten. Windows Server 2008 auf Windows Server 2022 migrieren."},
     {"title": "Windows Server 2008 R2 ohne Sicherheitsupdates", "severity": "high", "description": "Microsoft hat den Support 2020 beendet. Bekannte OS-Exploits sind öffentlich verfügbar. Ein erfolgreicher Angriff würde alle Behördendaten kompromittieren.", "recommendation": "Notfallpatching über Microsoft ESU (Extended Security Updates) sofern verfügbar. Parallele Migration auf neue Serverinfrastruktur priorisieren."},
     {"title": "Keine Versionskontrolle", "severity": "high", "description": "Code wird direkt auf dem Server bearbeitet. Es gibt keine Möglichkeit, Änderungen nachzuvollziehen oder Rollbacks durchzuführen.", "recommendation": "Sofort Git einführen. Alle Quellcodes in ein Repository überführen. Kein direktes Editieren auf dem Server mehr."},
     {"title": "DSGVO-Verletzung durch fehlende Verschlüsselung", "severity": "high", "description": "Personenbezogene Daten der Bürger werden unverschlüsselt in MariaDB gespeichert. Datenpanne hätte strafrechtliche Konsequenzen.", "recommendation": "Sofort: Datenverschlüsselung at-rest aktivieren. DSGVO-Beauftragten einschalten. Alle Logfiles auf personenbezogene Daten prüfen."},
     {"title": "Internet Explorer 11 als Pflicht-Browser", "severity": "medium", "description": "Microsoft hat IE11 am 15. Juni 2022 abgekündigt. Neue Web-Standards können nicht verwendet werden. Mitarbeiterproduktivität leidet.", "recommendation": "Portale auf moderne Browser umstellen. Edge im IE-Kompatibilitätsmodus als Übergangslösung."}
   ],
   "soll": [
     {"area": "Sicherheit", "target": "PHP 8.2, Windows Server 2022 – keine EOL-Systeme mehr in Production"},
     {"area": "Versionskontrolle", "target": "Git für alle Repositories, kein direktes Server-Editieren"},
     {"area": "DSGVO", "target": "Datenverschlüsselung at-rest, DSGVO-Audit bestanden"},
     {"area": "Browser-Kompatibilität", "target": "Alle Portale auf aktuelle Browser-Standards modernisiert"}
   ],
   "waves": [
     {"number": 1, "title": "Sofortmaßnahmen (Notfall)", "duration": "2 Wochen", "items": ["WAF (ModSecurity) vorschalten", "Datenbankzugriffe auf Verschlüsselung prüfen", "Git-Server einrichten, Code-Import", "Datenschutzbeauftragten informieren"]},
     {"number": 2, "title": "Technische Grundlagen", "duration": "3 Monate", "items": ["PHP 8.2 Migration", "Windows Server 2022 Migration", "CI/CD Pipeline (GitLab CE)", "Erste automatische Tests"]},
     {"number": 3, "title": "Modernisierung", "duration": "6 Monate", "items": ["Laravel 11 Framework-Migration", "Design System (Bundesdesign-konforme Komponenten)", "Browser-Unterstützung auf moderne Browser umstellen", "Monitoring einführen"]}
   ]
 }',
 '2024-06-15T11:00:00Z'),

-- ── 6. ManufactPro – ERP Mittelstand (Score: 43 / Niedrig) ────
('a1000000-0000-0000-0000-000000000006',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "ManufactPro ERP",
   "clientName": "ManufactPro Maschinenbau GmbH",
   "teamSize": "5-15",
   "appCount": "5-10",
   "targetApps": "20",
   "primaryStack": "java,angular",
   "database": "postgres,redis",
   "hosting": "selfhosted,docker",
   "legacyApps": "yes",
   "legacyDetail": "Spring 4.x, AngularJS 1.6, Hibernate 3.x",
   "codeSharing": "git-sub",
   "designSystem": "partial",
   "cicd": "jenkins",
   "testing": "unit,minimal",
   "monitoring": "uptime",
   "documentation": "outdated",
   "branching": "gitflow",
   "onboardingTime": "weeks"
 }',
 '{
   "score": 43,
   "scoreLabel": "Verbesserungsbedarf",
   "source": "fallback",
   "summary": "Typisches Mittelstands-ERP: Gewachsene Struktur mit Jenkins-Pipeline und Git-Submodulen als Behelf. AngularJS 1.6 ist EOL, Spring 4.x nahezu veraltet. Kein E2E-Testing für geschäftskritische Workflows.",
   "risks": [
     {"title": "AngularJS 1.6 End-of-Life seit 2021", "severity": "high", "description": "Das Frontend basiert auf AngularJS 1.6, das seit Dezember 2021 keinen Support mehr erhält. Sicherheitslücken werden nicht mehr gepatcht.", "recommendation": "Migration zu Angular 17+ über Ngmigrate-Tool oder schrittweise Neuentwicklung der Module. Zeitrahmen: 12 Monate."},
     {"title": "Git Submodules als Shared-Code-Strategie", "severity": "medium", "description": "Submodules führen regelmäßig zu Merge-Konflikten, versehentlich gepinnten alten Versionen und frustrierten Entwicklern. Onboarding dauert 2+ Wochen allein wegen Submodule-Konfiguration.", "recommendation": "Auf Maven/Gradle private Registry umstellen. Shared Libs als versionierte Artefakte veröffentlichen."},
     {"title": "Jenkins ohne standardisierte Stages", "severity": "medium", "description": "Jede App hat ihre eigene Jenkinsfile-Konfiguration. Build-Zeiten variieren von 4 bis 47 Minuten. Qualitätsgates fehlen.", "recommendation": "Jenkins Shared Library mit einheitlichen Stages (compile, test, sonar, deploy) einführen. SonarQube-Integration für Code-Quality-Gates."},
     {"title": "Kein Integrations-Testing für ERP-Workflows", "severity": "high", "description": "Geschäftskritische Prozesse (Auftragserfassung, Lager, Produktion) haben keine automatisierten Tests. Jedes Release erfordert 2 Tage manuelles Testen.", "recommendation": "Integrationstests mit Spring Boot Test + Testcontainers einführen. Kritische ERP-Workflows als automatisierte Regression definieren."}
   ],
   "soll": [
     {"area": "Frontend", "target": "AngularJS 1.6 Migration zu Angular 17+ – komplett bis Q2 2026"},
     {"area": "Testing", "target": "Integrationstests für alle kritischen ERP-Workflows – kein manuelles Release-Testing mehr"},
     {"area": "CI/CD", "target": "Jenkins Shared Library mit einheitlichen Stages und SonarQube-Gate"},
     {"area": "Code-Sharing", "target": "Maven Private Registry statt Git Submodules"}
   ],
   "waves": [
     {"number": 1, "title": "Fundament", "duration": "4 Wochen", "items": ["Jenkins Shared Library Template erstellen", "SonarQube einrichten und integrieren", "Maven Nexus Repository aufsetzen", "Shared Libs als erste Artefakte publizieren"]},
     {"number": 2, "title": "Testing", "duration": "2 Monate", "items": ["Testcontainers für DB-Integrationstests", "Kritische ERP-Workflows automatisiert testen", "AngularJS Migration-Analyse & Scoping", "Onboarding-Dokumentation erneuern"]},
     {"number": 3, "title": "Frontend-Migration", "duration": "6 Monate", "items": ["AngularJS Modul für Modul auf Angular 17 migrieren", "Design System mit Angular Material", "E2E-Tests mit Playwright", "Performance-Budget definieren"]}
   ]
 }',
 '2024-09-05T13:00:00Z'),

-- ── 7. StreamHub – Medienportal (Score: 61 / Gut) ─────────────
('a1000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "StreamHub",
   "clientName": "StreamHub Media GmbH",
   "teamSize": "5-15",
   "appCount": "5-10",
   "targetApps": "20",
   "primaryStack": "vue,python",
   "database": "postgres,mongodb,redis",
   "hosting": "aws",
   "legacyApps": "no",
   "codeSharing": "monorepo",
   "designSystem": "full",
   "cicd": "github-actions",
   "testing": "unit,integration",
   "monitoring": "sentry,analytics,dashboard",
   "documentation": "readme,storybook",
   "branching": "trunk",
   "onboardingTime": "week"
 }',
 '{
   "score": 61,
   "scoreLabel": "Gut",
   "source": "fallback",
   "summary": "Modernes Medien-Streaming-Portal mit solider technischer Basis. Stärken: vollständiges Design System, Storybook, Trunk-Based Development. Schwächen: keine E2E-Tests für kritische User-Flows, MongoDB ohne konsistente Schema-Validierung.",
   "risks": [
     {"title": "MongoDB ohne Schema-Validierung", "severity": "medium", "description": "Content-Daten in MongoDB werden ohne Validation Schema gespeichert. Inkonsistente Dokumente führen zu Frontend-Crashes in seltenen Edge Cases.", "recommendation": "MongoDB Schema Validation (JSON Schema) für alle Collections einführen. Mongoose mit strikten Schemas im Backend."},
     {"title": "Kein CDN-Failover für Video-Assets", "severity": "medium", "description": "Bei AWS CloudFront-Ausfall sind alle Video-Assets nicht verfügbar. Kein Fallback auf alternative Distribution.", "recommendation": "Multi-CDN-Setup (CloudFront + Cloudflare als Fallback). Automatisches Failover via Route 53 Health Checks."},
     {"title": "Python-API ohne typisierte Interfaces", "severity": "low", "description": "Die Python-Backend-APIs haben keine Pydantic-Modelle. Fehler durch fehlende Felder werden erst zur Laufzeit entdeckt.", "recommendation": "Pydantic v2 für alle API-Request/Response-Modelle. mypy-Typchecks in CI integrieren."}
   ],
   "soll": [
     {"area": "Datenqualität", "target": "MongoDB Schema Validation für alle Collections – keine fehlerhaften Dokumente mehr"},
     {"area": "Verfügbarkeit", "target": "Multi-CDN mit automatischem Failover – 99,9 % Video-Availability"},
     {"area": "Backend-Qualität", "target": "Pydantic v2 + mypy in allen Python-Services – Typsicherheit im CI"}
   ],
   "waves": [
     {"number": 1, "title": "Qualität", "duration": "3 Wochen", "items": ["MongoDB Schema Validation für kritische Collections", "Pydantic v2 Migration starten", "mypy in CI-Pipeline einbinden"]},
     {"number": 2, "title": "Verfügbarkeit", "duration": "4 Wochen", "items": ["Cloudflare als zweites CDN konfigurieren", "Route 53 Health Check + Failover", "Load-Testing für Spitzenlast", "Incident-Runbooks erstellen"]}
   ]
 }',
 '2025-01-25T16:00:00Z'),

-- ── 8. SensorGrid – Industrial IoT (Score: 57 / Ausbaufähig) ──
('a1000000-0000-0000-0000-000000000008',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "SensorGrid Industrial",
   "clientName": "SensorGrid GmbH",
   "teamSize": "5-15",
   "appCount": "5-10",
   "targetApps": "20",
   "primaryStack": "go,python,nextjs",
   "database": "postgres,redis",
   "hosting": "selfhosted,docker",
   "legacyApps": "no",
   "codeSharing": "sharedlib",
   "designSystem": "partial",
   "cicd": "github-actions",
   "testing": "unit,integration",
   "monitoring": "logging,dashboard,uptime",
   "documentation": "adr,readme",
   "branching": "gitflow",
   "onboardingTime": "weeks"
 }',
 '{
   "score": 57,
   "scoreLabel": "Ausbaufähig",
   "source": "fallback",
   "summary": "Interessante IoT-Architektur mit Go-Backends und Python-ML-Komponenten. ADRs vorhanden – gute Entscheidungskultur. Lücken: kein E2E-Testing für Sensor-Daten-Pipelines, kein formales Incident-Management.",
   "risks": [
     {"title": "Sensor-Datenpipeline ohne End-to-End-Tests", "severity": "high", "description": "Die kritische Datenpipeline von Sensor → MQTT → Go-Processor → PostgreSQL → Dashboard hat keine automatisierten Tests. Silent Data Loss wäre kaum detektierbar.", "recommendation": "Integrationstests mit Docker Compose für die gesamte Pipeline schreiben. MQTT-Testbroker (Mosquitto) in CI-Setup einbinden. Data-Quality-Alerts auf Anomalien konfigurieren."},
     {"title": "Kein formales Incident-Management", "severity": "medium", "description": "Bei Sensor-Ausfällen oder Datenverlust gibt es keinen definierten Eskalationsprozess. Fehler werden ad-hoc per Slack kommuniziert.", "recommendation": "PagerDuty oder OpsGenie einführen. On-Call-Rotationen definieren. Runbooks für häufige Incident-Typen (Sensor offline, Pipeline-Stau) erstellen."},
     {"title": "Python ML-Modelle ohne Versioning", "severity": "medium", "description": "Trainierte ML-Modelle zur Anomalie-Erkennung werden ohne Versionierung deployt. Rollback bei schlechten Modellen ist nicht möglich.", "recommendation": "MLflow für Model-Versioning und -Registry einführen. A/B-Deployment für neue Modelle. Automatisierte Modell-Performance-Metriken."}
   ],
   "soll": [
     {"area": "Testing", "target": "Vollständige Pipeline-Integrationstests – Silent Data Loss ist detektierbar"},
     {"area": "Incident-Management", "target": "PagerDuty mit On-Call-Rotation und Runbooks für alle kritischen Incidents"},
     {"area": "ML-Operations", "target": "MLflow Model-Registry – jedes deployte Modell ist versioniert und rollback-fähig"}
   ],
   "waves": [
     {"number": 1, "title": "Observability", "duration": "3 Wochen", "items": ["PagerDuty einrichten, On-Call-Plan definieren", "Runbooks für Top-5 Incident-Typen schreiben", "Data-Quality-Alerts konfigurieren"]},
     {"number": 2, "title": "Test-Infrastruktur", "duration": "5 Wochen", "items": ["Mosquitto MQTT-Broker in CI-Setup", "Pipeline-Integrationstests schreiben", "MLflow für Model-Registry", "Performance-Benchmarks für Go-Services"]}
   ]
 }',
 '2025-02-14T10:30:00Z'),

-- ── 9. LearnSphere – EdTech Startup (Score: 37 / Niedrig) ─────
('a1000000-0000-0000-0000-000000000009',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "LearnSphere",
   "clientName": "LearnSphere Education GmbH",
   "teamSize": "1-5",
   "appCount": "1-5",
   "targetApps": "10",
   "primaryStack": "nextjs,python",
   "database": "firebase",
   "hosting": "vercel,gcp",
   "legacyApps": "no",
   "codeSharing": "copypaste",
   "designSystem": "none",
   "cicd": "github-actions",
   "testing": "unit,minimal",
   "monitoring": "analytics",
   "documentation": "readme",
   "branching": "basic",
   "onboardingTime": "weeks"
 }',
 '{
   "score": 37,
   "scoreLabel": "Verbesserungsbedarf",
   "source": "fallback",
   "summary": "Junges EdTech-Startup mit schnellem MVP-Approach. CI/CD ist vorhanden – ein Pluspunkt. Firebase-Vendor-Lock-in und fehlende Datenschutz-Konformität für Minderjährige sind kritische Baustellen.",
   "risks": [
     {"title": "Firebase Vendor Lock-in bei Schülerdaten", "severity": "high", "description": "Alle Lernfortschritte und Nutzerdaten von minderjährigen Schülern sind in Firebase gespeichert. Migration zu eigenem Backend ist bei aktueller Architektur extrem aufwendig.", "recommendation": "Abstraktionsschicht (Repository Pattern) über Firebase einziehen. Parallelimplementierung mit PostgreSQL als Exit-Strategie vorbereiten."},
     {"title": "DSGVO / COPPA – Minderjährige ohne Parental Consent", "severity": "high", "description": "Die Plattform sammelt Daten von Schülern unter 16 ohne dokumentierten Elternteil-Consent-Prozess. EU DSGVO-Verstoß möglich.", "recommendation": "Sofort: Datenschutzbeauftragten einschalten. Parental-Consent-Flow implementieren. Datenerhebung auf Minimum reduzieren (Privacy by Design)."},
     {"title": "Keine Design-System-Konsistenz", "severity": "medium", "description": "UI-Komponenten wurden projekt-intern per Copy-Paste erstellt. Inkonsistente Barrierefreiheit – für Bildungsplattformen gesetzlich relevant.", "recommendation": "Radix UI oder Headless UI als barrierefreie Komponentenbasis. WCAG 2.1 AA als Mindeststandard definieren."}
   ],
   "soll": [
     {"area": "Architektur", "target": "Repository Pattern über Firebase – Vendor Lock-in aufgelöst, Migration zu PostgreSQL vorbereitet"},
     {"area": "Compliance", "target": "DSGVO/COPPA-konformer Parental-Consent-Flow – Rechtsrisiko eliminiert"},
     {"area": "Barrierefreiheit", "target": "WCAG 2.1 AA Konformität – gesetzliche Anforderung erfüllt"}
   ],
   "waves": [
     {"number": 1, "title": "Compliance First", "duration": "3 Wochen", "items": ["Datenschutzbeauftragten einschalten", "Parental Consent Flow implementieren", "Datenerhebung auf Minimum reduzieren", "DSGVO-Dokumentation erstellen"]},
     {"number": 2, "title": "Architektur", "duration": "6 Wochen", "items": ["Repository Pattern über Firebase einziehen", "PostgreSQL als Alternativ-Backend vorbereiten", "Radix UI als Komponentenbasis einführen", "WCAG-Audit und Bugfixes"]}
   ]
 }',
 '2024-12-01T09:00:00Z'),

-- ── 10. MedTrack – Healthcare-System (Score: 69 / Gut) ─────────
('a1000000-0000-0000-0000-000000000010',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "MedTrack Clinical",
   "clientName": "MedTrack Solutions GmbH",
   "teamSize": "15-30",
   "appCount": "10-20",
   "targetApps": "50",
   "primaryStack": "angular,dotnet",
   "database": "postgres",
   "hosting": "azure",
   "legacyApps": "no",
   "codeSharing": "monorepo",
   "designSystem": "full",
   "cicd": "github-actions,standardized",
   "testing": "unit,integration,e2e",
   "monitoring": "sentry,logging,dashboard",
   "documentation": "adr,wiki,readme",
   "branching": "gitflow",
   "onboardingTime": "week"
 }',
 '{
   "score": 69,
   "scoreLabel": "Gut",
   "source": "fallback",
   "summary": "Professionell aufgestelltes Healthcare-System mit starker Compliance-Orientierung. Azure-Hosting mit HIPAA-Berücksichtigung, vollständiges Testing. Gitflow statt Trunk-Based Development und fehlende Chaos-Engineering-Tests sind die letzten größeren Lücken.",
   "risks": [
     {"title": "Gitflow verlangsamt kritische Hotfixes", "severity": "medium", "description": "Bei medizinkritischen Bugs muss der Hotfix-Branch durch den vollen Gitflow-Prozess. In einem Healthcare-Kontext können 4+ Stunden Deployment-Verzögerung problematisch sein.", "recommendation": "Zu Trunk-Based Development mit Feature Flags migrieren. Hotfix-Prozess auf < 30 Minuten zum Production-Deploy verkürzen."},
     {"title": "Kein Chaos Engineering / Resilience Testing", "severity": "medium", "description": "Azure-Outages werden nicht systematisch getestet. Bei einem partiellen Azure-Ausfall ist das Verhalten der kritischen klinischen APIs unbekannt.", "recommendation": "Netflix Chaos Monkey oder Azure Chaos Studio für kontrollierte Ausfallsimulationen. Monatliche Game Days durchführen."},
     {"title": "Azure Single-Region Deployment", "severity": "low", "description": "Alle Workloads laufen ausschließlich in West Europe. Ein regionaler Azure-Ausfall würde alle Services betreffen.", "recommendation": "Kritische Read-Paths in eine zweite Azure Region replizieren (Azure Traffic Manager). RPO/RTO für kritische Services dokumentieren."}
   ],
   "soll": [
     {"area": "Deployment", "target": "Trunk-Based Development mit Feature Flags – Hotfixes unter 30 Minuten in Production"},
     {"area": "Resilience", "target": "Monatliche Game Days mit Chaos Engineering – alle kritischen Ausfallszenarien bekannt und dokumentiert"},
     {"area": "Multi-Region", "target": "Kritische Read-Paths in zwei Azure Regionen aktiv"}
   ],
   "waves": [
     {"number": 1, "title": "Deployment-Modernisierung", "duration": "6 Wochen", "items": ["Feature-Flag-System (Azure App Configuration) einführen", "Trunk-Based Migration planen und pilotieren", "Hotfix-SLA definieren und messen"]},
     {"number": 2, "title": "Resilience", "duration": "2 Monate", "items": ["Azure Chaos Studio konfigurieren", "Ersten Game Day durchführen", "Multi-Region-Read-Replikation für kritische Services", "RTO/RPO-Dokumentation vervollständigen"]}
   ]
 }',
 '2025-02-01T08:00:00Z'),

-- ── 11. FreightMaster – Logistik (Score: 24 / Kritisch) ────────
('a1000000-0000-0000-0000-000000000011',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "FreightMaster",
   "clientName": "FreightMaster Logistics AG",
   "teamSize": "5-15",
   "appCount": "10-20",
   "targetApps": "20",
   "primaryStack": "laravel,vue,dotnet",
   "database": "mysql,mariadb",
   "hosting": "selfhosted,docker",
   "legacyApps": "yes",
   "legacyDetail": "Oracle DB 11g, ASP.NET WebForms (.NET Framework 4.5), VBScript Reports",
   "codeSharing": "copypaste",
   "designSystem": "none",
   "cicd": "jenkins",
   "testing": "none",
   "monitoring": "uptime",
   "documentation": "outdated",
   "branching": "basic",
   "onboardingTime": "month"
 }',
 '{
   "score": 24,
   "scoreLabel": "Kritisch",
   "source": "fallback",
   "summary": "Komplexe Logistik-Plattform mit ernsthafter technischer Schuld. Oracle DB 11g und .NET Framework 4.5 WebForms sind kritische EOL-Systeme. Keine Tests trotz geschäftskritischer Lieferketten-Workflows. Sofortiger Handlungsbedarf.",
   "risks": [
     {"title": "Oracle DB 11g End-of-Life (2020)", "severity": "high", "description": "Oracle Database 11g erhält seit 2021 keine Sicherheitspatches mehr. Lieferkettendaten und Kundendaten sind ungeschützt.", "recommendation": "Migration zu PostgreSQL über AWS DMS oder ora2pg. Schrittweise app-by-app Migration. Zeitrahmen: 18 Monate."},
     {"title": "ASP.NET WebForms ohne Tests", "severity": "high", "description": "Kern-Logistik-Workflows (Sendungserfassung, Routenplanung) laufen auf WebForms-Code aus 2009 komplett ohne Tests. Jede Änderung ist ein Produktionsrisiko.", "recommendation": "Strangler Fig Pattern: neue Features ausschließlich als .NET 8 APIs entwickeln. WebForms-Kern sukzessive ersetzen."},
     {"title": "VBScript-Reports als Geschäftsberichte", "severity": "medium", "description": "Monatliche Geschäftsberichte werden über VBScript-Reports generiert. Ein Skriptfehler kann das gesamte Reporting für Tage lahmlegen.", "recommendation": "Reporting auf Power BI Embedded oder Metabase migrieren. VBScript-Reports durch SQL-Views + modernes Reporting ersetzen."},
     {"title": "Copy-Paste über 15+ Repositories", "severity": "high", "description": "Shared-Logik ist in über 15 Repositories dupliziert. Ein Security-Fix im Authentifizierungs-Code muss manuell in 15 Repos nachgezogen werden.", "recommendation": "Private npm Registry oder NuGet-Feed für shared Libraries. Minimum: kritische Auth/Security-Logik zentralisieren."}
   ],
   "soll": [
     {"area": "Datenbank", "target": "Oracle DB 11g vollständig zu PostgreSQL migriert – keine EOL-Datenbank mehr"},
     {"area": "Backend", "target": "Alle neuen Features als .NET 8 REST APIs – WebForms-Anteil unter 30 %"},
     {"area": "Code-Sharing", "target": "Geteilte Auth/Security-Logik in zentralem NuGet-Paket – ein Fix, überall aktuell"},
     {"area": "Reporting", "target": "Power BI Embedded ersetzt alle VBScript-Reports"}
   ],
   "waves": [
     {"number": 1, "title": "Risikominimierung", "duration": "4 Wochen", "items": ["Oracle DB auf aktuelle 19c upgraden (Interim)", "Auth-Logik zentralisieren", "Jenkins Pipeline mit Basis-Tests", "Reporting-Inventar aufnehmen"]},
     {"number": 2, "title": "Modernisierung Start", "duration": "3 Monate", "items": ["PostgreSQL Migrations-Pilot (1. App)", ".NET 8 API für neue Features verpflichtend", "Power BI Embedded Pilot", "Erste Unit-Tests für Kern-Services"]},
     {"number": 3, "title": "Migration", "duration": "12 Monate", "items": ["Oracle vollständig migriert", "WebForms unter 30 % Anteil", "Alle VBScript-Reports ersetzt", "Test-Coverage > 40 %"]}
   ]
 }',
 '2024-07-10T14:00:00Z'),

-- ── 12. DataPulse – Analytics SaaS (Score: 78 / Sehr gut) ──────
('a1000000-0000-0000-0000-000000000012',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "DataPulse Analytics",
   "clientName": "DataPulse Technologies Inc.",
   "teamSize": "15-30",
   "appCount": "10-20",
   "targetApps": "50",
   "primaryStack": "python,nextjs,go",
   "database": "postgres,redis",
   "hosting": "gcp,docker",
   "legacyApps": "no",
   "codeSharing": "monorepo",
   "designSystem": "full",
   "cicd": "github-actions,standardized",
   "testing": "unit,integration,e2e,comprehensive",
   "monitoring": "sentry,logging,dashboard,analytics",
   "documentation": "adr,storybook,wiki",
   "branching": "trunk",
   "onboardingTime": "days"
 }',
 '{
   "score": 78,
   "scoreLabel": "Sehr gut",
   "source": "fallback",
   "summary": "Professionell aufgestellte Analytics-Plattform. Starkes Team mit Trunk-Based Development, ADRs und umfassender Testabdeckung. Optimierungspotenzial in Data Pipeline Observability und Multi-Tenant Isolation.",
   "risks": [
     {"title": "Multi-Tenant Datenisolation prüfen", "severity": "medium", "description": "Die PostgreSQL Row-Level-Security für Tenant-Isolation wurde zuletzt vor 8 Monaten auditiert. Bei der aktuellen Wachstumsgeschwindigkeit sollte die Isolation regelmäßiger verifiziert werden.", "recommendation": "Quartalsweises automatisiertes Security-Testing für Tenant-Isolation. OWASP IDASA Checklist für Multi-Tenant SaaS anwenden."},
     {"title": "GCP Egress-Kosten bei Skalierung", "severity": "low", "description": "Bei 50+ Kunden mit großen Datenmengen könnten GCP Egress-Kosten signifikant steigen. Aktuell kein Cost-Alerting aktiv.", "recommendation": "GCP Budget Alerts konfigurieren. Egress-Optimierung durch CloudFront CDN für statische Analytics-Dashboards evaluieren."}
   ],
   "soll": [
     {"area": "Security", "target": "Quartalsweises automatisiertes Tenant-Isolation-Testing – immer aktuell"},
     {"area": "Kosten", "target": "GCP Budget Alerts aktiv, Egress-Kosten unter Kontrolle"}
   ],
   "waves": [
     {"number": 1, "title": "Security & Compliance", "duration": "3 Wochen", "items": ["Tenant-Isolation automated test suite schreiben", "GCP Budget Alerts konfigurieren", "OWASP IDASA Security Review", "Cost Dashboard in DataPulse selbst aufbauen"]}
   ]
 }',
 '2025-03-05T11:00:00Z'),

-- ── 13. InfraPortal – Interne DevPortal (Score: 86 / Top) ──────
('a1000000-0000-0000-0000-000000000013',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "InfraPortal",
   "clientName": "Intern (Platform Team)",
   "teamSize": "1-5",
   "appCount": "1-5",
   "targetApps": "10",
   "primaryStack": "go,nextjs",
   "database": "postgres",
   "hosting": "hetzner,docker",
   "legacyApps": "no",
   "codeSharing": "monorepo",
   "designSystem": "full",
   "cicd": "github-actions,standardized",
   "testing": "unit,integration,e2e,comprehensive",
   "monitoring": "sentry,logging,uptime,dashboard",
   "documentation": "adr,readme,wiki",
   "branching": "trunk",
   "onboardingTime": "days"
 }',
 '{
   "score": 86,
   "scoreLabel": "Hervorragend",
   "source": "fallback",
   "summary": "Internes Developer-Portal exemplarisch gebaut: kleines Team, maximale Prozessqualität. Hetzner statt Cloud reduziert Kosten um 70 %. Trunk-Based, comprehensive Tests, ADRs. Kleines Optimierungspotenzial bei Disaster Recovery.",
   "risks": [
     {"title": "Hetzner Single-Location ohne Georedundanz", "severity": "low", "description": "Der Hetzner-Server (nbg1) ist das einzige Deployment-Ziel. Ein Rechenzentrumsproblem würde das Portal komplett lahmlegen.", "recommendation": "Hetzner-Backup-Location (fsn1) als Hot-Standby oder zumindest regelmäßige Offsite-Backups nach B2/S3. RTO < 4h definieren."}
   ],
   "soll": [
     {"area": "Verfügbarkeit", "target": "Hetzner Georedundanz oder Backup-Server – RTO unter 4 Stunden"}
   ],
   "waves": [
     {"number": 1, "title": "Disaster Recovery", "duration": "2 Wochen", "items": ["Hetzner fsn1 als Standby-Server konfigurieren", "Automatisches Backup-Skript nach B2", "RTO-Test durchführen und dokumentieren", "Runbook für Server-Ausfall erstellen"]}
   ]
 }',
 '2025-01-15T08:00:00Z'),

-- ── 14. POS Central – Retail (Score: 9 / Kritisch) ─────────────
('a1000000-0000-0000-0000-000000000014',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "POS Central",
   "clientName": "RetailChain Deutschland AG",
   "teamSize": "5-15",
   "appCount": "10-20",
   "targetApps": "50",
   "primaryStack": "dotnet",
   "database": "mysql",
   "hosting": "selfhosted",
   "legacyApps": "yes",
   "legacyDetail": ".NET Framework 2.0, Crystal Reports 10, Windows CE 6.0 Terminals, XML Web Services (ASMX)",
   "codeSharing": "copypaste",
   "designSystem": "none",
   "cicd": "none",
   "testing": "none",
   "monitoring": "none",
   "documentation": "outdated",
   "branching": "none",
   "onboardingTime": "month"
 }',
 '{
   "score": 9,
   "scoreLabel": "Kritisch",
   "source": "fallback",
   "summary": "Alarmierender Zustand: .NET Framework 2.0 (EOL 2011), Windows CE 6.0 (EOL 2014) und Crystal Reports 10 bilden die Kerninfrastruktur einer Einzelhandelskette mit Hunderten von POS-Terminals. Kein CI/CD, keine Tests, kein Monitoring. Sofortiger Handlungsbedarf auf allen Ebenen.",
   "risks": [
     {"title": ".NET Framework 2.0 – EOL seit 2011", "severity": "high", "description": "Der komplette Backend-Code läuft auf .NET Framework 2.0, das seit over 13 Jahren keine Sicherheitsupdates erhält. Bekannte CVEs sind öffentlich zugänglich.", "recommendation": "Notfallplan: WAF vorschalten, Netzwerksegmentierung. Mittelfristig: .NET 8 Migration über Strangler Fig. Alle ASMX-Services schrittweise zu REST APIs konvertieren."},
     {"title": "Windows CE 6.0 POS-Terminals (EOL 2014)", "severity": "high", "description": "Hunderte POS-Terminals laufen auf Windows CE 6.0. Diese Systeme erhalten seit 2014 keine Updates und sind direkt mit dem Zahlungsnetzwerk verbunden – PCI-DSS-Verstoß.", "recommendation": "PCI-DSS-Compliance sofort mit Sicherheitsberater klären. Netzwerksegmentierung der Terminals. Kurzfristig: Hardware-Refresh-Planung für POS-Terminals (Android-basierte Terminals)."},
     {"title": "PCI-DSS-Verletzung durch fehlende Datenverschlüsselung", "severity": "high", "description": "Zahlungsdaten werden ohne end-to-end Verschlüsselung über das interne Netz übertragen. Gravierender PCI-DSS-Verstoß mit Bußgeldrisiko.", "recommendation": "Sofort: PCI-DSS QSA (Qualified Security Assessor) beauftragen. TLS für alle Payment-Verbindungen erzwingen. Keine Klartextzahlungsdaten im Netz."},
     {"title": "Kein Incident-Response bei Kassenausfall", "severity": "high", "description": "Es gibt keinen definierten Prozess wenn ein POS-Terminal oder der zentraler Kassensystem-Server ausfällt. Letzte Kassenausfälle dauerten 6+ Stunden.", "recommendation": "Incident Response Plan für POS-Ausfall dokumentieren. Offline-Kassenfähigkeit (lokales Fallback) implementieren. Ziel: Kassenausfall max. 15 Minuten."},
     {"title": "Crystal Reports 10 – keine API-Integration möglich", "severity": "medium", "description": "Alle Geschäftsberichte sind in Crystal Reports 10 gebunden. Keine automatische Auslieferung oder API-Zugriff möglich.", "recommendation": "Reporting auf SQL Server Reporting Services (SSRS) oder Power BI migrieren. Stufenweise: Kritische Berichte zuerst."}
   ],
   "soll": [
     {"area": "Sicherheit", "target": "PCI-DSS-Compliance wiederhergestellt – QSA-Zertifizierung erhalten"},
     {"area": "POS-Hardware", "target": "Alle Windows CE Terminals durch moderne Android-POS ersetzt"},
     {"area": "Backend", "target": "Alle ASMX Services zu .NET 8 REST APIs migriert"},
     {"area": "Incident-Response", "target": "Kassenausfall-Plan: max. 15 Minuten Ausfallzeit, Offline-Fallback aktiv"}
   ],
   "waves": [
     {"number": 1, "title": "Sofortmaßnahmen", "duration": "2 Wochen", "items": ["PCI-DSS QSA beauftragen", "Netzwerksegmentierung POS-Terminals", "TLS auf allen Payment-Verbindungen erzwingen", "WAF vor Backend schalten"]},
     {"number": 2, "title": "Hardware-Modernisierung", "duration": "3 Monate", "items": ["Android POS-Terminal Pilottest (10 Filialen)", "Offline-Kassenfähigkeit implementieren", "Incident-Response-Plan dokumentieren", "Git einführen, Code-Inventur"]},
     {"number": 3, "title": "Backend-Migration", "duration": "6 Monate", "items": [".NET 8 für alle neuen Features", "ASMX-Services zu REST APIs konvertieren", "Reporting auf Power BI Embedded", "CI/CD Pipeline einrichten"]},
     {"number": 4, "title": "Abschluss", "duration": "12 Monate", "items": ["Alle POS-Terminals auf Android umgestellt", ".NET Framework 2.0 komplett abgelöst", "Crystal Reports vollständig ersetzt", "PCI-DSS-Zertifizierung erneuert"]}
   ]
 }',
 '2024-05-20T09:00:00Z'),

-- ── 15. StyleGrid – Fashion E-Commerce (Score: 46 / Mittel) ────
('a1000000-0000-0000-0000-000000000015',
 '00000000-0000-0000-0000-000000000001',
 '{
   "projectName": "StyleGrid",
   "clientName": "StyleGrid Fashion GmbH",
   "teamSize": "5-15",
   "appCount": "5-10",
   "targetApps": "20",
   "primaryStack": "nextjs,rails",
   "database": "postgres,redis",
   "hosting": "aws,vercel",
   "legacyApps": "no",
   "codeSharing": "sharedlib",
   "designSystem": "partial",
   "cicd": "github-actions",
   "testing": "unit",
   "monitoring": "analytics,sentry",
   "documentation": "readme",
   "branching": "gitflow",
   "onboardingTime": "weeks"
 }',
 '{
   "score": 46,
   "scoreLabel": "Ausbaufähig",
   "source": "fallback",
   "summary": "Fashion-E-Commerce mit modernem Frontend-Stack (Next.js) und bewährtem Backend (Rails). Gute Sentry-Integration und Analytics. Lücken: kein E2E-Testing für den Kaufprozess, unvollständiges Design System und Gitflow verlangsamt Releases vor saisonalen Peaks.",
   "risks": [
     {"title": "Kein E2E-Testing vor saisonalen Spitzen", "severity": "high", "description": "Vor Black Friday und Sommersales gibt es keine automatisierten Tests für Warenkorb, Bestellung und Payment. Fehler werden live von Kunden entdeckt.", "recommendation": "Playwright E2E-Tests für kritische Commerce-Flows. Lasttest vor jedem saisonalen Peak. CI-Nightly-Run mit E2E-Suite."},
     {"title": "Gitflow verlangsamt Pre-Peak-Deployments", "severity": "medium", "description": "Vor saisonalen Peaks müssen Branch-Merges und Reviews beschleunigt werden, was Qualitätsgates umgangen werden. Trunk-Based würde kontinuierliche kleine Releases erlauben.", "recommendation": "Trunk-Based Development mit Feature Flags. LaunchDarkly oder OpenFeature für kampagnengesteuerte Features."},
     {"title": "Rails 6.1 – Upgrade auf 7.2 überfällig", "severity": "medium", "description": "Rails 6.1 erhält nur noch Security-Patches, aber keine Bugfixes mehr. Neue Features (z.B. Solid Cache) sind nicht verfügbar.", "recommendation": "Rails 7.2 Upgrade. Ruby 3.3 als Runtime. Zeitinvestition: ~2 Wochen für ein mittelgroßes Rails-Projekt."},
     {"title": "Produktbilder ohne WebP/AVIF-Optimierung", "severity": "low", "description": "Produktfotos werden als unkomprimiertes JPEG ausgeliefert. Core Web Vitals leiden, besonders auf Mobile. Direkte Auswirkung auf SEO und Conversionrate.", "recommendation": "Next.js Image-Optimierung nutzen. AWS CloudFront + Lambda@Edge für on-the-fly AVIF-Konvertierung."}
   ],
   "soll": [
     {"area": "Testing", "target": "Playwright E2E für alle Commerce-Flows – automatischer Nightly Run, kein manuelles Peak-Testing"},
     {"area": "Deployment", "target": "Trunk-Based Development mit Feature Flags – saisonale Features ohne Branch-Chaos"},
     {"area": "Backend", "target": "Rails 7.2 + Ruby 3.3 – aktuell und performance-optimiert"},
     {"area": "Performance", "target": "Core Web Vitals LCP < 2.5s – WebP/AVIF für alle Produktbilder"}
   ],
   "waves": [
     {"number": 1, "title": "Quick Wins", "duration": "3 Wochen", "items": ["Next.js Image Component für alle Produktbilder", "Playwright Setup, erste Checkout-Tests", "Rails 7.2 Upgrade vorbereiten und testen"]},
     {"number": 2, "title": "Prozesse", "duration": "6 Wochen", "items": ["Feature Flags mit LaunchDarkly einführen", "Trunk-Based Development Pilot", "E2E-Suite auf 15+ Commerce-Szenarien erweitern", "Rails 7.2 in Production deployen"]},
     {"number": 3, "title": "Peak-Readiness", "duration": "4 Wochen", "items": ["Lasttest für Black Friday", "Alle kritischen E2E-Tests grün", "Feature Flags für Kampagnen bereit", "Performance-Budget eingehalten"]}
   ]
 }',
 '2024-10-18T15:00:00Z')

ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- TASKS (für 5 ausgewählte Projekte)
-- ══════════════════════════════════════════════════════════════

-- ── Tasks für TaskFlow (P01) ──────────────────────────────────
INSERT INTO tasks (id, project_id, user_id, wave_number, wave_title, item, status, note) VALUES
('b1000000-0000-0000-0001-000000000001', 'a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 'Quick Wins', 'GitHub Actions Pipeline aufsetzen', 'done', 'Pipeline mit Lint + Typecheck läuft'),
('b1000000-0000-0000-0001-000000000002', 'a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 'Quick Wins', 'Sentry Error-Tracking integrieren', 'done', 'DSN konfiguriert, Source Maps aktiv'),
('b1000000-0000-0000-0001-000000000003', 'a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 'Quick Wins', 'Vitest installieren und erste Tests schreiben', 'in-progress', NULL),
('b1000000-0000-0000-0001-000000000004', 'a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 2, 'Fundament', 'Turborepo Monorepo aufsetzen', 'open', NULL),
('b1000000-0000-0000-0001-000000000005', 'a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 2, 'Fundament', 'Shared UI Library extrahieren', 'open', NULL),
('b1000000-0000-0000-0001-000000000006', 'a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 2, 'Fundament', 'Test-Coverage auf 40 % bringen', 'open', NULL)
ON CONFLICT DO NOTHING;

-- ── Tasks für ShopNext (P03) ───────────────────────────────────
INSERT INTO tasks (id, project_id, user_id, wave_number, wave_title, item, status, note) VALUES
('b1000000-0000-0000-0003-000000000001', 'a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 1, 'Quick Wins', 'Playwright installieren, erste Checkout-Tests schreiben', 'done', '5 Tests für Happy Path im CI'),
('b1000000-0000-0000-0003-000000000002', 'a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 1, 'Quick Wins', 'CloudWatch Log Insights strukturieren', 'in-progress', 'Log-Gruppen definiert, Queries folgen'),
('b1000000-0000-0000-0003-000000000003', 'a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 1, 'Quick Wins', 'Swagger-Docs auf aktuellen Stand bringen', 'open', NULL),
('b1000000-0000-0000-0003-000000000004', 'a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 2, 'Stabilisierung', 'MySQL Read-Replicas konfigurieren', 'open', NULL),
('b1000000-0000-0000-0003-000000000005', 'a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 2, 'Stabilisierung', 'E2E-Suite auf 20+ Szenarien erweitern', 'open', NULL)
ON CONFLICT DO NOTHING;

-- ── Tasks für BürgerPortal Bayern (P05) ───────────────────────
INSERT INTO tasks (id, project_id, user_id, wave_number, wave_title, item, status, note) VALUES
('b1000000-0000-0000-0005-000000000001', 'a1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 1, 'Sofortmaßnahmen (Notfall)', 'WAF (ModSecurity) vorschalten', 'done', 'Nginx + ModSecurity aktiv seit 12.01.'),
('b1000000-0000-0000-0005-000000000002', 'a1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 1, 'Sofortmaßnahmen (Notfall)', 'Datenbankzugriffe auf Verschlüsselung prüfen', 'done', 'Audit abgeschlossen – at-rest Verschlüsselung fehlt'),
('b1000000-0000-0000-0005-000000000003', 'a1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 1, 'Sofortmaßnahmen (Notfall)', 'Git-Server einrichten, Code-Import', 'in-progress', 'GitLab CE läuft, Import läuft noch'),
('b1000000-0000-0000-0005-000000000004', 'a1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 1, 'Sofortmaßnahmen (Notfall)', 'Datenschutzbeauftragten informieren', 'done', 'Termin am 20.03. vereinbart'),
('b1000000-0000-0000-0005-000000000005', 'a1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 2, 'Technische Grundlagen', 'PHP 8.2 Migration', 'open', NULL),
('b1000000-0000-0000-0005-000000000006', 'a1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 2, 'Technische Grundlagen', 'Windows Server 2022 Migration', 'open', NULL),
('b1000000-0000-0000-0005-000000000007', 'a1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 2, 'Technische Grundlagen', 'CI/CD Pipeline (GitLab CE)', 'open', NULL)
ON CONFLICT DO NOTHING;

-- ── Tasks für MedTrack (P10) ───────────────────────────────────
INSERT INTO tasks (id, project_id, user_id, wave_number, wave_title, item, status, note) VALUES
('b1000000-0000-0000-0010-000000000001', 'a1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 1, 'Deployment-Modernisierung', 'Feature-Flag-System (Azure App Configuration) einführen', 'in-progress', 'Konfiguration erstellt, Integration in Backend läuft'),
('b1000000-0000-0000-0010-000000000002', 'a1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 1, 'Deployment-Modernisierung', 'Trunk-Based Migration planen und pilotieren', 'open', NULL),
('b1000000-0000-0000-0010-000000000003', 'a1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 1, 'Deployment-Modernisierung', 'Hotfix-SLA definieren und messen', 'open', NULL),
('b1000000-0000-0000-0010-000000000004', 'a1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 2, 'Resilience', 'Azure Chaos Studio konfigurieren', 'open', NULL),
('b1000000-0000-0000-0010-000000000005', 'a1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 2, 'Resilience', 'Ersten Game Day durchführen', 'open', NULL)
ON CONFLICT DO NOTHING;

-- ── Tasks für POS Central (P14) ───────────────────────────────
INSERT INTO tasks (id, project_id, user_id, wave_number, wave_title, item, status, note) VALUES
('b1000000-0000-0000-0014-000000000001', 'a1000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 1, 'Sofortmaßnahmen', 'PCI-DSS QSA beauftragen', 'done', 'Vertrag mit SecureAudit GmbH unterzeichnet'),
('b1000000-0000-0000-0014-000000000002', 'a1000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 1, 'Sofortmaßnahmen', 'Netzwerksegmentierung POS-Terminals', 'in-progress', 'VLAN-Konzept erstellt, Umsetzung in 5 Pilotfilialen'),
('b1000000-0000-0000-0014-000000000003', 'a1000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 1, 'Sofortmaßnahmen', 'TLS auf allen Payment-Verbindungen erzwingen', 'open', NULL),
('b1000000-0000-0000-0014-000000000004', 'a1000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 1, 'Sofortmaßnahmen', 'WAF vor Backend schalten', 'open', NULL),
('b1000000-0000-0000-0014-000000000005', 'a1000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 2, 'Hardware-Modernisierung', 'Android POS-Terminal Pilottest (10 Filialen)', 'open', NULL),
('b1000000-0000-0000-0014-000000000006', 'a1000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 2, 'Hardware-Modernisierung', 'Offline-Kassenfähigkeit implementieren', 'open', NULL),
('b1000000-0000-0000-0014-000000000007', 'a1000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 2, 'Hardware-Modernisierung', 'Incident-Response-Plan dokumentieren', 'open', NULL)
ON CONFLICT DO NOTHING;
