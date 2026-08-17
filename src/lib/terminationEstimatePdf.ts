import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { EmployeeTerminationEstimate, TerminationFundRow } from '../types';

const numFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtNum(n: number | null | undefined): string {
  return numFmt.format(n ?? 0);
}

function fmtAccessDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return `${month}/${day}/${year}`;
}

function fundValues(rows: TerminationFundRow[], from: number, to: number, pick: (row: TerminationFundRow) => number): string[] {
  return rows
    .filter((row) => row.fund >= from && row.fund <= to)
    .sort((a, b) => a.fund - b.fund)
    .map((row) => fmtNum(pick(row)));
}

function drawFundBlock(
  doc: jsPDF,
  startY: number,
  titleFrom: number,
  titleTo: number,
  rows: TerminationFundRow[],
): number {
  const head = [''].concat(
    Array.from({ length: titleTo - titleFrom + 1 }, (_, i) => `Fund ${titleFrom + i}`),
  );
  const body = [
    ['EE Units', ...fundValues(rows, titleFrom, titleTo, (r) => r.eeUnits)],
    ['VEE Units', ...fundValues(rows, titleFrom, titleTo, (r) => r.veeUnits)],
    ['ER Units', ...fundValues(rows, titleFrom, titleTo, (r) => r.erUnits)],
    ['Terminated ER Units', ...fundValues(rows, titleFrom, titleTo, (r) => r.terminatedErUnits)],
    ['Total Units', ...fundValues(rows, titleFrom, titleTo, (r) => r.totalUnits)],
    ['Unit Price', ...fundValues(rows, titleFrom, titleTo, (r) => r.unitPrice)],
  ];

  autoTable(doc, {
    startY,
    head: [head],
    body,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      halign: 'right',
      textColor: 20,
      lineColor: 160,
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 20,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 110 },
    },
    margin: { left: 36, right: 36 },
  });

  const last = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
  return (last?.finalY ?? startY) + 16;
}

export function buildTerminationEstimatePdf(estimate: EmployeeTerminationEstimate): Blob {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const rows = estimate.rows ?? [];

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Estimate Employee Termination', 36, 40);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const header: [string, string][] = [
    ['Company_Number', estimate.companyNumber ?? ''],
    ['Employee_ID', estimate.employeeId == null ? '' : String(estimate.employeeId)],
    ['Employee_Number', estimate.employeeNumber ?? ''],
    ['Currency', estimate.currency ?? ''],
    ['Payment_Date', fmtAccessDate(estimate.paymentDate || estimate.terminationDate || '')],
  ];
  let y = 64;
  for (const [label, value] of header) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 36, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 160, y);
    y += 16;
  }

  y = drawFundBlock(doc, y + 8, 1, 5, rows);
  drawFundBlock(doc, y, 6, 10, rows);

  return doc.output('blob');
}
