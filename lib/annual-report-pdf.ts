'use client';

// jsPDF est chargé à la demande seulement (lazy import dynamique).
// Économise ~280 KB dans le bundle principal pour les pages qui n'en
// ont pas besoin.
type JsPDFDoc = any;

export interface AbsenceItem {
  user_id: string;
  name: string;
  count: number;
}

export interface NewMemberItem {
  name: string;
  monthLabel: string; // ex: "Mars"
}

export interface TopAssiduousItem {
  name: string;
  attendanceRate: number; // 0-100
}

export interface AnnualReportData {
  churchName: string;
  familyName: string;
  year: number;
  /** Ex: "Juillet → Décembre 2026" ou "Année complète 2027" */
  periodLabel?: string;
  isFirstPartialYear?: boolean;
  submittedByName: string;
  // Composition
  totalMembers: number;
  membersList: { name: string; role: string }[];
  // Nouveaux
  newMembers: NewMemberItem[];
  // Absences
  totalCalls: number;
  totalAbsences: number;
  attendanceRate: number; // %
  absencesPerMember: AbsenceItem[];
  // Top assidus
  topAssiduous: TopAssiduousItem[];
  // Comparaison N-1
  prevYearAbsences: number | null;
  deltaAbsences: number | null; // peut être null si pas d'année précédente
}

const COLORS = {
  brand: [35, 74, 135] as [number, number, number],
  gray: [120, 120, 120] as [number, number, number],
  dark: [40, 40, 40] as [number, number, number],
  light: [220, 220, 220] as [number, number, number],
  gold: [201, 169, 97] as [number, number, number],
  green: [52, 199, 89] as [number, number, number],
  red: [255, 59, 48] as [number, number, number],
};

export async function generateAnnualReportPdf(data: AnnualReportData): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const doc: JsPDFDoc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const setColor = (rgb: [number, number, number]) => doc.setTextColor(...rgb);
  const setDraw = (rgb: [number, number, number]) => doc.setDrawColor(...rgb);
  const setFill = (rgb: [number, number, number]) => doc.setFillColor(...rgb);

  // ─── HEADER ─────────────────────────────────────────────
  setFill(COLORS.brand);
  doc.rect(0, 0, pageWidth, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(data.churchName, margin, 16);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const headerLabel = data.periodLabel ?? `Rapport annuel ${data.year}`;
  doc.text(headerLabel, margin, 24);
  // Filet doré
  setFill(COLORS.gold);
  doc.rect(margin, 30, 18, 0.8, 'F');

  y = 48;

  // ─── TITRE FAMILLE ──────────────────────────────────────
  setColor(COLORS.brand);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.familyName, margin, y);
  y += 7;

  setColor(COLORS.gray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Soumis par ${data.submittedByName} · ${new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    margin,
    y
  );
  y += 10;

  // ─── KPIs (3 cards horizontales) ────────────────────────
  const kpiHeight = 22;
  const kpiWidth = (contentWidth - 8) / 3;
  const kpis = [
    { label: 'MEMBRES', value: data.totalMembers.toString(), sub: `${data.newMembers.length} nouveaux` },
    {
      label: 'ASSIDUITÉ',
      value: `${data.attendanceRate}%`,
      sub: `${data.totalCalls - data.totalAbsences}/${data.totalCalls} présents`,
    },
    {
      label: 'ABSENCES',
      value: data.totalAbsences.toString(),
      sub:
        data.deltaAbsences != null
          ? `${data.deltaAbsences > 0 ? '+' : ''}${data.deltaAbsences} vs ${data.year - 1}`
          : 'cette année',
    },
  ];
  kpis.forEach((k, i) => {
    const x = margin + i * (kpiWidth + 4);
    setFill([248, 248, 250]);
    doc.roundedRect(x, y, kpiWidth, kpiHeight, 2, 2, 'F');
    setColor(COLORS.gray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(k.label, x + 4, y + 5);
    setColor(COLORS.brand);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(k.value, x + 4, y + 13);
    setColor(COLORS.gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(k.sub, x + 4, y + 19);
  });
  y += kpiHeight + 10;

  // ─── SECTION HELPER ─────────────────────────────────────
  const section = (title: string) => {
    ensureSpace(14);
    setDraw(COLORS.light);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
    setColor(COLORS.brand);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 7;
  };

  // ─── NOUVEAUX MEMBRES ───────────────────────────────────
  section('NOUVEAUX MEMBRES');
  setColor(COLORS.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (data.newMembers.length === 0) {
    setColor(COLORS.gray);
    doc.text('Aucun nouveau membre cette année.', margin + 2, y);
    y += 6;
  } else {
    data.newMembers.forEach((m) => {
      ensureSpace(5);
      doc.text(`• ${m.name}`, margin + 2, y);
      setColor(COLORS.gray);
      doc.text(m.monthLabel, pageWidth - margin - 30, y);
      setColor(COLORS.dark);
      y += 5;
    });
  }
  y += 4;

  // ─── TOP 3 ASSIDUS ──────────────────────────────────────
  if (data.topAssiduous.length > 0) {
    section('TOP 3 DES PLUS ASSIDUS');
    data.topAssiduous.forEach((t, i) => {
      ensureSpace(6);
      const medals = ['🥇', '🥈', '🥉'];
      // jsPDF natif ne gère pas bien les emojis → on remplace par rang
      doc.setFont('helvetica', 'bold');
      setColor(COLORS.gold);
      doc.text(`#${i + 1}`, margin + 2, y);
      setColor(COLORS.dark);
      doc.setFont('helvetica', 'normal');
      doc.text(t.name, margin + 14, y);
      setColor(COLORS.green);
      doc.setFont('helvetica', 'bold');
      doc.text(`${t.attendanceRate}%`, pageWidth - margin - 18, y);
      setColor(COLORS.dark);
      doc.setFont('helvetica', 'normal');
      y += 5.5;
    });
    y += 4;
  }

  // ─── TABLEAU ABSENCES ───────────────────────────────────
  section('DÉTAIL DES ABSENCES');
  if (data.absencesPerMember.length === 0) {
    setColor(COLORS.gray);
    doc.setFontSize(10);
    doc.text('Aucune absence enregistrée cette année 🎉.', margin + 2, y);
    y += 6;
  } else {
    // Header tableau
    ensureSpace(8);
    setFill([245, 246, 250]);
    doc.rect(margin, y - 3, contentWidth, 7, 'F');
    setColor(COLORS.brand);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Membre', margin + 3, y + 2);
    doc.text('Absences', pageWidth - margin - 25, y + 2);
    doc.text('Taux', pageWidth - margin - 12, y + 2);
    y += 7;

    setColor(COLORS.dark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    data.absencesPerMember.forEach((a, idx) => {
      ensureSpace(6);
      if (idx % 2 === 0) {
        setFill([252, 252, 253]);
        doc.rect(margin, y - 3.5, contentWidth, 5.5, 'F');
      }
      setColor(COLORS.dark);
      doc.text(a.name, margin + 3, y);
      doc.text(a.count.toString(), pageWidth - margin - 23, y);
      const rate = data.totalCalls > 0 ? Math.round(((data.totalCalls - a.count) / data.totalCalls) * 100) : 100;
      setColor(rate >= 80 ? COLORS.green : rate >= 50 ? COLORS.gold : COLORS.red);
      doc.text(`${rate}%`, pageWidth - margin - 12, y);
      y += 5.5;
    });
  }
  y += 4;

  // ─── COMPARAISON N-1 ────────────────────────────────────
  if (data.prevYearAbsences != null) {
    section('ÉVOLUTION');
    setColor(COLORS.dark);
    doc.setFontSize(10);
    const delta = data.deltaAbsences ?? 0;
    const trend =
      delta < 0
        ? `📉 Amélioration : ${Math.abs(delta)} absences en moins qu'en ${data.year - 1}`
        : delta > 0
          ? `📈 ${delta} absences en plus qu'en ${data.year - 1}`
          : `Stable : même nombre d'absences qu'en ${data.year - 1}`;
    // jsPDF gère mal certains emojis, on enlève
    doc.text(trend.replace(/📉|📈/g, '').trim(), margin + 2, y);
    y += 5.5;
    setColor(COLORS.gray);
    doc.setFontSize(9);
    doc.text(`${data.year - 1} : ${data.prevYearAbsences} absences  |  ${data.year} : ${data.totalAbsences} absences`, margin + 2, y);
    y += 6;
  }

  // ─── COMPOSITION DÉTAILLÉE (annexe) ─────────────────────
  if (data.membersList.length > 0) {
    section('COMPOSITION COMPLÈTE');
    setColor(COLORS.dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    data.membersList.forEach((m) => {
      ensureSpace(4.5);
      doc.text(`• ${m.name}`, margin + 2, y);
      setColor(COLORS.gray);
      doc.text(m.role, pageWidth - margin - 50, y);
      setColor(COLORS.dark);
      y += 4.5;
    });
  }

  // ─── FOOTER ─────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    setColor([180, 180, 180]);
    doc.text(`Page ${i}/${totalPages} · Généré automatiquement par MonÉglise`, margin, pageHeight - 8);
  }

  return doc.output('blob');
}
