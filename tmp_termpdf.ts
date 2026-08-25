import { jsPDF } from 'jspdf';
type TerminationReport = any; type TerminationReportFundRow = any;
const kafLogoUrl = '';

/**
 * Pixel-faithful rebuild of the Access "Termination Summary" report.
 * All coordinates below are the ones extracted from the original PDF, expressed
 * in its native grid (1 grid unit = 16pt on a US-Letter portrait page).
 */
const U = 16;

// Font sizes measured from the original document.
const F_INFO = 11;      // header info + surrender charge labels
const F_TITLE = 20;     // "Termination Summary"
const F_SECTION = 16;   // "Client Summary:", "Units:", "Funds:"
const F_LABEL = 11;     // bold row / column labels
const F_NUM = 10;       // boxed numbers

const BORDER: [number, number, number] = [166, 166, 166];

const numFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmt(n: number | null | undefined): string {
  return numFmt.format(n ?? 0);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return iso;
  return `${month}/${day}/${year}`;
}

type Align = 'left' | 'right';

function put(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  size: number,
  bold: boolean,
  align: Align = 'left',
) {
  if (!text) return;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  doc.setTextColor(0);
  // The captured grid stores the glyph origin 4pt left of / 12pt above the baseline.
  doc.text(text, x * U + 4, y * U + 12, { align });
}

/** Access draws only the top and bottom rule of each value box. */
function box(doc: jsPDF, x: number, w: number, top: number, bottom: number) {
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.5);
  doc.line(x * U, top * U, (x + w) * U, top * U);
  doc.line(x * U, bottom * U, (x + w) * U, bottom * U);
}

function rule(doc: jsPDF, x: number, w: number, y: number, thick = false) {
  doc.setDrawColor(0);
  doc.setLineWidth(thick ? 1.6 : 0.5);
  doc.line(x * U, y * U, (x + w) * U, y * U);
}

let cachedLogo: string | null = null;

async function loadKafLogo(): Promise<string> {
  if (cachedLogo) return cachedLogo;
  const res = await fetch(kafLogoUrl);
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  cachedLogo = dataUrl;
  return dataUrl;
}

function rowFor(rows: TerminationReportFundRow[], fund: number): TerminationReportFundRow | undefined {
  return rows.find((r) => r.fund === fund);
}

// ── Page 1: client summary ───────────────────────────────────────
const SUMMARY_COLS = [
  { boxX: 13.414, numRight: 19.769 },
  { boxX: 21.050, numRight: 27.405 },
  { boxX: 28.080, numRight: 34.435 },
];
const SUMMARY_BOX_W = 6.775;

/** label y, box top, box bottom, value y — straight from the original. */
const SUMMARY_ROWS: { label: string; labelY: number; top: number; bottom: number; valueY: number }[] = [
  { label: 'Starting Funds', labelY: 19.310, top: 19.275, bottom: 20.348, valueY: 19.235 },
  { label: 'Total Contribution', labelY: 20.807, top: 20.772, bottom: 21.845, valueY: 20.734 },
  { label: 'Total Top Up', labelY: 22.306, top: 22.272, bottom: 23.359, valueY: 22.231 },
  { label: 'Total Withdrawal', labelY: 23.765, top: 23.725, bottom: 24.812, valueY: 23.690 },
  { label: 'Total Contribution Charges', labelY: 25.224, top: 25.185, bottom: 26.275, valueY: 25.150 },
  { label: 'Total Top Up Charges', labelY: 26.684, top: 26.649, bottom: 27.734, valueY: 26.609 },
  { label: 'Total Withdrawal Charges', labelY: 28.145, top: 28.109, bottom: 29.198, valueY: 28.070 },
  { label: 'Total Admin Charges', labelY: 29.605, top: 29.571, bottom: 30.657, valueY: 29.530 },
  { label: 'Total IMC', labelY: 31.064, top: 31.024, bottom: 32.111, valueY: 30.989 },
  { label: 'Transactional Value', labelY: 32.973, top: 32.937, bottom: 34.023, valueY: 32.898 },
  { label: 'Terminated ER Value (Non-vested)', labelY: 34.471, top: 34.435, bottom: 35.370, valueY: 34.326 },
  { label: 'Surrender Charges', labelY: 35.968, top: 35.935, bottom: 37.020, valueY: 35.893 },
];

// ── Pages 2 & 3: fund blocks ─────────────────────────────────────
const UNIT_BLOCK = {
  headerX: [11.807, 16.321, 20.832, 25.338, 29.852],
  boxX: [12.022, 16.536, 21.050, 25.554, 30.067],
  boxW: [4.295, 4.295, 4.287, 4.298, 4.295],
  numRight: [16.034, 20.547, 25.057, 29.565, 34.078],
  ruleX: 4.505,
  ruleW: 29.699,
};

const VALUE_BLOCK = {
  headerX: [11.619, 16.133, 20.644, 25.151, 29.664],
  boxX: [11.834, 16.348, 20.863, 25.366, 29.880],
  boxW: [4.298, 4.295, 4.287, 4.298, 4.295],
  numRight: [15.846, 20.358, 24.869, 29.377, 33.890],
  ruleX: 4.505,
  ruleW: 29.324,
};

type BlockRow = {
  label: string;
  labelY: number;
  top: number;
  bottom: number;
  valueY: number;
  ruleAbove?: number;
  thickRule?: boolean;
};

const UNITS_A: BlockRow[] = [
  { label: 'EE Units', labelY: 8.199, top: 8.230, bottom: 9.165, valueY: 8.124 },
  { label: 'VEE Units', labelY: 9.322, top: 9.352, bottom: 10.292, valueY: 9.247 },
  { label: 'ER Units (Vested)', labelY: 10.445, top: 10.477, bottom: 11.414, valueY: 10.370 },
  { label: 'ER Units (Non-vested)', labelY: 11.754, top: 11.788, bottom: 12.724, valueY: 11.681 },
  { label: 'Total Units', labelY: 13.066, top: 13.098, bottom: 14.038, valueY: 12.991, ruleAbove: 12.721, thickRule: true },
  { label: 'Unit Price', labelY: 14.376, top: 14.411, bottom: 15.347, valueY: 14.301, ruleAbove: 14.034, thickRule: true },
];

const UNITS_B: BlockRow[] = [
  { label: 'EE Units', labelY: 17.371, top: 17.400, bottom: 18.338, valueY: 17.296 },
  { label: 'VEE Units', labelY: 18.493, top: 18.526, bottom: 19.462, valueY: 18.419 },
  { label: 'ER Units (Vested)', labelY: 19.616, top: 19.650, bottom: 20.585, valueY: 19.541 },
  { label: 'ER Units (Non-vested)', labelY: 20.927, top: 20.962, bottom: 21.898, valueY: 20.852 },
  { label: 'Total Units', labelY: 22.237, top: 22.272, bottom: 23.202, valueY: 22.162, ruleAbove: 21.894, thickRule: true },
  { label: 'Unit Price', labelY: 23.546, top: 23.576, bottom: 24.512, valueY: 23.471, ruleAbove: 23.206, thickRule: true },
];

const VALUES_A: BlockRow[] = [
  { label: 'EE Value', labelY: 5.392, top: 5.424, bottom: 6.364, valueY: 5.317 },
  { label: 'VEE Value', labelY: 6.514, top: 6.551, bottom: 7.486, valueY: 6.439 },
  { label: 'ER Value (Vested)', labelY: 7.638, top: 7.673, bottom: 8.603, valueY: 7.563 },
  { label: 'ER Value (Non-vested)', labelY: 8.948, top: 8.977, bottom: 9.914, valueY: 8.873 },
  { label: 'Total Value', labelY: 10.258, top: 10.292, bottom: 11.189, valueY: 10.182, ruleAbove: 10.110 },
];

const VALUES_B: BlockRow[] = [
  { label: 'EE Value', labelY: 13.066, top: 13.098, bottom: 14.038, valueY: 12.991 },
  { label: 'VEE Value', labelY: 14.188, top: 14.225, bottom: 15.160, valueY: 14.113 },
  { label: 'ER Value (Vested)', labelY: 15.312, top: 15.347, bottom: 16.277, valueY: 15.237 },
  { label: 'ER Value (Non-vested)', labelY: 16.622, top: 16.651, bottom: 17.587, valueY: 16.547 },
  { label: 'Total Value', labelY: 17.931, top: 17.964, bottom: 18.863, valueY: 17.856, ruleAbove: 17.784 },
];

const UNIT_PICKERS: ((r: TerminationReportFundRow | undefined) => number)[] = [
  (r) => r?.transactionalEeUnits ?? 0,
  (r) => r?.transactionalVeeUnits ?? 0,
  (r) => r?.transactionalErUnits ?? 0,
  (r) => r?.terminatedErUnits ?? 0,
  (r) => r?.transactionalTotalUnits ?? 0,
  (r) => r?.unitPrice ?? 0,
];

const VALUE_PICKERS: ((r: TerminationReportFundRow | undefined) => number)[] = [
  (r) => r?.transactionalEeValue ?? 0,
  (r) => r?.transactionalVeeValue ?? 0,
  (r) => r?.transactionalErValue ?? 0,
  (r) => r?.terminatedErValue ?? 0,
  (r) => r?.transactionalTotalValue ?? 0,
];

function drawFundBlock(
  doc: jsPDF,
  geom: typeof UNIT_BLOCK,
  blockRows: BlockRow[],
  pickers: ((r: TerminationReportFundRow | undefined) => number)[],
  rows: TerminationReportFundRow[],
  firstFund: number,
  headerY: number,
) {
  geom.headerX.forEach((x, i) => put(doc, `Fund ${firstFund + i}`, x, headerY, F_LABEL, true));

  blockRows.forEach((row, rowIdx) => {
    if (row.ruleAbove != null) rule(doc, geom.ruleX, geom.ruleW, row.ruleAbove, row.thickRule);
    put(doc, row.label, 4.290, row.labelY, F_LABEL, true);
    for (let i = 0; i < 5; i += 1) {
      box(doc, geom.boxX[i], geom.boxW[i], row.top, row.bottom);
      const fundRow = rowFor(rows, firstFund + i);
      put(doc, fmt(pickers[rowIdx](fundRow)), geom.numRight[i], row.valueY, F_NUM, false, 'right');
    }
  });
}

export async function buildTerminationReportPdf(report: TerminationReport): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const rows = report.rows ?? [];

  const startingEe = rows.reduce((s, r) => s + r.startingEeUnits * r.unitPrice, 0);
  const startingVee = rows.reduce((s, r) => s + r.startingVeeUnits * r.unitPrice, 0);
  const startingEr = rows.reduce((s, r) => s + r.startingErUnits * r.unitPrice, 0);

  // Employee / Voluntary Employee / Employer — `null` leaves the cell blank.
  const summaryValues: (number | null)[][] = [
    [startingEe, startingVee, startingEr],
    [0, 0, 0], // Total Contribution — not returned by the API yet
    [0, 0, 0], // Total Top Up
    [0, 0, 0], // Total Withdrawal
    [0, 0, 0], // Total Contribution Charges
    [0, 0, 0], // Total Top Up Charges
    [0, 0, 0], // Total Withdrawal Charges
    [0, null, 0], // Total Admin Charges
    [0, 0, 0], // Total IMC
    [report.totalTransactionalEeValue, report.totalTransactionalVeeValue, report.totalTransactionalErValue],
    [null, null, report.totalTerminatedErValue],
    [report.surrenderChargesEe, report.surrenderChargesVee, report.surrenderChargesEr],
  ];

  // ── Page 1 ────────────────────────────────────────────────────
  try {
    const logo = await loadKafLogo();
    doc.addImage(logo, 'JPEG', 1.689 * U, 1.871 * U, 3.02 * U, 2.446 * U);
  } catch {
    /* logo is decorative — keep going without it */
  }

  put(doc, 'Date:', 24.399, 2.188, F_INFO, false);
  put(doc, new Date().toLocaleDateString('en-US'), 35.52, 2.194, F_INFO, false, 'right');

  put(doc, 'Address', 2.223, 4.434, F_INFO, false);
  put(doc, report.companyAddress ?? '', 7.0, 4.434, F_INFO, false);
  put(doc, 'Phone Number', 2.223, 5.369, F_INFO, false);
  put(doc, report.companyPhone ?? '', 7.0, 5.369, F_INFO, false);

  put(doc, 'Termination Summary', 11.431, 4.781, F_TITLE, true);

  const info: [string, number, string][] = [
    ['For:', 6.119, report.employeeName ?? ''],
    ['National ID:', 7.616, report.nationalId ?? ''],
    ['Contract Number:', 8.926, report.companyNumber ?? ''],
    ['Company Name:', 10.237, report.companyName ?? ''],
    ['Category:', 11.584, report.category ?? ''],
    ['Pension Start Date:', 12.931, fmtDate(report.pensionStartDate)],
    ['Termination Date:', 14.167, fmtDate(report.terminationDate)],
    ['Currency:', 15.477, report.currency ?? ''],
  ];
  info.forEach(([label, y, value]) => {
    put(doc, label, 23.647, y, F_INFO, false);
    put(doc, value, 35.52, y + 0.006, F_INFO, false, 'right');
  });

  put(doc, 'Client Summary:', 1.846, 16.899, F_SECTION, true);
  put(doc, 'Employee', 14.924, 17.369, F_LABEL, true);
  put(doc, 'Voluntary Employee', 20.910, 17.369, F_LABEL, true);
  put(doc, 'Employer', 29.676, 17.369, F_LABEL, true);

  SUMMARY_ROWS.forEach((row, rowIdx) => {
    put(doc, row.label, 2.060, row.labelY, F_LABEL, true);
    SUMMARY_COLS.forEach((col, colIdx) => {
      const value = summaryValues[rowIdx][colIdx];
      if (value == null) return;
      box(doc, col.boxX, SUMMARY_BOX_W, row.top, row.bottom);
      put(doc, fmt(value), col.numRight, row.valueY, F_NUM, false, 'right');
    });
  });

  rule(doc, 2.141, 32.627, 32.570);
  put(
    doc,
    'Note: Surrender charges are NOT deducted from the above fund movement',
    1.921,
    37.209,
    F_LABEL,
    true,
  );

  // ── Page 2: units ─────────────────────────────────────────────
  doc.addPage();
  put(doc, 'Fund Manager Movement Summary:', 1.659, 2.301, F_SECTION, true);
  put(doc, 'Units:', 3.539, 4.921, F_SECTION, true);
  drawFundBlock(doc, UNIT_BLOCK, UNITS_A, UNIT_PICKERS, rows, 1, 6.702);
  drawFundBlock(doc, UNIT_BLOCK, UNITS_B, UNIT_PICKERS, rows, 6, 15.872);

  // ── Page 3: funds ─────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(241, 241, 241);
  doc.rect(1.686 * U, 1.684 * U, 34.404 * U, 22.84 * U, 'F');

  put(doc, 'Funds:', 3.539, 2.113, F_SECTION, true);
  drawFundBlock(doc, VALUE_BLOCK, VALUES_A, VALUE_PICKERS, rows, 1, 3.895);
  drawFundBlock(doc, VALUE_BLOCK, VALUES_B, VALUE_PICKERS, rows, 6, 11.569);

  put(
    doc,
    'Note: Surrender charges are NOT deducted from the above fund movement',
    4.290,
    19.429,
    F_LABEL,
    true,
  );

  const surrender: [string, number, number, number, number, number][] = [
    ['Surrender Charges EE', 20.717, 20.772, 21.674, 20.665, report.surrenderChargesEe],
    ['Surrender Charges VEE', 21.841, 21.898, 22.796, 21.787, report.surrenderChargesVee],
    ['Surrender Charges ER', 22.963, 23.021, 23.913, 22.911, report.surrenderChargesEr],
  ];
  surrender.forEach(([label, labelY, top, bottom, valueY, value]) => {
    put(doc, label, 4.290, labelY, F_INFO, false);
    box(doc, 12.399, 4.520, top, bottom);
    put(doc, fmt(value), 16.634, valueY, F_NUM, false, 'right');
  });

  return doc.output('blob');
}

