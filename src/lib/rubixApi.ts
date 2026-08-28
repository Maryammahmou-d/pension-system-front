import axios from 'axios';
import type {
  BulkTopUpRequest,
  BulkTopUpResult,
  BulkTopUpRowResult,
  CancelInvoiceRequest,
  CompanySummary,
  CreateInvoiceRequest,
  CreateInvoiceResult,
  EmployeeSummary,
  Invoice,
  InvoiceEmployeeLine,
  SettleInvoiceRequest,
  TopUpRequest,
  TopUpResult,
  UnitPriceRow,
} from '../types';
import { http } from './httpClient';

const delay = (ms = 180) => new Promise<void>((r) => setTimeout(r, ms));

function todayIso(): string {
  const d = new Date();
  return toIsoDate(d);
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: string, b: string): number {
  const ms = parseIso(b).getTime() - parseIso(a).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function nextInvoiceNumber(existing: Invoice[]): string {
  let max = 0;
  for (const inv of existing) {
    const n = Number(inv.invoiceNumber.replace(/\D/g, ''));
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }
  return `I${String(max + 1).padStart(6, '0')}`;
}

// ── Seed data ────────────────────────────────────────────────────

let _companies: CompanySummary[] = [
  { companyNumber: 'C001', companyName: 'Acme Holdings', active: true },
  { companyNumber: 'C002', companyName: 'Nile Logistics', active: true },
  { companyNumber: 'C003', companyName: 'Delta Soft (Terminated)', active: false },
];

let _employees: EmployeeSummary[] = [
  { employeeNumber: 'E1001', fullName: 'Ahmed Hassan', companyNumber: 'C001', active: true },
  { employeeNumber: 'E1002', fullName: 'Sara Mahmoud', companyNumber: 'C001', active: true },
  { employeeNumber: 'E1003', fullName: 'Omar Farouk', companyNumber: 'C001', active: true },
  { employeeNumber: 'E2001', fullName: 'Mona Ali', companyNumber: 'C002', active: true },
  { employeeNumber: 'E2002', fullName: 'Youssef Nabil', companyNumber: 'C002', active: true },
];

/** Rough monthly contribution per employee for mock invoice creation (EGP). */
const MOCK_CONTRIB_EGP: Record<string, number> = {
  E1001: 4200,
  E1002: 3800,
  E1003: 5100,
  E2001: 2900,
  E2002: 3300,
};

function recentDates(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(toIsoDate(x));
  }
  return out;
}

let _unitPrices: UnitPriceRow[] = recentDates(14).map((priceDate, i) => ({
  priceDate,
  fund1: 10 + i * 0.01,
  fund2: 12 + i * 0.01,
  fund3: 9.5 + i * 0.01,
  fund4: 11 + i * 0.01,
  fund5: 8 + i * 0.01,
  fund6: 13 + i * 0.01,
  fund7: 10.5 + i * 0.01,
  fund8: 14 + i * 0.01,
  fund9: 7.5 + i * 0.01,
  fund10: 15 + i * 0.01,
}));

let _invoices: Invoice[] = [
  {
    invoiceNumber: 'I000001',
    companyNumber: 'C001',
    companyName: 'Acme Holdings',
    invoiceDate: todayIso(),
    dateFrom: '2026-06-01',
    dateTo: '2026-06-30',
    status: 'Pending',
    paymentDate: null,
    egpAmount: 13100,
    usdAmount: 265,
    eurAmount: 240,
    employeeLineCount: 3,
  },
  {
    invoiceNumber: 'I000002',
    companyNumber: 'C002',
    companyName: 'Nile Logistics',
    invoiceDate: todayIso(),
    dateFrom: '2026-06-01',
    dateTo: '2026-06-30',
    status: 'Pending',
    paymentDate: null,
    egpAmount: 6200,
    usdAmount: 125,
    eurAmount: 115,
    employeeLineCount: 2,
  },
];

let _invoiceLines: InvoiceEmployeeLine[] = [
  {
    invoiceNumber: 'I000001', employeeNumber: 'E1001', fullName: 'Ahmed Hassan',
    companyNumber: 'C001', currency: 'EGP', employeeContribution: 1680, veeContribution: 420,
    employerContribution: 2100, totalContribution: 4200, grandTotal: 4300, status: 'Pending',
  },
  {
    invoiceNumber: 'I000001', employeeNumber: 'E1002', fullName: 'Sara Mahmoud',
    companyNumber: 'C001', currency: 'EGP', employeeContribution: 1520, veeContribution: 380,
    employerContribution: 1900, totalContribution: 3800, grandTotal: 3900, status: 'Pending',
  },
  {
    invoiceNumber: 'I000001', employeeNumber: 'E1003', fullName: 'Omar Farouk',
    companyNumber: 'C001', currency: 'EGP', employeeContribution: 2040, veeContribution: 510,
    employerContribution: 2550, totalContribution: 5100, grandTotal: 5200, status: 'Pending',
  },
  {
    invoiceNumber: 'I000002', employeeNumber: 'E2001', fullName: 'Mona Ali',
    companyNumber: 'C002', currency: 'EGP', employeeContribution: 1160, veeContribution: 290,
    employerContribution: 1450, totalContribution: 2900, grandTotal: 3000, status: 'Pending',
  },
  {
    invoiceNumber: 'I000002', employeeNumber: 'E2002', fullName: 'Youssef Nabil',
    companyNumber: 'C002', currency: 'EGP', employeeContribution: 1320, veeContribution: 330,
    employerContribution: 1650, totalContribution: 3300, grandTotal: 3400, status: 'Pending',
  },
];

let _topUpLog: TopUpResult[] = [];

function hasUnitPrice(date: string): boolean {
  return _unitPrices.some((u) => u.priceDate === date);
}

function assertUnitPrice(date: string) {
  if (!hasUnitPrice(date)) {
    throw new Error(
      'There is no unit price for that date. Please settle / top up after the unit price is entered.',
    );
  }
}

// ── Lookups ──────────────────────────────────────────────────────

export const lookupsApi = {
  listCompanies: async (activeOnly = true): Promise<CompanySummary[]> => {
    await delay();
    return _companies.filter((c) => (activeOnly ? c.active : true)).map((c) => ({ ...c }));
  },

  listEmployees: async (companyNumber?: string): Promise<EmployeeSummary[]> => {
    await delay();
    return _employees
      .filter((e) => e.active && (!companyNumber || e.companyNumber === companyNumber))
      .map((e) => ({ ...e }));
  },

  hasUnitPrice: async (priceDate: string): Promise<boolean> => {
    await delay(40);
    return hasUnitPrice(priceDate);
  },

  listUnitPrices: async (): Promise<UnitPriceRow[]> => {
    await delay();
    return _unitPrices.map((u) => ({ ...u }));
  },
};

// ── Invoices ─────────────────────────────────────────────────────

export const invoicesApi = {
  list: async (status?: Invoice['status']): Promise<Invoice[]> => {
    await delay();
    return _invoices
      .filter((i) => !status || i.status === status)
      .map((i) => ({ ...i }));
  },

  get: async (invoiceNumber: string): Promise<Invoice | null> => {
    await delay();
    const inv = _invoices.find((i) => i.invoiceNumber === invoiceNumber);
    return inv ? { ...inv } : null;
  },

  create: async (req: CreateInvoiceRequest): Promise<CreateInvoiceResult> => {
    await delay(350);
    const company = _companies.find((c) => c.companyNumber === req.companyNumber && c.active);
    if (!company) throw new Error('Company not found or inactive.');

    const employees = _employees.filter(
      (e) => e.companyNumber === req.companyNumber && e.active,
    );
    if (employees.length === 0) {
      throw new Error('Invoice could not be created');
    }

    const invoiceNumber = nextInvoiceNumber(_invoices);
    let egp = 0;
    const lines: InvoiceEmployeeLine[] = employees.map((e) => {
      const total = MOCK_CONTRIB_EGP[e.employeeNumber] ?? 2000;
      egp += total;
      const ee = Math.round(total * 0.4);
      const vee = Math.round(total * 0.1);
      const er = total - ee - vee;
      return {
        invoiceNumber,
        employeeNumber: e.employeeNumber,
        fullName: e.fullName,
        companyNumber: e.companyNumber,
        currency: 'EGP',
        employeeContribution: ee,
        veeContribution: vee,
        employerContribution: er,
        totalContribution: total,
        grandTotal: Math.round(total * 1.025),
        status: 'Pending',
      };
    });

    const invoice: Invoice = {
      invoiceNumber,
      companyNumber: company.companyNumber,
      companyName: company.companyName,
      invoiceDate: todayIso(),
      dateFrom: req.dateFrom,
      dateTo: req.dateTo,
      status: 'Pending',
      paymentDate: null,
      egpAmount: egp,
      usdAmount: Math.round((egp / 49.5) * 100) / 100,
      eurAmount: Math.round((egp / 54) * 100) / 100,
      employeeLineCount: lines.length,
    };

    _invoices = [..._invoices, invoice];
    _invoiceLines = [..._invoiceLines, ...lines];

    return {
      invoiceNumber,
      employeeLineCount: lines.length,
      egpAmount: invoice.egpAmount,
      usdAmount: invoice.usdAmount,
      eurAmount: invoice.eurAmount,
    };
  },

  settle: async (req: SettleInvoiceRequest): Promise<Invoice> => {
    await delay(350);
    const inv = _invoices.find((i) => i.invoiceNumber === req.invoiceNumber);
    if (!inv) throw new Error('Invoice not found.');
    if (inv.status !== 'Pending') throw new Error(`Invoice is already ${inv.status}.`);

    assertUnitPrice(req.paymentDate);

    const level = req.userSecurityLevel ?? 3;
    const maxDays = level === 1 || level === 5 ? 9999 : 7;
    const age = daysBetween(req.paymentDate, todayIso());
    if (age > maxDays) {
      throw new Error(
        `Please note that invoices older than ${maxDays} days cannot be settled without supervisor approval.`,
      );
    }

    _invoices = _invoices.map((i) =>
      i.invoiceNumber === req.invoiceNumber
        ? { ...i, status: 'Paid' as const, paymentDate: req.paymentDate }
        : i,
    );
    _invoiceLines = _invoiceLines.map((l) =>
      l.invoiceNumber === req.invoiceNumber ? { ...l, status: 'Paid' as const } : l,
    );

    return { ..._invoices.find((i) => i.invoiceNumber === req.invoiceNumber)! };
  },

  cancel: async (req: CancelInvoiceRequest): Promise<Invoice> => {
    await delay(280);
    const inv = _invoices.find((i) => i.invoiceNumber === req.invoiceNumber);
    if (!inv) throw new Error('Invoice not found.');
    if (inv.status === 'Cancelled') throw new Error('Invoice is already cancelled.');
    if (inv.status === 'Paid') {
      throw new Error('Paid invoices cannot be cancelled.');
    }

    _invoices = _invoices.map((i) =>
      i.invoiceNumber === req.invoiceNumber
        ? { ...i, status: 'Cancelled' as const, paymentDate: req.cancellationDate }
        : i,
    );
    _invoiceLines = _invoiceLines.map((l) =>
      l.invoiceNumber === req.invoiceNumber ? { ...l, status: 'Cancelled' as const } : l,
    );

    return { ..._invoices.find((i) => i.invoiceNumber === req.invoiceNumber)! };
  },
};

// ── Top-ups ──────────────────────────────────────────────────────

export const topUpsApi = {
  create: async (req: TopUpRequest): Promise<TopUpResult> => {
    await delay(300);
    const emp = _employees.find(
      (e) =>
        e.employeeNumber === req.employeeNumber
        && e.companyNumber === req.companyNumber
        && e.active,
    );
    if (!emp) throw new Error('Employee not found for this company.');

    assertUnitPrice(req.topUpDate);

    const total = Number(req.topUpEE) + Number(req.topUpVEE) + Number(req.topUpER);
    if (total <= 0) throw new Error('Total Top Up should be > 0');

    const result: TopUpResult = {
      employeeNumber: req.employeeNumber,
      employeeName: emp.fullName,
      companyNumber: req.companyNumber,
      topUpDate: req.topUpDate,
      topUpEE: Number(req.topUpEE) || 0,
      topUpVEE: Number(req.topUpVEE) || 0,
      topUpER: Number(req.topUpER) || 0,
      total,
      chargesEe: 0,
      chargesVee: 0,
      chargesEr: 0,
      imcEe: 0,
      imcVee: 0,
      imcEr: 0,
      transactionalEe: Number(req.topUpEE) || 0,
      transactionalVee: Number(req.topUpVEE) || 0,
      transactionalEr: Number(req.topUpER) || 0,
      transactionalTotal: total,
      totalEeValue: total,
      totalVeeValue: 0,
      totalErValue: 0,
      funds: [],
    };
    _topUpLog = [..._topUpLog, result];
    return result;
  },

  bulk: async (req: BulkTopUpRequest): Promise<BulkTopUpResult> => {
    await delay(400);
    const rows: BulkTopUpRowResult[] = [];
    const posted: TopUpResult[] = [];
    let succeeded = 0;

    for (const row of req.rows) {
      try {
        const emp = _employees.find(
          (e) =>
            e.employeeNumber === row.employeeNumber
            && e.companyNumber === req.companyNumber
            && e.active,
        );
        if (!emp) {
          rows.push({
            employeeNumber: row.employeeNumber,
            ok: false,
            message: 'Employee not found for company',
          });
          continue;
        }
        if (!hasUnitPrice(row.unitPriceDate)) {
          rows.push({
            employeeNumber: row.employeeNumber,
            ok: false,
            message: 'No unit price for date',
          });
          continue;
        }
        const total = Number(row.ee) + Number(row.er) + Number(row.vee);
        if (total <= 0) {
          rows.push({
            employeeNumber: row.employeeNumber,
            ok: false,
            message: 'Total must be > 0',
          });
          continue;
        }
        const result: TopUpResult = {
          employeeNumber: row.employeeNumber,
          employeeName: emp.fullName,
          companyNumber: req.companyNumber,
          topUpDate: row.unitPriceDate,
          topUpEE: Number(row.ee) || 0,
          topUpVEE: Number(row.vee) || 0,
          topUpER: Number(row.er) || 0,
          total,
          chargesEe: 0,
          chargesVee: 0,
          chargesEr: 0,
          imcEe: 0,
          imcVee: 0,
          imcEr: 0,
          transactionalEe: Number(row.ee) || 0,
          transactionalVee: Number(row.vee) || 0,
          transactionalEr: Number(row.er) || 0,
          transactionalTotal: total,
          totalEeValue: total,
          totalVeeValue: 0,
          totalErValue: 0,
          funds: [],
        };
        _topUpLog.push(result);
        posted.push(result);
        rows.push({
          employeeNumber: row.employeeNumber,
          ok: true,
          message: 'Done',
          total,
          report: result,
        });
        succeeded += 1;
      } catch (err) {
        rows.push({
          employeeNumber: row.employeeNumber,
          ok: false,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return {
      processed: rows.length,
      succeeded,
      failed: rows.length - succeeded,
      rows,
      posted,
    };
  },

  listRecent: async (): Promise<TopUpResult[]> => {
    await delay();
    return [..._topUpLog].slice(-50);
  },
};

// ── Unit prices ──────────────────────────────────────────────────

export const unitPricesApi = {
  save: async (row: UnitPriceRow): Promise<UnitPriceRow> => {
    await delay(300);
    const idx = _unitPrices.findIndex((u) => u.priceDate === row.priceDate);
    const saved = { ...row };
    if (idx >= 0) {
      _unitPrices = [..._unitPrices.slice(0, idx), saved, ..._unitPrices.slice(idx + 1)];
    } else {
      _unitPrices = [..._unitPrices, saved].sort((a, b) => a.priceDate.localeCompare(b.priceDate));
    }
    return saved;
  },
};

// ── Reports ──────────────────────────────────────────────────────

export type ReportExtractFormat = 'pdf' | 'excel' | 'data' | 'transactions' | 'records';

export interface ReportExtractResult {
  ok: true;
  message: string;
  reportKey: string;
  format: ReportExtractFormat;
}

async function downloadReportBlob(url: string, params: Record<string, string | boolean>): Promise<Blob> {
  try {
    const { data } = await http.get<Blob>(url, {
      params,
      responseType: 'blob',
      headers: { Accept: '*/*', 'Content-Type': undefined },
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
      const text = await err.response.data.text();
      try {
        const parsed = JSON.parse(text) as { message?: string; detail?: string; error?: string };
        const message = parsed.message ?? parsed.detail ?? parsed.error;
        if (message) throw new Error(message);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== text && !(parseErr instanceof SyntaxError)) {
          throw parseErr;
        }
      }
      if (text.trim()) throw new Error(text);
    }
    throw err;
  }
}

function parseAttachmentFilename(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const match = /filename[^;=\n]*=(('.*?'|\".*?\")|[^;\n]*)/.exec(header);
  if (!match) return fallback;
  return match[1].replace(/^['"]|['"]$/g, '').trim() || fallback;
}

export const reportsApi = {
  downloadAggregatedEmployeeBalancePdf: async (
    companyNumber: string,
    valuationDate: string,
  ): Promise<Blob> => {
    return downloadReportBlob('/reports/aggregated-employee-balance/pdf', { companyNumber, valuationDate });
  },

  downloadEmployeeBalancePdf: async (
    companyNumber: string,
    employeeNumber: string,
    valuationDate: string,
  ): Promise<Blob> => {
    return downloadReportBlob('/reports/employee-balance/pdf', {
      companyNumber,
      employeeNumber,
      valuationDate,
    });
  },

  downloadEmployeeBalanceExcel: async (
    companyNumber: string,
    employeeNumber: string,
    valuationDate: string,
  ): Promise<Blob> => {
    return downloadReportBlob('/reports/employee-balance/excel', {
      companyNumber,
      employeeNumber,
      valuationDate,
    });
  },

  downloadAggregatedEmployeeBalanceExcel: async (
    companyNumber: string,
    valuationDate: string,
  ): Promise<Blob> => {
    return downloadReportBlob('/reports/aggregated-employee-balance/excel', {
      companyNumber,
      valuationDate,
    });
  },

  downloadCompanyBalancePdfZip: async (
    companyNumber: string,
    valuationDate: string,
    activeOnly: boolean,
  ): Promise<Blob> => {
    return downloadReportBlob('/reports/company-balance/pdf', {
      companyNumber,
      valuationDate,
      activeOnly,
    });
  },

  downloadCompanyBalanceExcelZip: async (
    companyNumber: string,
    valuationDate: string,
    activeOnly: boolean,
  ): Promise<Blob> => {
    return downloadReportBlob('/reports/company-balance/excel', {
      companyNumber,
      valuationDate,
      activeOnly,
    });
  },

  downloadCompanyTransactions: async (
    companyNumber: string,
  ): Promise<{ blob: Blob; filename: string }> => {
    const res = await http.get<Blob>('/transactions/export', {
      params: { companyNumber },
      responseType: 'blob',
      headers: { Accept: '*/*', 'Content-Type': undefined },
    });
    const header = res.headers['content-disposition'];
    const filename = parseAttachmentFilename(
      typeof header === 'string' ? header : undefined,
      `Transactions_${companyNumber}.xlsx`,
    );
    return { blob: res.data, filename };
  },

  downloadEmployeeTransactions: async (
    companyNumber: string,
    employeeNumber: string,
  ): Promise<{ blob: Blob; filename: string }> => {
    const blob = await downloadReportBlob('/transactions/employee/export', {
      companyNumber,
      employeeNumber,
    });
    return { blob, filename: `Transactions_${employeeNumber}.xlsx` };
  },

  downloadTransactionsBetweenDates: async (
    startDate: string,
    endDate: string,
  ): Promise<{ blob: Blob; filename: string }> => {
    const blob = await downloadReportBlob('/transactions/dates/export', { startDate, endDate });
    return {
      blob,
      filename: `Transactions_${startDate.replace(/-/g, '')}_${endDate.replace(/-/g, '')}.xlsx`,
    };
  },

  downloadCompaniesFunds: async (
    valuationDate: string,
  ): Promise<{ blob: Blob; filename: string }> => {
    const blob = await downloadReportBlob('/funds/export', { valuationDate });
    return {
      blob,
      filename: `Funds_Report_${valuationDate.replace(/-/g, '')}.xlsx`,
    };
  },

  listCompanyBalanceEmployees: async (
    companyNumber: string,
    valuationDate: string,
    activeOnly: boolean,
  ): Promise<string[]> => {
    const { data } = await http.get<string[]>('/reports/company-balance/employees', {
      params: { companyNumber, valuationDate, activeOnly },
    });
    return data;
  },

  downloadEmployeeExtractAppExcel: async (reportDate: string): Promise<Blob> => {
    try {
      const { data } = await http.get<Blob>('/reports/employee-extract-app/excel', {
        params: { reportDate },
        responseType: 'blob',
        timeout: 300_000,
        headers: { Accept: '*/*', 'Content-Type': undefined },
      });
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const parsed = JSON.parse(text) as { message?: string };
          if (parsed.message) throw new Error(parsed.message);
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message !== text && !(parseErr instanceof SyntaxError)) {
            throw parseErr;
          }
        }
        if (text.trim()) throw new Error(text);
      }
      throw err;
    }
  },

  extract: async (
    reportKey: string,
    format: ReportExtractFormat,
    _payload?: Record<string, unknown>,
  ): Promise<ReportExtractResult> => {
    await delay(280);
    const label =
      format === 'pdf' ? 'PDF'
        : format === 'excel' ? 'Excel'
          : format === 'transactions' ? 'transactions'
            : format === 'records' ? 'records'
              : 'data';
    return {
      ok: true,
      reportKey,
      format,
      message: `Mock ${label} extract completed for ${reportKey}.`,
    };
  },
};

/** Date helpers shared by pages */
export const dateHelpers = {
  todayIso,
  toIsoDate,
  monthRange(year: number, month: number): { dateFrom: string; dateTo: string } {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { dateFrom: toIsoDate(start), dateTo: toIsoDate(end) };
  },
  formatDisplay(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${Number(m)}/${Number(d)}/${y}`;
  },
};
