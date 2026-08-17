import { jsPDF } from 'jspdf';
import type { EmployeeFundsWithdrawalEstimate, WithdrawalRow } from '../types';
import kafLogoUrl from '../assets/kaf-logo.jpg';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const numFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtNum(n: number | null | undefined): string {
  return numFmt.format(n ?? 0);
}

function parseIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function fmtAccessShort(iso: string | null | undefined): string {
  const d = parseIso(iso);
  if (!d) return '';
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function fmtWeekdayDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

type Amounts = Record<number, { ee: number; vee: number; er: number }>;

function rowFor(rows: WithdrawalRow[], fund: number): WithdrawalRow {
  return rows.find((r) => r.fund === fund) ?? {
    fund,
    employeeFundUnits: 0,
    voluntaryEmployeeFundUnits: 0,
    employerFundUnits: 0,
    unitPrice: 0,
    employeeFundTotal: 0,
    voluntaryEmployeeFundTotal: 0,
    employerFundTotal: 0,
    availableEmployeeFund: 0,
    availableVoluntaryEmployeeFund: 0,
    availableEmployerFund: 0,
  };
}

function boxedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  doc.setDrawColor(150);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, w, h, 'FD');
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(text, x + w - 3, y + h - 4, { align: 'right' });
}

function boxedNum(doc: jsPDF, n: number, x: number, y: number, w: number, h: number) {
  boxedText(doc, fmtNum(n), x, y, w, h);
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

export async function buildWithdrawalPdf(
  estimate: EmployeeFundsWithdrawalEstimate,
  amounts: Amounts,
): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 36;
  const rows = estimate.rows ?? [];
  const funds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const takeEe = funds.reduce((s, f) => s + (amounts[f]?.ee ?? 0), 0);
  const takeVee = funds.reduce((s, f) => s + (amounts[f]?.vee ?? 0), 0);
  const takeEr = funds.reduce((s, f) => s + (amounts[f]?.er ?? 0), 0);
  const remainingEe = (estimate.totalEmployeeFund ?? 0) - takeEe;
  const remainingVee = (estimate.totalVoluntaryEmployeeFund ?? 0) - takeVee;
  const remainingEr = (estimate.totalEmployerFund ?? 0) - takeEr;

  try {
    const logo = await loadKafLogo();
    doc.addImage(logo, 'JPEG', margin, 16, 28, 28);
  } catch {
    doc.setFillColor(107, 2, 125);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(107, 2, 125);
    doc.text('K', margin + 10, 36, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date: ${fmtWeekdayDate(new Date())}`, pageW - margin, 32, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Top Up Summary', pageW / 2, 70, { align: 'center' });

  const info = [
    ['For', estimate.employeeName ?? ''],
    ['National ID', estimate.nationalId ?? ''],
    ['Contract Number', estimate.companyNumber ?? ''],
    ['Category', estimate.category ?? ''],
    ['Pension Start Date', fmtAccessShort(estimate.pensionStartDate)],
    ['Top Up Date', fmtAccessShort(estimate.withdrawalDate)],
  ];
  let infoY = 92;
  info.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${label}:`, pageW - margin - 210, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, pageW - margin, infoY, { align: 'right' });
    infoY += 13;
  });

  let y = 180;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Client Summary:', margin, y);
  doc.text(estimate.currency || 'EGP', pageW - margin - 8, y, { align: 'right' });
  y += 10;

  const boxW = 118;
  const boxH = 16;
  const boxX = pageW - margin - boxW;
  const summaryRows: [string, number][] = [
    ['Withdrawal Employee', takeEe],
    ['Withdrawal VEE', takeVee],
    ['Withdrawal Employer', takeEr],
    ['Withdrawal Charges Employee', estimate.charges?.ee ?? 0],
    ['Withdrawal Charges VEE', estimate.charges?.voluntaryEE ?? 0],
    ['Withdrawal Charges Employer', estimate.charges?.er ?? 0],
    ['Transactional EE Value', -takeEe],
    ['Transactional VEE Value', -takeVee],
    ['Transactional ER Value', -takeEr],
    ['Total Remaining EE Value', remainingEe],
    ['Total Remaining VEE Value', remainingVee],
    ['Total Remaining ER Value', remainingEr],
  ];
  summaryRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, margin, y + 12);
    boxedNum(doc, value, boxX, y, boxW, boxH);
    y += boxH + 4;
  });

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Fund Manager Movement Summary:', margin, y);
  y += 16;
  doc.setFontSize(10);
  doc.text('Units:', margin, y);
  y += 8;

  const movement = funds.map((f) => {
    const row = rowFor(rows, f);
    const price = row.unitPrice ?? 0;
    const eeVal = amounts[f]?.ee ?? 0;
    const veeVal = amounts[f]?.vee ?? 0;
    const erVal = amounts[f]?.er ?? 0;
    const eeUnits = price === 0 ? 0 : -eeVal / price;
    const veeUnits = price === 0 ? 0 : -veeVal / price;
    const erUnits = price === 0 ? 0 : -erVal / price;
    return {
      eeUnits,
      veeUnits,
      erUnits,
      totalUnits: eeUnits + veeUnits + erUnits,
      unitPrice: price,
      eeVal: -eeVal,
      veeVal: -veeVal,
      erVal: -erVal,
      totalVal: -(eeVal + veeVal + erVal),
    };
  });

  const drawFundBlock = (
    startY: number,
    from: number,
    to: number,
    unitMode: boolean,
  ): number => {
    const labelW = 128;
    const gap = 4;
    const cols = to - from + 1;
    const cellW = (pageW - margin * 2 - labelW - gap * (cols - 1)) / cols;
    const cellH = 16;
    let rowY = startY;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    for (let i = 0; i < cols; i += 1) {
      const x = margin + labelW + i * (cellW + gap);
      doc.text(`Fund ${from + i}`, x + cellW / 2, rowY + cellH - 4, { align: 'center' });
    }
    rowY += cellH + 4;

    const unitRows: [string, (m: typeof movement[number]) => number, boolean][] = [
      ['EE Units Movement', (m) => m.eeUnits, false],
      ['VEE Units Movement', (m) => m.veeUnits, false],
      ['ER Units Movement', (m) => m.erUnits, false],
      ['Total Units Movement', (m) => m.totalUnits, true],
      ['Unit Price', (m) => m.unitPrice, false],
    ];
    const valueRows: [string, (m: typeof movement[number]) => number, boolean][] = [
      ['EE Value Movement', (m) => m.eeVal, false],
      ['VEE Value Movement', (m) => m.veeVal, false],
      ['ER Value Movement', (m) => m.erVal, false],
      ['Total Value Movement', (m) => m.totalVal, true],
    ];
    const blockRows = unitMode ? unitRows : valueRows;

    blockRows.forEach(([label, pick, lineBefore]) => {
      if (lineBefore) {
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(margin, rowY - 2, pageW - margin, rowY - 2);
        rowY += 4;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(label, margin, rowY + cellH - 4);
      for (let i = 0; i < cols; i += 1) {
        const fundIdx = from - 1 + i;
        const x = margin + labelW + i * (cellW + gap);
        boxedNum(doc, pick(movement[fundIdx]), x, rowY, cellW, cellH);
      }
      rowY += cellH + 3;
    });
    return rowY + 8;
  };

  y = drawFundBlock(y, 1, 5, true);
  if (y > 680) {
    doc.addPage();
    y = 40;
  }
  y = drawFundBlock(y, 6, 10, true);

  if (y > 620) {
    doc.addPage();
    y = 40;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Funds:', margin, y);
  y += 10;
  y = drawFundBlock(y, 1, 5, false);
  drawFundBlock(y, 6, 10, false);

  return doc.output('blob');
}
