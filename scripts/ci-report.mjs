#!/usr/bin/env node
/**
 * CI Report Generator — Erzeugt einen ausführlichen Markdown-Report
 * aus den Vitest JSON-Ergebnissen für GitHub Actions Job Summary.
 *
 * Usage: node scripts/ci-report.mjs <json-path> <node-version>
 */

import { readFileSync, existsSync } from 'fs';

const jsonPath = process.argv[2] || 'test-results/results.json';
const nodeVersion = process.argv[3] || process.version;
const commitSha = process.env.GITHUB_SHA?.slice(0, 7) || 'local';
const branch = process.env.GITHUB_REF_NAME || 'local';
const runId = process.env.GITHUB_RUN_ID || '-';
const actor = process.env.GITHUB_ACTOR || 'local';

if (!existsSync(jsonPath)) {
  console.log(`⚠️ Keine Testergebnisse gefunden unter ${jsonPath}`);
  process.exit(0);
}

const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));

const total = data.numTotalTests;
const passed = data.numPassedTests;
const failed = data.numFailedTests;
const pending = data.numPendingTests;
const suites = data.numTotalTestSuites;
const suitesPassed = data.numPassedTestSuites;
const suitesFailed = data.numFailedTestSuites;
const duration = ((Date.now() - data.startTime) / 1000).toFixed(1);
const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
const overallStatus = failed === 0 ? '✅ BESTANDEN' : '❌ FEHLGESCHLAGEN';
const statusEmoji = failed === 0 ? '🟢' : '🔴';

// ── Header ──
console.log(`# ${statusEmoji} CI-Validierungsreport`);
console.log('');
console.log(`> **Commit:** \`${commitSha}\` auf \`${branch}\` | **Ausgeführt von:** ${actor} | **Run:** #${runId}`);
console.log(`> **Node.js:** ${nodeVersion} | **Zeitpunkt:** ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`);
console.log('');

// ── Gesamtergebnis ──
console.log('## Gesamtergebnis');
console.log('');
console.log(`| | Status |`);
console.log(`|---|---|`);
console.log(`| **Ergebnis** | ${overallStatus} |`);
console.log(`| **Bestehensrate** | ${passRate}% (${passed}/${total}) |`);
console.log(`| **Test-Suites** | ${suitesPassed}/${suites} bestanden |`);
console.log(`| **Laufzeit** | ${duration}s |`);
console.log('');

// ── Detaillierte Statistiken ──
console.log('## Detaillierte Statistiken');
console.log('');
console.log('| Kategorie | Anzahl | Status |');
console.log('|---|---|---|');
console.log(`| Tests bestanden | ${passed} | ✅ |`);
if (failed > 0) console.log(`| Tests fehlgeschlagen | ${failed} | ❌ |`);
if (pending > 0) console.log(`| Tests übersprungen | ${pending} | ⏭️ |`);
console.log(`| Tests gesamt | ${total} | |`);
console.log(`| Test-Suites bestanden | ${suitesPassed} | ✅ |`);
if (suitesFailed > 0) console.log(`| Test-Suites fehlgeschlagen | ${suitesFailed} | ❌ |`);
console.log(`| Test-Suites gesamt | ${suites} | |`);
console.log('');

// ── Ergebnis pro Test-Suite ──
console.log('## Ergebnis pro Test-Suite');
console.log('');
console.log('| Suite | Tests | Bestanden | Fehlgeschlagen | Dauer | Status |');
console.log('|---|---|---|---|---|---|');

for (const suite of data.testResults) {
  const name = suite.name.split('/').pop().replace('.test.ts', '');
  const sTotal = suite.assertionResults.length;
  const sPassed = suite.assertionResults.filter(t => t.status === 'passed').length;
  const sFailed = suite.assertionResults.filter(t => t.status === 'failed').length;
  const sDuration = `${Math.round(suite.endTime - suite.startTime)}ms`;
  const sIcon = sFailed > 0 ? '❌' : '✅';

  console.log(`| \`${name}\` | ${sTotal} | ${sPassed} | ${sFailed} | ${sDuration} | ${sIcon} |`);
}
console.log('');

// ── Einzelne Tests pro Suite ──
console.log('<details>');
console.log('<summary><strong>📋 Alle Einzeltests anzeigen (klicken zum Aufklappen)</strong></summary>');
console.log('');

for (const suite of data.testResults) {
  const suiteName = suite.name.split('/').pop().replace('.test.ts', '');
  const sFailed = suite.assertionResults.filter(t => t.status === 'failed').length;
  const suiteIcon = sFailed > 0 ? '❌' : '✅';
  console.log(`### ${suiteIcon} ${suiteName}`);
  console.log('');
  console.log('| Test | Describe | Dauer | Status |');
  console.log('|---|---|---|---|');

  for (const test of suite.assertionResults) {
    const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
    const describe = test.ancestorTitles?.join(' > ') || '-';
    const dur = test.duration != null ? `${Math.round(test.duration * 100) / 100}ms` : '-';
    console.log(`| ${test.title} | ${describe} | ${dur} | ${icon} |`);
  }
  console.log('');
}

console.log('</details>');
console.log('');

// ── Fehlgeschlagene Tests im Detail ──
const failedTests = data.testResults.flatMap(s =>
  s.assertionResults.filter(t => t.status === 'failed').map(t => ({
    suite: s.name.split('/').pop(),
    ...t,
  }))
);

if (failedTests.length > 0) {
  console.log('## ❌ Fehlgeschlagene Tests — Details');
  console.log('');
  for (const t of failedTests) {
    console.log(`### \`${t.suite}\` → ${t.fullName}`);
    console.log('');
    if (t.failureMessages?.length > 0) {
      console.log('```');
      for (const msg of t.failureMessages) {
        console.log(msg.split('\n').slice(0, 15).join('\n'));
      }
      console.log('```');
    }
    console.log('');
  }
}

// ── Abdeckung nach Bereich ──
console.log('## Testabdeckung nach Bereich');
console.log('');

const categories = {
  'API-Routen': [],
  'Libraries & Utils': [],
  'Stores & State': [],
  'Middleware': [],
  'Infrastruktur': [],
};

for (const suite of data.testResults) {
  const name = suite.name.split('/').pop();
  const tests = suite.assertionResults;
  if (name.includes('route') || name.includes('auth-callback')) {
    categories['API-Routen'] = [...categories['API-Routen'], ...tests];
  } else if (name.includes('lib') || name.includes('utils') || name.includes('fallback') || name.includes('analysis') || name.includes('supabase-db') || name.includes('supabase-schema')) {
    categories['Libraries & Utils'] = [...categories['Libraries & Utils'], ...tests];
  } else if (name.includes('store') || name.includes('aggregation')) {
    categories['Stores & State'] = [...categories['Stores & State'], ...tests];
  } else if (name.includes('middleware')) {
    categories['Middleware'] = [...categories['Middleware'], ...tests];
  } else if (name.includes('infra') || name.includes('setup')) {
    categories['Infrastruktur'] = [...categories['Infrastruktur'], ...tests];
  }
}

console.log('| Bereich | Tests | Bestanden | Status | Abdeckung |');
console.log('|---|---|---|---|---|');

for (const [category, tests] of Object.entries(categories)) {
  const cPassed = tests.filter(t => t.status === 'passed').length;
  const cTotal = tests.length;
  const bar = cTotal > 0 ? '█'.repeat(Math.round((cPassed / cTotal) * 10)) + '░'.repeat(10 - Math.round((cPassed / cTotal) * 10)) : '░'.repeat(10);
  const pct = cTotal > 0 ? ((cPassed / cTotal) * 100).toFixed(0) : '0';
  const icon = cPassed === cTotal && cTotal > 0 ? '✅' : cTotal === 0 ? '➖' : '❌';
  console.log(`| ${category} | ${cTotal} | ${cPassed} | ${icon} | ${bar} ${pct}% |`);
}
console.log('');

// ── Footer ──
console.log('---');
console.log(`*Report generiert am ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })} • archplanner CI*`);
