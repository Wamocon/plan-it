import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project } from '@/types';

const NAVY: [number, number, number] = [27, 58, 92];
const GRAY: [number, number, number] = [100, 100, 100];
const DARK: [number, number, number] = [40, 40, 40];
const FONT = 'helvetica';

export async function exportPdf(project: Project): Promise<void> {
  const { data, analysis } = project;
  const { risks, soll, waves, summary, score, scoreLabel } = analysis;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 22;

  const checkPage = (needed = 20) => {
    if (y + needed > pageH - 14) {
      doc.addPage();
      y = 22;
    }
  };

  const sectionTitle = (title: string) => {
    checkPage(22);
    y += 2;
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.6);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
    doc.setFont(FONT, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...NAVY);
    doc.text(title, margin, y);
    y += 8;
  };

  const subTitle = (title: string) => {
    checkPage(14);
    doc.setFont(FONT, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(title, margin, y);
    y += 6;
  };

  const bodyText = (text: string, indent = 0) => {
    doc.setFont(FONT, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(text, contentW - indent);
    checkPage(lines.length * 4.5 + 2);
    doc.text(lines, margin + indent, y);
    y += lines.length * 4.5 + 2;
  };

  // ── TITLE PAGE SECTION ──
  doc.setFont(FONT, 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text(data.projectName || 'Architektur-Analyse', margin, y);
  y += 8;
  doc.setFont(FONT, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text(
    `Kunde: ${data.clientName || '–'}   ·   Datum: ${new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    margin, y
  );
  y += 5;

  // ── 1. ZUSAMMENFASSUNG ──
  sectionTitle('1. Zusammenfassung');
  bodyText(summary);
  if (score !== undefined) {
    checkPage(10);
    const scoreColor: [number, number, number] =
      score >= 71 ? [34, 139, 34] : score >= 51 ? [217, 119, 6] : [220, 38, 38];
    doc.setFont(FONT, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...scoreColor);
    doc.text(`Architektur-Reife: ${score}/100 — ${scoreLabel || ''}`, margin, y);
    y += 8;
  }

  // ── 2. IST-ZUSTAND ──
  sectionTitle('2. Ist-Zustand');
  const fmt = (v?: string) => (v || '–').replace(/_c$/, '').replace(/,/g, ', ');
  const istData: [string, string][] = [
    ['Team', fmt(data.teamSize) !== '–' ? fmt(data.teamSize) : data.teamSizeC || '–'],
    ['Aktuelle Apps', fmt(data.appCount) !== '–' ? fmt(data.appCount) : data.appCountC || '–'],
    ['Ziel Apps', fmt(data.targetApps) !== '–' ? fmt(data.targetApps) : data.targetAppsC || '–'],
    ['Tech Stack', fmt(data.primaryStack)],
    ['Datenbank', fmt(data.database)],
    ['Hosting', fmt(data.hosting)],
    ['Code-Sharing', fmt(data.codeSharing)],
    ['CI/CD', fmt(data.cicd)],
    ['Testing', fmt(data.testing)],
    ['Monitoring', fmt(data.monitoring)],
    ['Dokumentation', fmt(data.documentation)],
    ['Branching', fmt(data.branching)],
    ['Legacy-Systeme', data.legacyApps === 'yes' ? (data.legacyDetail || 'Ja') : 'Keine'],
    ['Onboarding-Dauer', fmt(data.onboardingTime)],
  ];

  autoTable(doc, {
    startY: y,
    body: istData,
    margin: { left: margin, right: margin },
    styles: { font: FONT, fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42, fillColor: [232, 237, 242] as [number, number, number] },
      1: { cellWidth: contentW - 42 },
    },
    theme: 'grid',
    tableLineColor: [200, 210, 220] as [number, number, number],
    tableLineWidth: 0.3,
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── 3. RISIKO-ANALYSE ──
  sectionTitle('3. Risiko-Analyse');
  if (risks.length === 0) {
    bodyText('Keine Risiken identifiziert.');
  } else {
    for (const risk of risks) {
      const sevColor: [number, number, number] =
        risk.severity === 'high' ? [220, 38, 38] : risk.severity === 'medium' ? [217, 119, 6] : [37, 99, 235];
      const sevLabel = risk.severity === 'high' ? 'HOCH' : risk.severity === 'medium' ? 'MITTEL' : 'NIEDRIG';
      checkPage(28);

      // Severity badge + title
      doc.setFillColor(...sevColor);
      doc.roundedRect(margin, y - 3.5, doc.getTextWidth(` ${sevLabel} `) + 2, 5.5, 1, 1, 'F');
      doc.setFont(FONT, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(sevLabel, margin + 1.5, y);
      const badgeW = doc.getTextWidth(` ${sevLabel} `) + 4;

      doc.setFont(FONT, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...NAVY);
      doc.text(risk.title, margin + badgeW, y);
      y += 6;

      bodyText(risk.description);

      // Empfehlung-Label (ASCII-safe, kein Unicode-Pfeil)
      doc.setFont(FONT, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(60, 100, 60);
      const recLabel = 'Empfehlung: ';
      const recLabelW = doc.getTextWidth(recLabel);
      doc.setFillColor(60, 100, 60);
      doc.rect(margin, y - 2.5, 2, 4, 'F');
      doc.text(recLabel, margin + 3.5, y);
      doc.setFont(FONT, 'normal');
      doc.setTextColor(...DARK);
      const recLines = doc.splitTextToSize(risk.recommendation, contentW - recLabelW - 3.5);
      checkPage(recLines.length * 4.5 + 8);
      doc.text(recLines, margin + 3.5 + recLabelW, y);
      y += recLines.length * 4.5 + 7;
    }
  }

  // ── 4. SOLL-ZUSTAND ──
  sectionTitle('4. Soll-Zustand');
  for (const item of soll) {
    checkPage(12);
    // Bullet als gefuelltes Rechteck (Soll-Zustand)
    doc.setFillColor(58, 166, 118);
    doc.rect(margin, y - 2.5, 2, 4, 'F');
    doc.setFont(FONT, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    const areaText = `${item.area}: `;
    doc.text(areaText, margin + 4, y);
    doc.setFont(FONT, 'normal');
    doc.setTextColor(...DARK);
    const areaW = doc.getTextWidth(areaText);
    const targetLines = doc.splitTextToSize(item.target, contentW - areaW - 4);
    doc.text(targetLines, margin + 4 + areaW, y);
    y += targetLines.length * 4.5 + 3;
  }

  // ── 5. UMSETZUNGSPLAN ──
  sectionTitle('5. Umsetzungsplan (Wellen)');
  for (const wave of waves) {
    subTitle(`Welle ${wave.number}: ${wave.title}  (${wave.duration})`);
    for (const item of wave.items) {
      checkPage(7);
      // Bullet als gefuelltes Rechteck (Wellen)
      doc.setFillColor(46, 117, 182);
      doc.rect(margin + 2, y - 2.5, 2, 4, 'F');
      doc.setFont(FONT, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      const itemLines = doc.splitTextToSize(item, contentW - 8);
      doc.text(itemLines, margin + 7, y);
      y += itemLines.length * 4.5 + 1.5;
    }
    y += 4;
  }

  // ── Logo laden ──
  let logoDataUrl: string | null = null;
  try {
    const resp = await fetch('/wamocon-logo.png');
    if (resp.ok) {
      const blob = await resp.blob();
      logoDataUrl = await new Promise<string>(res => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
  } catch { /* Logo nicht verfügbar */ }

  // ── HEADER + FOOTER auf allen Seiten ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Header: Adresstext links
    doc.setFont(FONT, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text('WAMOCON GmbH, Mergenthalerallee 79-81, 65760 Eschborn', margin, 8.5);

    // Header: Logo rechts
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', pageW - margin - 28, 1.5, 28, 14);
    }

    // Header: untere Trennlinie
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageW - margin, 14);

    // Footer: obere Trennlinie
    doc.line(margin, pageH - 10, pageW - margin, pageH - 10);

    // Footer: nur Seitenzahl rechts
    doc.setFont(FONT, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`${i}`, pageW - margin, pageH - 5.5, { align: 'right' });
  }

  doc.save(`${(data.projectName || 'analyse').replace(/\s+/g, '_')}_WAMOCON_Analyse.pdf`);
}
