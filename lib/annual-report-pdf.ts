'use client';

import jsPDF from 'jspdf';

interface AbsenceItem {
  user_id: string;
  name: string;
  count: number;
}

export interface AnnualReportData {
  churchName: string;
  familyName: string;
  year: number;
  submittedByName: string;
  totalAbsences: number;
  absencesSummary: AbsenceItem[];
  growthNotes: string;
  highlights: string;
}

/**
 * Génère un PDF du rapport annuel côté client (pas de serveur nécessaire).
 * Retourne un Blob qu'on upload sur Cloudinary.
 */
export function generateAnnualReportPdf(data: AnnualReportData): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // En-tête
  doc.setFillColor(35, 74, 135); // brand-600
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(data.churchName, margin, 14);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rapport annuel ${data.year}`, margin, 22);

  y = 45;

  // Famille
  doc.setTextColor(35, 74, 135);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.familyName, margin, y);
  y += 8;

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(10);
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
  y += 12;

  // Stats globales
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RÉSUMÉ DES ABSENCES', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total : ${data.totalAbsences} absence${data.totalAbsences > 1 ? 's' : ''}`, margin, y);
  y += 7;

  if (data.absencesSummary.length === 0) {
    doc.setTextColor(140, 140, 140);
    doc.text("Aucune absence enregistrée cette année.", margin, y);
    y += 8;
  } else {
    doc.setTextColor(60, 60, 60);
    for (const a of data.absencesSummary) {
      if (a.count === 0) continue;
      const text = `• ${a.name} — ${a.count} absence${a.count > 1 ? 's' : ''}`;
      doc.text(text, margin + 2, y);
      y += 5.5;
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
    }
  }

  y += 5;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Croissance
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CROISSANCE DE LA FAMILLE', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const growthLines = doc.splitTextToSize(data.growthNotes || '(non renseigné)', contentWidth);
  doc.text(growthLines, margin, y);
  y += growthLines.length * 5 + 5;

  if (y > 240) {
    doc.addPage();
    y = margin;
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Faits marquants
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FAITS MARQUANTS / TÉMOIGNAGES', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const highlightsLines = doc.splitTextToSize(data.highlights || '(non renseigné)', contentWidth);
  doc.text(highlightsLines, margin, y);
  y += highlightsLines.length * 5 + 5;

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('Généré via MonÉglise', margin, pageHeight - 10);

  return doc.output('blob');
}
