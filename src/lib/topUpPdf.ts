import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import type { TopUpFundAllocation, TopUpResult } from '../types';
import kafLogoUrl from '../assets/kaf-logo.jpg';

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

function fmtAccessDate(iso: string | null | undefined): string {
  const d = parseIso(iso);
  if (!d) return '';
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function fmtTodayAccess(): string {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function esc(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function suggestedTopUpPdfName(report: Pick<TopUpResult, 'employeeNumber' | 'topUpDate'>): string {
  const [year, month, day] = (report.topUpDate ?? '').split('-');
  return `TopUp_${report.employeeNumber}_${year ?? ''}_${month ?? ''}_${day ?? ''}.pdf`;
}

function emptyFund(fund: number): TopUpFundAllocation {
  return {
    fund,
    unitPrice: 0,
    eeValue: 0,
    veeValue: 0,
    erValue: 0,
    eeUnits: 0,
    veeUnits: 0,
    erUnits: 0,
  };
}

function fundsOf(report: TopUpResult): TopUpFundAllocation[] {
  const byFund = new Map((report.funds ?? []).map((row) => [row.fund, row]));
  return Array.from({ length: 10 }, (_, i) => byFund.get(i + 1) ?? emptyFund(i + 1));
}

async function loadAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  return Promise.all(images.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.addEventListener('load', () => resolve(), { once: true });
      img.addEventListener('error', () => resolve(), { once: true });
    });
  })).then(() => undefined);
}

function box(n: number): string {
  return `<div class="box">${fmtNum(n)}</div>`;
}

function summaryRow(label: string, value: number): string {
  return `
    <div class="sum-row">
      <div class="sum-lab">${esc(label)}</div>
      ${box(value)}
    </div>
  `;
}

function infoRow(label: string, value: string): string {
  return `
    <div class="info-row">
      <div class="info-lab">${esc(label)}</div>
      <div class="info-val">${esc(value)}</div>
    </div>
  `;
}

function fundTable(
  title: string,
  funds: TopUpFundAllocation[],
  kind: 'units' | 'values',
): string {
  const heads = funds.map((fund) => `<th>Fund ${fund.fund}</th>`).join('');
  const row = (
    label: string,
    pick: (fund: TopUpFundAllocation) => number,
    total = false,
  ) => `
    <tr class="${total ? 'total-row' : ''}">
      <td class="lab">${esc(label)}</td>
      ${funds.map((fund) => `<td>${box(pick(fund))}</td>`).join('')}
    </tr>
  `;
  const body = kind === 'units'
    ? `
      ${row('EE Units Movement', (f) => f.eeUnits)}
      ${row('VEE Units Movement', (f) => f.veeUnits)}
      ${row('ER Units Movement', (f) => f.erUnits)}
      ${row('Total Units Movement', (f) => f.eeUnits + f.veeUnits + f.erUnits, true)}
      ${row('Unit Price', (f) => f.unitPrice)}
    `
    : `
      ${row('EE Value Movement', (f) => f.eeValue)}
      ${row('VEE Value Movement', (f) => f.veeValue)}
      ${row('ER Value Movement', (f) => f.erValue)}
      ${row('Total Value Movement', (f) => f.eeValue + f.veeValue + f.erValue, true)}
    `;
  return `
    <div class="section-title">${esc(title)}</div>
    <table class="fund-table">
      <thead>
        <tr>
          <th></th>
          ${heads}
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function page1(report: TopUpResult, logoSrc: string): string {
  return `
    <div class="topup-page">
      <div class="report-body">
        <img class="logo" src="${logoSrc}" alt="KAF" />
        <div class="addr">Address</div>
        <div class="phone">Phone Number</div>
        <div class="title">Top Up Summary</div>
        <div class="date-lab">Date</div>
        <div class="date-val">${esc(fmtTodayAccess())}</div>

        <div class="info">
          ${infoRow('For:', report.employeeName ?? '')}
          ${infoRow('National ID:', report.nationalId ?? '')}
          ${infoRow('Contract Number:', report.employeeNumber ?? '')}
          ${infoRow('Category:', report.category ?? '')}
          ${infoRow('Pension Start Date:', fmtAccessDate(report.pensionStartDate))}
          ${infoRow('Top Up Date:', fmtAccessDate(report.topUpDate))}
        </div>

        <div class="client">
          <div class="client-head">
            <div class="section-title" style="margin:0">Client Summary:</div>
            <div class="currency">${esc(report.currency || 'EGP')}</div>
          </div>
          ${summaryRow('Top Up Employee', report.topUpEE)}
          ${summaryRow('Top Up VEE', report.topUpVEE)}
          ${summaryRow('Top Up Employer', report.topUpER)}
          ${summaryRow('IMC Employee', report.imcEe)}
          ${summaryRow('IMC VEE', report.imcVee)}
          ${summaryRow('IMC Employer', report.imcEr)}
          ${summaryRow('Top Up Charges Employee', report.chargesEe)}
          ${summaryRow('Top Up Charges VEE', report.chargesVee)}
          ${summaryRow('Top Up Charges Employer', report.chargesEr)}
          ${summaryRow('Transactional EE Value', report.transactionalEe)}
          ${summaryRow('Transactional VEE Value', report.transactionalVee)}
          ${summaryRow('Transactional ER Value', report.transactionalEr)}
          <div class="sum-line"></div>
          ${summaryRow('Total EE Value', report.totalEeValue)}
          ${summaryRow('Total VEE Value', report.totalVeeValue)}
          ${summaryRow('Total ER Value', report.totalErValue)}
        </div>
      </div>
    </div>
  `;
}

function page2(report: TopUpResult): string {
  const funds = fundsOf(report);
  return `
    <div class="topup-page">
      <div class="report-body">
        ${fundTable('Fund Manager Movement Summary', funds.slice(0, 5), 'units')}
        <div style="height:28px"></div>
        ${fundTable('', funds.slice(5, 10), 'units')}
      </div>
    </div>
  `;
}

function page3(report: TopUpResult): string {
  const funds = fundsOf(report);
  return `
    <div class="topup-page">
      <div class="report-body">
        ${fundTable('Funds', funds.slice(0, 5), 'values')}
        <div style="height:28px"></div>
        ${fundTable('', funds.slice(5, 10), 'values')}
      </div>
    </div>
  `;
}

const PAGE_CSS = `
  .topup-page {
    width: 794px;
    min-height: 1123px;
    box-sizing: border-box;
    background: #fff;
    color: #111;
    font-family: Arial, "Segoe UI", Tahoma, sans-serif;
    position: relative;
  }
  .report-body {
    position: relative;
    width: 744px;
    min-height: 1052px;
    margin: 26px auto 0;
  }
  .logo {
    position: absolute;
    left: 0;
    top: 0;
    width: 50px;
    height: 50px;
    object-fit: contain;
  }
  .addr, .phone {
    position: absolute;
    left: 0;
    font-size: 11px;
  }
  .addr { top: 56px; }
  .phone { top: 76px; }
  .title {
    position: absolute;
    left: 0;
    right: 0;
    top: 8px;
    text-align: center;
    font-size: 22px;
    font-weight: 700;
  }
  .date-lab, .date-val {
    position: absolute;
    top: 8px;
    font-size: 11px;
  }
  .date-lab { right: 118px; }
  .date-val { right: 0; width: 110px; text-align: right; }
  .info {
    position: absolute;
    right: 0;
    top: 110px;
    width: 310px;
  }
  .info-row {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-bottom: 6px;
    font-size: 11px;
  }
  .info-lab { font-weight: 700; white-space: nowrap; }
  .info-val { min-width: 150px; text-align: left; }
  .client {
    position: absolute;
    left: 0;
    top: 320px;
    width: 420px;
  }
  .client-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 10px;
  }
  .currency {
    font-size: 11px;
    font-weight: 700;
    width: 120px;
    text-align: center;
  }
  .section-title {
    font-size: 14px;
    font-weight: 700;
    margin: 0 0 10px;
  }
  .sum-row {
    display: grid;
    grid-template-columns: 1fr 120px;
    gap: 10px;
    align-items: center;
    margin-bottom: 5px;
  }
  .sum-lab { font-size: 11px; font-weight: 700; }
  .sum-line {
    border-top: 1px solid #111;
    margin: 8px 0 8px 0;
  }
  .box {
    border: 1px solid #8a8a8a;
    background: #fff;
    text-align: right;
    padding: 3px 6px;
    font-size: 11px;
    min-height: 18px;
    box-sizing: border-box;
  }
  .fund-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 8px 5px;
  }
  .fund-table th {
    font-size: 11px;
    font-weight: 700;
    text-align: center;
  }
  .fund-table td { vertical-align: middle; }
  .fund-table .lab {
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    width: 170px;
  }
  .total-row td { padding-top: 8px; }
`;

export async function buildTopUpPdf(report: TopUpResult): Promise<Blob> {
  const logoSrc = await loadAsDataUrl(kafLogoUrl);
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.left = '-10000px';
  root.style.top = '0';
  root.style.width = '794px';
  root.style.background = '#ffffff';
  root.style.zIndex = '-1';
  root.innerHTML = `
    <style>${PAGE_CSS}</style>
    ${page1(report, logoSrc)}
    ${page2(report)}
    ${page3(report)}
  `;
  document.body.appendChild(root);
  try {
    await waitForImages(root);
    const pages = Array.from(root.querySelectorAll('.topup-page'));
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    for (let i = 0; i < pages.length; i += 1) {
      const canvas = await html2canvas(pages[i] as HTMLElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      const img = canvas.toDataURL('image/png');
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      if (i > 0) doc.addPage();
      doc.addImage(img, 'PNG', 0, 0, pageW, pageH);
    }
    return doc.output('blob');
  } finally {
    root.remove();
  }
}

export async function buildBulkTopUpWorkbook(_companyNumber: string, posted: TopUpResult[]): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('TopUp');
  sheet.addRow([
    'Employee_Number',
    'Company_Number',
    'Payment_Date',
    'TopUp_EE',
    'TopUp_VEE',
    'TopUp_ER',
    'Transactional_EE_Value',
    'Transactional_VEE_Value',
    'Transactional_ER_Value',
    'Transactional_Total_Value',
  ]);
  for (const row of posted) {
    sheet.addRow([
      row.employeeNumber,
      row.companyNumber,
      row.topUpDate,
      row.topUpEE,
      row.topUpVEE,
      row.topUpER,
      row.transactionalEe,
      row.transactionalVee,
      row.transactionalEr,
      row.transactionalTotal,
    ]);
  }
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
