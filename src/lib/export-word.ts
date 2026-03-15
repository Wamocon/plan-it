import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopPosition,
  TabStopType,
  TextRun,
  WidthType,
} from 'docx';
import { Project } from '@/types';

const FONT = 'Arial Narrow';
const NAVY = '1B3A5C';
const GREEN = '3AA676';

// ── Paragraph helpers ──

function h1(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32, font: FONT, color: NAVY })],
    spacing: { before: 480, after: 200 },
    border: { bottom: { color: NAVY, style: BorderStyle.SINGLE, size: 8, space: 4 } },
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, font: FONT, color: NAVY })],
    spacing: { before: 320, after: 120 },
  });
}

function body(text: string, opts?: { bold?: boolean; color?: string; size?: number }): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: opts?.size ?? 24, font: FONT, bold: opts?.bold, color: opts?.color })],
    spacing: { after: 120 },
  });
}

function bullet(text: string, labelColor = GREEN): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: '▸  ', size: 24, font: FONT, color: labelColor }),
      new TextRun({ text, size: 24, font: FONT }),
    ],
    indent: { left: 360 },
    spacing: { after: 80 },
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 120 } });
}

// ── Header / Footer ──

function buildHeader(logoBuffer: ArrayBuffer): Header {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: 'WAMOCON GmbH, Mergenthalerallee 79-81, 65760 Eschborn', size: 16, font: FONT, color: '888888' }),
          new TextRun({ text: '\t' }),
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 100, height: 50 },
            type: 'png',
          }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        border: { bottom: { color: 'CCCCCC', style: BorderStyle.SINGLE, size: 4, space: 4 } },
        spacing: { after: 120 },
      }),
    ],
  });
}

function buildFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ children: [PageNumber.CURRENT], size: 20, font: FONT, color: '888888' }),
        ],
        alignment: AlignmentType.RIGHT,
        border: { top: { color: 'CCCCCC', style: BorderStyle.SINGLE, size: 4, space: 4 } },
      }),
    ],
  });
}

// ── Ist-Zustand Tabelle ──

function buildIstTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([key, val]) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: key, bold: true, size: 20, font: FONT })] })],
              width: { size: 28, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'auto', fill: 'E8EDF2' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: val, size: 20, font: FONT })] })],
              width: { size: 72, type: WidthType.PERCENTAGE },
            }),
          ],
        })
    ),
  });
}

// ── Main export ──

export async function exportWord(project: Project): Promise<void> {
  // Logo laden
  let logoBuffer: ArrayBuffer = new ArrayBuffer(0);
  try {
    const resp = await fetch('/wamocon-logo.png');
    if (resp.ok) logoBuffer = await resp.arrayBuffer();
  } catch { /* Logo nicht verfügbar */ }

  const { data, analysis } = project;
  const { risks, soll, waves, summary, score, scoreLabel } = analysis;
  const fmt = (v?: string) => (v || '–').replace(/_c$/, '').replace(/,/g, ', ');
  const dateStr = new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });

  const children: (Paragraph | Table)[] = [];

  // ── Cover ──
  children.push(
    new Paragraph({
      children: [new TextRun({ text: data.projectName || 'Architektur-Analyse', bold: true, size: 52, font: FONT, color: NAVY })],
      spacing: { after: 160 },
    })
  );
  children.push(body(`Kunde: ${data.clientName || '–'}`, { color: '555555' }));
  children.push(body(`Erstellt am: ${dateStr}`, { color: '555555' }));
  children.push(body(`Analysetyp: ${analysis.source === 'ai' ? 'KI-gestützte Analyse' : 'Regelbasierte Analyse'}`, { color: '555555' }));
  children.push(emptyLine());

  // ── 1. Zusammenfassung ──
  children.push(h1('1. Zusammenfassung'));
  children.push(body(summary));
  if (score !== undefined) {
    const scoreColor = score >= 71 ? '226B22' : score >= 51 ? 'D97706' : 'DC2626';
    children.push(emptyLine());
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Architektur-Reife-Score: ', bold: true, size: 24, font: FONT }),
          new TextRun({ text: `${score}/100`, bold: true, size: 28, font: FONT, color: scoreColor }),
          new TextRun({ text: `  —  ${scoreLabel || ''}`, size: 24, font: FONT, color: scoreColor }),
        ],
        spacing: { after: 120 },
      })
    );
  }
  children.push(emptyLine());

  // ── 2. Ist-Zustand ──
  children.push(h1('2. Ist-Zustand'));
  const istRows: [string, string][] = [
    ['Team', fmt(data.teamSize) !== '–' ? fmt(data.teamSize) : (data.teamSizeC || '–')],
    ['Aktuelle Apps', fmt(data.appCount) !== '–' ? fmt(data.appCount) : (data.appCountC || '–')],
    ['Ziel Apps', fmt(data.targetApps) !== '–' ? fmt(data.targetApps) : (data.targetAppsC || '–')],
    ['Tech Stack', fmt(data.primaryStack)],
    ['Datenbank', fmt(data.database)],
    ['Hosting', fmt(data.hosting)],
    ['Code-Sharing', fmt(data.codeSharing)],
    ['Design System', fmt(data.designSystem)],
    ['CI/CD', fmt(data.cicd)],
    ['Testing', fmt(data.testing)],
    ['Monitoring', fmt(data.monitoring)],
    ['Dokumentation', fmt(data.documentation)],
    ['Branching', fmt(data.branching)],
    ['Legacy-Systeme', data.legacyApps === 'yes' ? (data.legacyDetail || 'Ja') : 'Keine'],
    ['Onboarding-Dauer', fmt(data.onboardingTime)],
  ];
  children.push(buildIstTable(istRows));
  children.push(emptyLine());

  // ── 3. Risiko-Analyse ──
  children.push(h1('3. Risiko-Analyse'));
  if (risks.length === 0) {
    children.push(body('Keine Risiken identifiziert.'));
  } else {
    for (const risk of risks) {
      const sevColor = risk.severity === 'high' ? 'DC2626' : risk.severity === 'medium' ? 'D97706' : '2563EB';
      const sevLabel = risk.severity === 'high' ? '▲ HOCH' : risk.severity === 'medium' ? '◆ MITTEL' : '● NIEDRIG';
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${sevLabel}  `, bold: true, size: 22, font: FONT, color: sevColor }),
            new TextRun({ text: risk.title, bold: true, size: 26, font: FONT, color: NAVY }),
          ],
          spacing: { before: 240, after: 100 },
        })
      );
      children.push(body(risk.description));
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '→ Empfehlung: ', bold: true, size: 24, font: FONT, color: '2D6A2D' }),
            new TextRun({ text: risk.recommendation, size: 24, font: FONT }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  }
  children.push(emptyLine());

  // ── 4. Soll-Zustand ──
  children.push(h1('4. Soll-Zustand'));
  for (const item of soll) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '▸  ', size: 24, font: FONT, color: GREEN }),
          new TextRun({ text: `${item.area}: `, bold: true, size: 24, font: FONT, color: NAVY }),
          new TextRun({ text: item.target, size: 24, font: FONT }),
        ],
        indent: { left: 240 },
        spacing: { after: 100 },
      })
    );
  }
  children.push(emptyLine());

  // ── 5. Umsetzungsplan ──
  children.push(h1('5. Umsetzungsplan (Wellen)'));
  for (const wave of waves) {
    children.push(h2(`Welle ${wave.number}: ${wave.title}  (${wave.duration})`));
    for (const item of wave.items) {
      children.push(bullet(item, '2E75B6'));
    }
    children.push(emptyLine());
  }

  // ── Build Document ──
  const doc = new Document({
    sections: [
      {
        properties: {},
        headers: { default: buildHeader(logoBuffer) },
        footers: { default: buildFooter() },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(data.projectName || 'analyse').replace(/\s+/g, '_')}_WAMOCON_Analyse.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
