import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { TerminationReport, TerminationReportFundRow } from '../types';
import kafLogoUrl from '../assets/kaf-logo.jpg';

const numFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function fmtNum(n: number | null | undefined): string {
  const v = n ?? 0;
  return numFmt.format(Object.is(v, -0) ? 0 : v);
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

function emptyFund(fund: number): TerminationReportFundRow {
  return {
    fund,
    startingEeUnits: 0,
    startingVeeUnits: 0,
    startingErUnits: 0,
    startingTotalUnits: 0,
    transactionalEeUnits: 0,
    transactionalVeeUnits: 0,
    transactionalErUnits: 0,
    terminatedErUnits: 0,
    transactionalTotalUnits: 0,
    unitPrice: 0,
    transactionalEeValue: 0,
    transactionalVeeValue: 0,
    transactionalErValue: 0,
    terminatedErValue: 0,
    transactionalTotalValue: 0,
  };
}

function fundsOf(report: TerminationReport): TerminationReportFundRow[] {
  const byFund = new Map((report.rows ?? []).map((row) => [row.fund, row]));
  return Array.from({ length: 10 }, (_, i) => byFund.get(i + 1) ?? emptyFund(i + 1));
}

function box(n: number | null | undefined): string {
  const v = n == null ? '' : fmtNum(n);
  return `<div class='box'>${v}</div>`;
}

function summaryRow(label: string, value: number | null | undefined): string {
  return `
    <div class='sum-row'>
      <div class='sum-lab'>${esc(label)}</div>
      ${box(value)}
    </div>
  `;
}

function summaryRow3(label: string, ee: number | null, vee: number | null, er: number | null): string {
  return `
    <div class='sum-row-3'>
      <div class='sum-lab'>${esc(label)}</div>
      ${box(ee)}
      ${box(vee)}
      ${box(er)}
    </div>
  `;
}

function infoRow(label: string, value: string): string {
  return `
    <div class='info-row'>
      <div class='info-lab'>${esc(label)}</div>
      <div class='info-val'>${esc(value)}</div>
    </div>
  `;
}

function fundTable(title: string, funds: TerminationReportFundRow[], kind: 'units' | 'values'): string {
  const heads = funds.map((fund) => `<th>Fund ${fund.fund}</th>`).join('');
  const row = (label: string, pick: (fund: TerminationReportFundRow) => number, total = false) => `
    <tr class='${total ? 'total-row' : ''}'>
      <td class='lab'>${esc(label)}</td>
      ${funds.map((fund) => `<td>${box(pick(fund))}</td>`).join('')}
    </tr>
  `;
  const body = kind === 'units'
    ? `
      ${row('EE Units', (f) => f.transactionalEeUnits)}
      ${row('VEE Units', (f) => f.transactionalVeeUnits)}
      ${row('ER Units (Vested)', (f) => f.transactionalErUnits)}
      ${row('ER Units (Non-vested)', (f) => f.terminatedErUnits)}
      ${row('Total Units', (f) => f.transactionalTotalUnits, true)}
      ${row('Unit Price', (f) => f.unitPrice)}
    `
    : `
      ${row('EE Value', (f) => f.transactionalEeValue)}
      ${row('VEE Value', (f) => f.transactionalVeeValue)}
      ${row('ER Value (Vested)', (f) => f.transactionalErValue)}
      ${row('ER Value (Non-vested)', (f) => f.terminatedErValue)}
      ${row('Total Value', (f) => f.transactionalTotalValue, true)}
    `;
  return `
    <div class='section-title'>${esc(title)}</div>
    <table class='fund-table'>
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

function page1(report: TerminationReport, logoSrc: string): string {
  const rows = report.rows ?? [];
  const startingEe = rows.reduce((s, r) => s + r.startingEeUnits * r.unitPrice, 0);
  const startingVee = rows.reduce((s, r) => s + r.startingVeeUnits * r.unitPrice, 0);
  const startingEr = rows.reduce((s, r) => s + r.startingErUnits * r.unitPrice, 0);

  return `
    <div class='term-page'>
      <div class='report-body'>
        <img class='logo' src='${logoSrc}' alt='KAF' />
        <div class='addr'>Address</div>
        <div class='addr-val'>${esc(report.companyAddress ?? '')}</div>
        <div class='phone'>Phone Number</div>
        <div class='phone-val'>${esc(report.companyPhone ?? '')}</div>
        <div class='title'>Termination Summary</div>
        <div class='date-lab'>Date</div>
        <div class='date-val'>${esc(fmtTodayAccess())}</div>

        <div class='info'>
          ${infoRow('For:', report.employeeName ?? '')}
          ${infoRow('National ID:', report.nationalId ?? '')}
          ${infoRow('Contract Number:', report.companyNumber ?? '')}
          ${infoRow('Company Name:', report.companyName ?? '')}
          ${infoRow('Category:', report.category ?? '')}
          ${infoRow('Pension Start Date:', fmtAccessDate(report.pensionStartDate))}
          ${infoRow('Termination Date:', fmtAccessDate(report.terminationDate))}
          ${infoRow('Currency:', report.currency ?? '')}
        </div>

        <div class='client'>
          <div class='client-head'>
            <div class='section-title' style='margin:0'>Client Summary:</div>
            <div class='currency'>${esc(report.currency || 'EGP')}</div>
          </div>
          <div class='client-col-head'>
            <div></div>
            <div class='col-head'>Employee</div>
            <div class='col-head'>Voluntary Employee</div>
            <div class='col-head'>Employer</div>
          </div>
          ${summaryRow3('Starting Funds', startingEe, startingVee, startingEr)}
          ${summaryRow3('Total Contribution', 0, 0, 0)}
          ${summaryRow3('Total Top Up', 0, 0, 0)}
          ${summaryRow3('Total Withdrawal', 0, 0, 0)}
          ${summaryRow3('Total Contribution Charges', 0, 0, 0)}
          ${summaryRow3('Total Top Up Charges', 0, 0, 0)}
          ${summaryRow3('Total Withdrawal Charges', 0, 0, 0)}
          ${summaryRow3('Total Admin Charges', 0, null, 0)}
          ${summaryRow3('Total IMC', 0, 0, 0)}
          ${summaryRow3('Transactional Value', report.totalTransactionalEeValue, report.totalTransactionalVeeValue, report.totalTransactionalErValue)}
          ${summaryRow3('Terminated ER Value (Non-vested)', null, null, report.totalTerminatedErValue)}
          ${summaryRow3('Surrender Charges', report.surrenderChargesEe, report.surrenderChargesVee, report.surrenderChargesEr)}
          <div class='sum-line'></div>
          <div class='note'>Note: Surrender charges are NOT deducted from the above fund movement</div>
        </div>
      </div>
    </div>
  `;
}

function page2(report: TerminationReport): string {
  const funds = fundsOf(report);
  return `
    <div class='term-page'>
      <div class='report-body'>
        ${fundTable('Fund Manager Movement Summary', funds.slice(0, 5), 'units')}
        <div style='height:28px'></div>
        ${fundTable('', funds.slice(5, 10), 'units')}
      </div>
    </div>
  `;
}

function page3(report: TerminationReport): string {
  const funds = fundsOf(report);
  return `
    <div class='term-page'>
      <div class='report-body'>
        ${fundTable('Funds', funds.slice(0, 5), 'values')}
        <div style='height:28px'></div>
        ${fundTable('', funds.slice(5, 10), 'values')}
        <div class='note' style='margin-top:12px'>Note: Surrender charges are NOT deducted from the above fund movement</div>
        <div class='surrender'>
          <div class='section-title'>Surrender Charges</div>
          ${summaryRow('Surrender Charges EE', report.surrenderChargesEe)}
          ${summaryRow('Surrender Charges VEE', report.surrenderChargesVee)}
          ${summaryRow('Surrender Charges ER', report.surrenderChargesEr)}
        </div>
      </div>
    </div>
  `;
}

const PAGE_CSS = `
  .term-page {
    width: 794px;
    min-height: 1123px;
    box-sizing: border-box;
    background: #fff;
    color: #111;
    font-family: Arial, 'Segoe UI', Tahoma, sans-serif;
    position: relative;
  }
  .report-body {
    position: relative;
    width: 744px;
    min-height: 1052px;
    margin: 26px auto 0;
  }
  .logo { position: absolute; left: 0; top: 0; width: 50px; height: 50px; object-fit: contain; }
  .addr, .phone { position: absolute; left: 0; font-size: 11px; font-weight: 700; }
  .addr { top: 56px; }
  .phone { top: 118px; }
  .addr-val, .phone-val { position: absolute; left: 0; font-size: 11px; }
  .addr-val { top: 72px; width: 320px; word-wrap: break-word; }
  .phone-val { top: 134px; }
  .title { position: absolute; left: 0; right: 0; top: 8px; text-align: center; font-size: 22px; font-weight: 700; }
  .date-lab, .date-val { position: absolute; top: 8px; font-size: 11px; }
  .date-lab { right: 118px; }
  .date-val { right: 0; width: 110px; text-align: right; }
  .info { position: absolute; right: 0; top: 110px; width: 340px; }
  .info-row { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 6px; font-size: 11px; }
  .info-lab { font-weight: 700; white-space: nowrap; }
  .info-val { min-width: 160px; text-align: left; word-break: break-word; }
  .client { position: absolute; left: 0; top: 300px; width: 744px; }
  .client-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
  .currency { font-size: 11px; font-weight: 700; width: 120px; text-align: center; }
  .section-title { font-size: 14px; font-weight: 700; margin: 0 0 10px; }
  .client-col-head { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 4px; font-size: 11px; font-weight: 700; text-align: center; }
  .sum-row { display: grid; grid-template-columns: 1fr 120px; gap: 10px; align-items: center; margin-bottom: 5px; }
  .sum-row-3 { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; align-items: center; margin-bottom: 5px; }
  .sum-lab { font-size: 11px; font-weight: 700; }
  .sum-line { border-top: 1px solid #111; margin: 8px 0 8px 0; }
  .box { border: 1px solid #8a8a8a; background: #fff; text-align: right; padding: 3px 6px; font-size: 11px; min-height: 18px; box-sizing: border-box; }
  .fund-table { width: 100%; border-collapse: separate; border-spacing: 8px 5px; }
  .fund-table th { font-size: 11px; font-weight: 700; text-align: center; }
  .fund-table td { vertical-align: middle; }
  .fund-table .lab { font-size: 11px; font-weight: 700; white-space: nowrap; width: 170px; }
  .total-row td { padding-top: 8px; }
  .note { font-size: 11px; font-weight: 700; margin-top: 10px; }
  .surrender { margin-top: 20px; width: 420px; }
`;

export async function buildTerminationReportPdf(report: TerminationReport): Promise<Blob> {
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
    const pages = Array.from(root.querySelectorAll('.term-page'));
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