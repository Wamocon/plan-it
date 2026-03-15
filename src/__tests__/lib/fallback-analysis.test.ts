/**
 * Unit-Tests für src/lib/fallback-analysis.ts
 *
 * Abdeckungsstrategie:
 *  - White-Box: interne Hilfsfunktionen (has, hasAny, countTechs, detectScale)
 *    werden indirekt über fallbackAnalysis() getestet.
 *  - Entscheidungsüberdeckung: alle Score-Kriterien (Testing, CI/CD, Monitoring,
 *    Dokumentation, Code-Sharing, Design System, Branching, Legacy, Onboarding)
 *    mit minimalen Inputs.
 *  - Pfadüberdeckung: alle 4 Skalen (small/medium/large/enterprise), jede Risiko-
 *    Bedingung, alle Soll-Zweige, alle Wellen-Skalen.
 */
import { describe, it, expect } from 'vitest';
import { fallbackAnalysis } from '@/lib/fallback-analysis';
import type { WizardData } from '@/types';

// ── Score-Label-Grenzwerte ───────────────────────────────────
// >=86 = Sehr gut, >=71 = Gut, >=51 = Mittel, >=30 = Niedrig, <31 = Kritisch
// Max-Score: testing(15)+ci(15)+monitoring(10)+doc(10)+sharing(15)+design(10)+branching(10)+noLegacy(10)+onboarding(5)=100

describe('fallbackAnalysis()', () => {
  // ────────────────────────────────────────────────────────────
  // Score-Berechnung (Entscheidungsüberdeckung je Kriterium)
  // ────────────────────────────────────────────────────────────

  describe('Score-Kriterium: Testing', () => {
    it('vergibt 15 Punkte für "comprehensive"', () => {
      const r = fallbackAnalysis({ testing: 'comprehensive' } as WizardData);
      expect(r.score).toBeGreaterThanOrEqual(15);
    });

    it('vergibt 10 Punkte für "unit"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const withUnit = fallbackAnalysis({ testing: 'unit' } as WizardData).score ?? 0;
      expect(withUnit - baseline).toBe(10);
    });

    it('vergibt 10 Punkte für "integration"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const withInt = fallbackAnalysis({ testing: 'integration' } as WizardData).score ?? 0;
      expect(withInt - baseline).toBe(10);
    });

    it('vergibt 10 Punkte für "e2e"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const withE2e = fallbackAnalysis({ testing: 'e2e' } as WizardData).score ?? 0;
      expect(withE2e - baseline).toBe(10);
    });

    it('vergibt 3 Punkte für "minimal"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const withMin = fallbackAnalysis({ testing: 'minimal' } as WizardData).score ?? 0;
      expect(withMin - baseline).toBe(3);
    });

    it('vergibt 0 Punkte wenn Testing leer', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const withEmpty = fallbackAnalysis({ testing: '' } as WizardData).score ?? 0;
      expect(withEmpty - baseline).toBe(0);
    });
  });

  describe('Score-Kriterium: CI/CD', () => {
    it('vergibt 15 Punkte für "standardized"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ cicd: 'standardized' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(15);
    });

    it('vergibt 8 Punkte für "github-actions"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ cicd: 'github-actions' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(8);
    });

    it('vergibt 8 Punkte für "gitlab-ci"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ cicd: 'gitlab-ci' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(8);
    });

    it('vergibt 8 Punkte für "jenkins"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ cicd: 'jenkins' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(8);
    });

    it('vergibt 5 Punkte für einen anderen CI-Wert (nicht none/inconsistent)', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ cicd: 'circleci' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(5);
    });

    it('vergibt 0 Punkte für "none"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ cicd: 'none' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(0);
    });

    it('vergibt 0 Punkte für "inconsistent"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ cicd: 'inconsistent' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(0);
    });
  });

  describe('Score-Kriterium: Monitoring', () => {
    it('vergibt 10 Punkte für sentry+dashboard+uptime+logging', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ monitoring: 'sentry,dashboard,uptime,logging' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(10);
    });

    it('vergibt 7 Punkte nur für sentry (ohne uptime/logging)', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ monitoring: 'sentry' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(7);
    });

    it('vergibt 7 Punkte nur für dashboard', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ monitoring: 'dashboard' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(7);
    });

    it('vergibt 4 Punkte für uptime (ohne sentry/dashboard)', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ monitoring: 'uptime' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(4);
    });

    it('vergibt 0 Punkte für "none"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ monitoring: 'none' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(0);
    });
  });

  describe('Score-Kriterium: Dokumentation', () => {
    it('vergibt 10 Punkte für adr+wiki', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ documentation: 'adr,wiki' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(10);
    });

    it('vergibt 10 Punkte für adr+storybook', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ documentation: 'adr,storybook' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(10);
    });

    it('vergibt 7 Punkte nur für adr', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ documentation: 'adr' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(7);
    });

    it('vergibt 3 Punkte für readme', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ documentation: 'readme' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(3);
    });
  });

  describe('Score-Kriterium: Code-Sharing', () => {
    it('vergibt 15 Punkte für "monorepo"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ codeSharing: 'monorepo' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(15);
    });

    it('vergibt 10 Punkte für "sharedlib"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ codeSharing: 'sharedlib' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(10);
    });

    it('vergibt 3 Punkte für "git-sub"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ codeSharing: 'git-sub' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(3);
    });
  });

  describe('Score-Kriterium: Design System', () => {
    it('vergibt 10 Punkte für "full"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ designSystem: 'full' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(10);
    });

    it('vergibt 5 Punkte für "partial"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ designSystem: 'partial' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(5);
    });

    it('vergibt 0 Punkte für "none"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ designSystem: 'none' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(0);
    });
  });

  describe('Score-Kriterium: Branching', () => {
    it('vergibt 10 Punkte für "trunk"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ branching: 'trunk' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(10);
    });

    it('vergibt 8 Punkte für "gitflow"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ branching: 'gitflow' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(8);
    });

    it('vergibt 3 Punkte für "basic"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ branching: 'basic' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(3);
    });
  });

  describe('Score-Kriterium: Legacy', () => {
    it('vergibt 10 Punkte wenn kein Legacy vorhanden (legacyApps !== yes)', () => {
      const baseline = fallbackAnalysis({ legacyApps: 'yes' } as WizardData).score ?? 0;
      const r = fallbackAnalysis({ legacyApps: 'no' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(10);
    });
  });

  describe('Score-Kriterium: Onboarding', () => {
    it('vergibt 5 Punkte für "days"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ onboardingTime: 'days' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(5);
    });

    it('vergibt 5 Punkte für "week"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ onboardingTime: 'week' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(5);
    });

    it('vergibt 2 Punkte für "weeks"', () => {
      const baseline = fallbackAnalysis({} as WizardData).score ?? 0;
      const r = fallbackAnalysis({ onboardingTime: 'weeks' } as WizardData).score ?? 0;
      expect(r - baseline).toBe(2);
    });
  });

  describe('Score-Label-Schwellenwerte', () => {
    it('liegt im Label "Sehr gut" (>=86)', () => {
      const r = fallbackAnalysis({
        testing: 'comprehensive', cicd: 'standardized', monitoring: 'sentry,dashboard,uptime,logging',
        documentation: 'adr,wiki', codeSharing: 'monorepo', designSystem: 'full',
        branching: 'trunk', legacyApps: 'no', onboardingTime: 'days',
      } as WizardData);
      expect(r.score).toBe(100);
      expect(r.scoreLabel).toBe('Sehr gut');
    });

    it('liegt im Label "Kritisch" (<31) bei leerem Input', () => {
      const r = fallbackAnalysis({} as WizardData);
      expect(r.scoreLabel).toBe('Kritisch');
    });

    it('vergibt "Gut" bei Score zwischen 71 und 85', () => {
      const r = fallbackAnalysis({
        testing: 'comprehensive', cicd: 'standardized', monitoring: 'sentry,dashboard,uptime,logging',
        documentation: 'adr,wiki', codeSharing: 'monorepo',
        branching: 'trunk', legacyApps: 'no',
      } as WizardData);
      expect(r.score).toBe(85);
      expect(r.scoreLabel).toBe('Gut');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Skalenermittlung (detectScale)
  // ────────────────────────────────────────────────────────────

  describe('detectScale()', () => {
    it('erkennt "small" für Team 1-5 und targetApps 10', () => {
      const r = fallbackAnalysis({ teamSize: '1-5', targetApps: '10' } as WizardData);
      expect(r.summary).toContain('Kleines Team');
    });

    it('erkennt "medium" für Team 5-15', () => {
      const r = fallbackAnalysis({ teamSize: '5-15', targetApps: '10' } as WizardData);
      expect(r.summary).toContain('Mittelgroßes Team');
    });

    it('erkennt "medium" durch targetApps=20', () => {
      const r = fallbackAnalysis({ teamSize: '1-5', targetApps: '20' } as WizardData);
      expect(r.summary).toContain('Mittelgroßes Team');
    });

    it('erkennt "large" für Team 15-30', () => {
      const r = fallbackAnalysis({ teamSize: '15-30', targetApps: '10' } as WizardData);
      expect(r.summary).toContain('Großes Team');
    });

    it('erkennt "enterprise" für Team 30+', () => {
      const r = fallbackAnalysis({ teamSize: '30+', targetApps: '10' } as WizardData);
      expect(r.summary).toContain('Enterprise');
    });

    it('erkennt "enterprise" durch targetApps=100', () => {
      const r = fallbackAnalysis({ teamSize: '1-5', targetApps: '100' } as WizardData);
      expect(r.summary).toContain('Enterprise');
    });

    it('nutzt teamSizeC als Fallback wenn teamSize unbekannt', () => {
      const r = fallbackAnalysis({ teamSizeC: '35' } as WizardData);
      expect(r.summary).toContain('Enterprise');
    });

    it('nutzt appCountC als Fallback wenn appCount unbekannt', () => {
      const r = fallbackAnalysis({ appCountC: '17' } as WizardData); // 17 apps → appsPerDev-Risk möglich
      expect(r).toBeDefined();
    });

    it('nutzt targetAppsC als Fallback wenn targetApps unbekannt', () => {
      const r = fallbackAnalysis({ targetAppsC: '100' } as WizardData);
      expect(r.summary).toContain('Enterprise');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Risiko-Generierung (Pfadüberdeckung je Bedingung)
  // ────────────────────────────────────────────────────────────

  describe('Risiko-Erkennung', () => {
    it('erzeugt Legacy-Risiko wenn legacyApps === "yes"', () => {
      const r = fallbackAnalysis({ legacyApps: 'yes' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Legacy'))).toBe(true);
    });

    it('erzeugt kein Legacy-Risiko wenn legacyApps !== "yes"', () => {
      const r = fallbackAnalysis({ legacyApps: 'no' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Legacy'))).toBe(false);
    });

    it('erzeugt Code-Sharing-Risiko bei "copypaste"', () => {
      const r = fallbackAnalysis({ codeSharing: 'copypaste' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Code-Sharing'))).toBe(true);
    });

    it('erzeugt Code-Sharing-Risiko bei leerem codeSharing', () => {
      const r = fallbackAnalysis({} as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Code-Sharing'))).toBe(true);
    });

    it('erzeugt kein Code-Sharing-Risiko bei "monorepo"', () => {
      const r = fallbackAnalysis({ codeSharing: 'monorepo' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Code-Sharing'))).toBe(false);
    });

    it('erzeugt Testing-Risiko bei "none"', () => {
      const r = fallbackAnalysis({ testing: 'none' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Testing'))).toBe(true);
    });

    it('erzeugt Testing-Risiko bei leerem testing', () => {
      const r = fallbackAnalysis({} as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Testing'))).toBe(true);
    });

    it('erzeugt kein Testing-Risiko bei "comprehensive"', () => {
      const r = fallbackAnalysis({ testing: 'comprehensive' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Testing'))).toBe(false);
    });

    it('erzeugt Monitoring-Risiko bei "none"', () => {
      const r = fallbackAnalysis({ monitoring: 'none' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Monitoring'))).toBe(true);
    });

    it('erzeugt kein Monitoring-Risiko bei "sentry"', () => {
      const r = fallbackAnalysis({ monitoring: 'sentry' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Monitoring'))).toBe(false);
    });

    it('erzeugt Dokumentations-Risiko bei "none"', () => {
      const r = fallbackAnalysis({ documentation: 'none' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Dokumentation'))).toBe(true);
    });

    it('erzeugt Dokumentations-Risiko bei veralteter Doku', () => {
      const r = fallbackAnalysis({ documentation: 'outdated' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Dokumentation'))).toBe(true);
    });

    it('erzeugt CI/CD-Risiko bei "inconsistent"', () => {
      const r = fallbackAnalysis({ cicd: 'inconsistent' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('CI/CD'))).toBe(true);
    });

    it('erzeugt CI/CD-Risiko bei "none"', () => {
      const r = fallbackAnalysis({ cicd: 'none' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('CI/CD'))).toBe(true);
    });

    it('erzeugt Design-System-Risiko wenn nicht vorhanden', () => {
      const r = fallbackAnalysis({ designSystem: 'none' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Design System'))).toBe(true);
    });

    it('erzeugt Onboarding-Risiko bei "weeks"', () => {
      const r = fallbackAnalysis({ onboardingTime: 'weeks' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Onboarding'))).toBe(true);
    });

    it('erzeugt Onboarding-Risiko bei "month"', () => {
      const r = fallbackAnalysis({ onboardingTime: 'month' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Onboarding'))).toBe(true);
    });

    it('erzeugt Technologie-Fragmentierungs-Risiko bei 3+ Stacks', () => {
      const r = fallbackAnalysis({ primaryStack: 'nextjs,vue,angular' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Technologie-Fragmentierung'))).toBe(true);
    });

    it('erzeugt high-Severity für Technologie-Fragmentierung bei 4+ Stacks', () => {
      const r = fallbackAnalysis({ primaryStack: 'nextjs,vue,angular,laravel' } as WizardData);
      const risk = r.risks.find(risk => risk.title.includes('Technologie-Fragmentierung'));
      expect(risk?.severity).toBe('high');
    });

    it('erzeugt Hosting-Fragmentierungs-Risiko bei 3+ Hosting-Optionen', () => {
      const r = fallbackAnalysis({ hosting: 'vercel,aws,azure' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Fragmentierte Hosting'))).toBe(true);
    });

    it('erzeugt Java/.NET+Vercel-Inkompatibilitäts-Risiko', () => {
      const r = fallbackAnalysis({ primaryStack: 'java', hosting: 'vercel' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Java/.NET'))).toBe(true);
    });

    it('erzeugt Laravel+Vercel-Risiko', () => {
      const r = fallbackAnalysis({ primaryStack: 'laravel', hosting: 'vercel' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Laravel'))).toBe(true);
    });

    it('erzeugt Git-Submodule-Risiko bei "git-sub" Code-Sharing', () => {
      const r = fallbackAnalysis({ codeSharing: 'git-sub' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Git Submodules'))).toBe(true);
    });

    it('erzeugt Branching-Risiko bei "none" und 5+ Entwicklern', () => {
      const r = fallbackAnalysis({ branching: 'none', teamSize: '5-15' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Branching'))).toBe(true);
    });

    it('erzeugt kein Branching-Risiko bei kleinem Team (<5 Entwickler)', () => {
      const r = fallbackAnalysis({ branching: 'none', teamSize: '1-5' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Branching'))).toBe(false);
    });

    it('erzeugt SQLite-Risiko bei targetApps >= 20', () => {
      const r = fallbackAnalysis({ database: 'sqlite', targetApps: '20' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('SQLite'))).toBe(true);
    });

    it('erzeugt Firebase-Risiko bei targetApps >= 50', () => {
      const r = fallbackAnalysis({ database: 'firebase', targetApps: '50' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Firebase'))).toBe(true);
    });

    it('erzeugt Strato-Risiko bei nicht-kleinen Teams', () => {
      const r = fallbackAnalysis({ hosting: 'strato', teamSize: '5-15' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Strato'))).toBe(true);
    });

    it('erzeugt kein Strato-Risiko bei kleinem Team', () => {
      const r = fallbackAnalysis({ hosting: 'strato', teamSize: '1-5' } as WizardData);
      expect(r.risks.some(risk => risk.title.includes('Strato'))).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Wellen-Generierung (4 Skalen)
  // ────────────────────────────────────────────────────────────

  describe('Wellen-Generierung', () => {
    it('generiert 5 Wellen für jeden Skalierungstyp', () => {
      const scales = [
        { teamSize: '1-5', targetApps: '10' },      // small
        { teamSize: '5-15', targetApps: '20' },     // medium
        { teamSize: '15-30', targetApps: '20' },    // large
        { teamSize: '30+', targetApps: '50' },      // enterprise
      ];
      scales.forEach(data => {
        const r = fallbackAnalysis(data as WizardData);
        expect(r.waves).toHaveLength(5);
        expect(r.waves[0].number).toBe(1);
        expect(r.waves[4].number).toBe(5);
      });
    });

    it('fügt "Legacy ablösen" zu Welle 5 hinzu wenn Legacy vorhanden', () => {
      const scales = [
        { teamSize: '1-5', targetApps: '10', legacyApps: 'yes' },
        { teamSize: '30+', targetApps: '100', legacyApps: 'yes' },
      ];
      scales.forEach(data => {
        const r = fallbackAnalysis(data as WizardData);
        const wave5 = r.waves.find(w => w.number === 5)!;
        expect(wave5.items.some(i => i.toLowerCase().includes('legacy'))).toBe(true);
      });
    });

    it('verwendet stack-spezifische Tools für Angular → Nx', () => {
      const r = fallbackAnalysis({ primaryStack: 'angular', teamSize: '5-15' } as WizardData);
      expect(r.waves[0].items.some(i => i.includes('Nx'))).toBe(true);
    });

    it('verwendet stack-spezifische Tools für Laravel → Packagist', () => {
      const r = fallbackAnalysis({ primaryStack: 'laravel', teamSize: '5-15' } as WizardData);
      // Registry-Tool für Laravel ist 'Private Packagist Registry'
      expect(r.waves[0].items.some(i => i.includes('Packagist') || i.includes('laravel') || i.toLowerCase().includes('composer'))).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Soll-Generierung
  // ────────────────────────────────────────────────────────────

  describe('Soll-Generierung', () => {
    it('enthält immer einen Tech-Stack-Soll-Eintrag', () => {
      const r = fallbackAnalysis({} as WizardData);
      expect(r.soll.some(s => s.area === 'Tech Stack')).toBe(true);
    });

    it('enthält immer einen Onboarding-Soll-Eintrag', () => {
      const r = fallbackAnalysis({} as WizardData);
      expect(r.soll.some(s => s.area === 'Onboarding')).toBe(true);
    });

    it('enthält Legacy-Soll-Eintrag wenn Legacy vorhanden', () => {
      const r = fallbackAnalysis({ legacyApps: 'yes' } as WizardData);
      expect(r.soll.some(s => s.area === 'Legacy')).toBe(true);
    });

    it('enthält keinen Legacy-Soll-Eintrag wenn kein Legacy', () => {
      const r = fallbackAnalysis({ legacyApps: 'no' } as WizardData);
      expect(r.soll.some(s => s.area === 'Legacy')).toBe(false);
    });

    it('enthält Enterprise-Governance-Eintrag bei Enterprise-Skala', () => {
      const r = fallbackAnalysis({ teamSize: '30+', targetApps: '100' } as WizardData);
      expect(r.soll.some(s => s.area === 'Governance')).toBe(true);
    });

    it('enthält Vercel-Deployment-Empfehlung wenn Vercel + nicht standardisiertes CI', () => {
      const r = fallbackAnalysis({ hosting: 'vercel', cicd: 'none' } as WizardData);
      expect(r.soll.some(s => s.area.includes('Vercel'))).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Struktur und Meta
  // ────────────────────────────────────────────────────────────

  describe('Struktur des Ergebnisses', () => {
    it('gibt immer source="fallback" zurück', () => {
      expect(fallbackAnalysis({} as WizardData).source).toBe('fallback');
    });

    it('gibt einen nicht-leeren summary-String zurück', () => {
      const r = fallbackAnalysis({ teamSize: '1-5', targetApps: '10', primaryStack: 'nextjs' } as WizardData);
      expect(typeof r.summary).toBe('string');
      expect(r.summary.length).toBeGreaterThan(0);
    });

    it('summary enthält Stack-Namen wenn primaryStack gesetzt', () => {
      const r = fallbackAnalysis({ primaryStack: 'nextjs' } as WizardData);
      expect(r.summary).toContain('Next.js');
    });

    it('summary enthält Branching-Info wenn branching gesetzt', () => {
      const r = fallbackAnalysis({ branching: 'gitflow' } as WizardData);
      expect(r.summary).toContain('gitflow');
    });

    it('gibt score als Zahl zwischen 0 und 100 zurück', () => {
      const r = fallbackAnalysis({} as WizardData);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    });
  });
});
