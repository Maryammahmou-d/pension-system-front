import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { InvoiceCategorySummary, InvoiceDetails } from '../types';
import kafLogoUrl from '../assets/kaf-logo.jpg';
import stampUrl from '../assets/stamp.png';

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

function fmtWeekdayDate(iso: string | null | undefined): string {
  const d = parseIso(iso) ?? new Date();
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function sum(rows: InvoiceCategorySummary[], pick: (row: InvoiceCategorySummary) => number): number {
  return rows.reduce((acc, row) => acc + pick(row), 0);
}

function esc(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const tw = (value: number) => `${(value / 15).toFixed(1)}px`;

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

function pageHtml(details: InvoiceDetails, firstPage: boolean, logoSrc: string, stampSrc: string): string {
  const categories = [...details.categories].sort((a, b) => a.category - b.category);
  const subtotal = sum(categories, (row) => row.totalContribution);
  const stampDuty = sum(categories, (row) => row.stampDuty);
  const supervisoryFees = sum(categories, (row) => row.supervisoryFees);
  const fraApprovalFees = sum(categories, (row) => row.fraApprovalFees);
  const fraProvisionFees = sum(categories, (row) => row.fraProvisionFees);
  const grandTotal = sum(categories, (row) => row.grandTotal);

  const categoryRows = categories.map((row, index) => {
    const sectionTop = 316 + index * 116;
    return `
      <div class="abs" style="left:${tw(240)};top:${sectionTop}px;width:${tw(1620)};">Category:</div>
      <div class="abs" style="left:${tw(1920)};top:${sectionTop}px;width:${tw(1260)};">${esc(row.category)}</div>
      <div class="abs" style="left:${tw(2880)};top:${sectionTop}px;width:${tw(3240)};">(${esc(row.employeeCount)} ${row.employeeCount === 1 ? 'Employee' : 'Employees'})</div>

      <div class="abs bold" style="left:${tw(4620)};top:${sectionTop + 4}px;width:${tw(2820)};">Employee Contribution:</div>
      <div class="abs value" style="left:${tw(8100)};top:${sectionTop + 4}px;width:${tw(2940)};">${fmtNum(row.employeeContribution)}</div>

      <div class="abs bold" style="left:${tw(4620)};top:${sectionTop + 32}px;width:${tw(3324)};">Employee Voluntary Contribution:</div>
      <div class="abs value" style="left:${tw(8100)};top:${sectionTop + 32}px;width:${tw(2940)};">${fmtNum(row.veeContribution)}</div>

      <div class="abs bold" style="left:${tw(4620)};top:${sectionTop + 60}px;width:${tw(2820)};">Employer Contribution:</div>
      <div class="abs value" style="left:${tw(8100)};top:${sectionTop + 60}px;width:${tw(2940)};">${fmtNum(row.employerContribution)}</div>
    `;
  }).join('');

  const pageHeader = `
    <img class="logo" src="${logoSrc}" alt="KAF" />
    <div class="abs small" style="left:${tw(240)};top:${tw(840)};">Address</div>
    <div class="abs small" style="left:${tw(240)};top:${tw(1140)};">Phone Number</div>

    <div class="abs small" style="left:${tw(7740)};top:${tw(120)};width:${tw(1020)};">Date:</div>
    <div class="abs small value" style="left:${tw(8400)};top:${tw(120)};width:${tw(2640)};">${esc(fmtWeekdayDate(details.invoiceDate))}</div>

    <div class="abs small" style="left:${tw(7740)};top:${tw(480)};width:${tw(1656)};">Invoice Number:</div>
    <div class="abs small value" style="left:${tw(9600)};top:${tw(480)};width:${tw(1440)};">${esc(details.invoiceNumber)}</div>

    <div class="abs title-ar" style="left:${tw(4140)};top:${tw(1560)};width:${tw(3120)};">مطالبة سداد اشتراكات</div>

    <div class="abs small" style="left:${tw(240)};top:${tw(2340)};width:${tw(660)};">Bill to:</div>
    <div class="abs small ar" style="left:${tw(1500)};top:${tw(2340)};width:${tw(1620)};">كاف لتأمينات الحياة</div>
    <div class="abs small ar" style="left:${tw(1500)};top:${tw(2700)};width:${tw(1620)};">العنوان</div>

    <div class="abs small" style="left:${tw(7080)};top:${tw(2340)};width:${tw(660)};">For:</div>
    <div class="abs small ar value" style="left:${tw(9420)};top:${tw(2340)};width:${tw(1620)};">${esc(details.companyName || details.companyNumber)}</div>

    <div class="abs small" style="left:${tw(7080)};top:${tw(2820)};width:${tw(2040)};">Contract Number:</div>
    <div class="abs small value" style="left:${tw(9420)};top:${tw(2820)};width:${tw(1620)};">${esc(details.companyNumber)}</div>

    <div class="abs small" style="left:${tw(7080)};top:${tw(3240)};width:${tw(1860)};">Covered Period:</div>
    <div class="abs small value" style="left:${tw(9420)};top:${tw(3300)};width:${tw(1620)};">${esc(fmtAccessShort(details.dateFrom))} to<br>${esc(fmtAccessShort(details.dateTo))}</div>
  `;

  if (firstPage) {
    return `
      <div class="invoice-page">
        <div class="report-body">
          ${pageHeader}
          <div class="abs bold" style="left:${tw(8100)};top:${280 + 8}px;width:${tw(1260)};">Currency:</div>
          <div class="abs bold value" style="left:${tw(9420)};top:${280 + 8}px;width:${tw(1620)};">${esc(details.currency || 'EGP')}</div>
          ${categoryRows}
        </div>
      </div>
    `;
  }

  return `
    <div class="invoice-page">
      <div class="report-body">
        ${pageHeader}
        <div class="hline" style="left:${tw(5160)};top:${280 + 8}px;width:${tw(5880)};"></div>

        <div class="abs bold value" style="left:${tw(5280)};top:${280 + 16}px;width:${tw(2820)};">Subtotal (EGP)</div>
        <div class="abs value" style="left:${tw(8100)};top:${280 + 16}px;width:${tw(2940)};">${fmtNum(subtotal)}</div>

        <div class="abs bold value" style="left:${tw(5280)};top:${280 + 44}px;width:${tw(2820)};">Proportional Stamp 0.5%</div>
        <div class="abs value" style="left:${tw(8100)};top:${280 + 44}px;width:${tw(2940)};">${fmtNum(stampDuty)}</div>

        <div class="abs bold value" style="left:${tw(5280)};top:${280 + 72}px;width:${tw(2820)};">Supervisory Fees 0.25%</div>
        <div class="abs value" style="left:${tw(8100)};top:${280 + 72}px;width:${tw(2940)};">${fmtNum(supervisoryFees)}</div>

        <div class="abs bold value" style="left:${tw(5280)};top:${280 + 100}px;width:${tw(2820)};">FRA Approval Fees 0.1%</div>
        <div class="abs value" style="left:${tw(8100)};top:${280 + 100}px;width:${tw(2940)};">${fmtNum(fraApprovalFees)}</div>

        <div class="abs bold value" style="left:${tw(5280)};top:${280 + 128}px;width:${tw(2820)};">FRA Provision Fees 0.1%</div>
        <div class="abs value" style="left:${tw(8100)};top:${280 + 128}px;width:${tw(2940)};">${fmtNum(fraProvisionFees)}</div>

        <div class="hline" style="left:${tw(5160)};top:${280 + 164}px;width:${tw(5880)};"></div>
        <div class="abs bold value" style="left:${tw(5280)};top:${280 + 172}px;width:${tw(2820)};">Grand Total (EGP)</div>
        <div class="abs value" style="left:${tw(8100)};top:${280 + 172}px;width:${tw(2940)};">${fmtNum(grandTotal)}</div>

        <div class="abs ar center" style="left:${tw(0)};top:${280 + 196}px;width:${tw(6780)};font-size:12px;">نرجو من سيادتكم التكرم بسداد الاشتراكات المذكورة في موعد أقصاه 7 أيام من تاريخ هذه المطالبة</div>
        <div class="abs" style="left:${tw(180)};top:${280 + 220}px;font-size:12px;">Make all checks payable to</div>
        <div class="abs bold" style="left:${tw(2700)};top:${280 + 220}px;font-size:14px;">Kaf Life Insurance</div>
        <div class="abs director" style="left:${tw(8820)};top:${280 + 212}px;width:${tw(2220)};">Managing Director</div>
        <img class="stamp" src="${stampSrc}" alt="Stamp" />
      </div>
    </div>
  `;
}

export async function buildInvoicePdf(details: InvoiceDetails): Promise<Blob> {
  const [logoSrc, stampSrc] = await Promise.all([
    loadAsDataUrl(kafLogoUrl),
    loadAsDataUrl(stampUrl),
  ]);

  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.left = '-10000px';
  root.style.top = '0';
  root.style.width = '794px';
  root.style.background = '#ffffff';
  root.style.zIndex = '-1';
  root.innerHTML = `
    <style>
      .invoice-page {
        width: 794px;
        min-height: 1123px;
        box-sizing: border-box;
        background: #fff;
        color: #111;
        font-family: Arial, "Segoe UI", Tahoma, sans-serif;
        position: relative;
        overflow: visible;
      }
      .report-body {
        position: relative;
        width: 744px;
        min-height: 1052px;
        margin: 26px auto 0;
        overflow: visible;
      }
      .logo {
        position: absolute;
        left: 0;
        top: 0;
        width: 50px;
        height: 50px;
        object-fit: contain;
      }
      .abs {
        position: absolute;
        font-size: 11px;
        line-height: 1.25;
      }
      .small {
        font-size: 11px;
      }
      .tiny {
        font-size: 9px;
      }
      .title-ar {
        font-size: 19px;
        font-weight: 700;
        text-align: center;
      }
      .ar {
        direction: rtl;
        unicode-bidi: plaintext;
      }
      .bold {
        font-weight: 700;
      }
      .value {
        text-align: right;
      }
      .center {
        text-align: center;
      }
      .hline {
        position: absolute;
        border-top: 1px solid #111;
        height: 0;
      }
      .director {
        font-weight: 700;
        text-align: right;
        font-size: 14px;
      }
      .stamp {
        position: absolute;
        left: ${tw(9000)};
        top: ${280 + 256}px;
        width: ${tw(2100)};
        height: ${tw(1260)};
        object-fit: contain;
        z-index: 5;
      }
    </style>
    ${pageHtml(details, true, logoSrc, stampSrc)}
    ${pageHtml(details, false, logoSrc, stampSrc)}
  `;

  document.body.appendChild(root);
  try {
    await waitForImages(root);
    const pages = Array.from(root.querySelectorAll('.invoice-page'));
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
