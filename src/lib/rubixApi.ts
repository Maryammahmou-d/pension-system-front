import type {
  BulkTopUpRequest,
  BulkTopUpResult,
  BulkTopUpRowResult,
  CancelInvoiceRequest,
  CompanySummary,
  CreateInvoiceRequest,
  CreateInvoiceResult,
  EmployeeFundsWithdrawalEstimate,
  EmployeeFundsWithdrawalResult,
  EmployeeTerminationEstimate,
  TerminationFundRow,
  WithdrawalRow,
  EmployeeSummary,
  FundNetSummary,
  FundUnitRow,
  MonthlyChargeRun,
  MonthlyChargesResult,
  NetEmployeeFundsResult,
  NetFundsResult,
  NetUnitsResult,
  Invoice,
  InvoiceEmployeeLine,
  NetCompanyFundsResult,
  SettleInvoiceRequest,
  TopUpRequest,
  VestingRule,
  VestingRuleSummary,
  TopUpResult,
  UnitPriceRow,
} from '../types';

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
    status: 'Unsettled',
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
    status: 'Unsettled',
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
    employerContribution: 2100, totalContribution: 4200, grandTotal: 4300, status: 'Unsettled',
  },
  {
    invoiceNumber: 'I000001', employeeNumber: 'E1002', fullName: 'Sara Mahmoud',
    companyNumber: 'C001', currency: 'EGP', employeeContribution: 1520, veeContribution: 380,
    employerContribution: 1900, totalContribution: 3800, grandTotal: 3900, status: 'Unsettled',
  },
  {
    invoiceNumber: 'I000001', employeeNumber: 'E1003', fullName: 'Omar Farouk',
    companyNumber: 'C001', currency: 'EGP', employeeContribution: 2040, veeContribution: 510,
    employerContribution: 2550, totalContribution: 5100, grandTotal: 5200, status: 'Unsettled',
  },
  {
    invoiceNumber: 'I000002', employeeNumber: 'E2001', fullName: 'Mona Ali',
    companyNumber: 'C002', currency: 'EGP', employeeContribution: 1160, veeContribution: 290,
    employerContribution: 1450, totalContribution: 2900, grandTotal: 3000, status: 'Unsettled',
  },
  {
    invoiceNumber: 'I000002', employeeNumber: 'E2002', fullName: 'Youssef Nabil',
    companyNumber: 'C002', currency: 'EGP', employeeContribution: 1320, veeContribution: 330,
    employerContribution: 1650, totalContribution: 3300, grandTotal: 3400, status: 'Unsettled',
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
        status: 'Unsettled',
      };
    });

    const invoice: Invoice = {
      invoiceNumber,
      companyNumber: company.companyNumber,
      companyName: company.companyName,
      invoiceDate: todayIso(),
      dateFrom: req.dateFrom,
      dateTo: req.dateTo,
      status: 'Unsettled',
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
    if (inv.status !== 'Unsettled') throw new Error(`Invoice is already ${inv.status}.`);

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
      topUpDate: req.topUpDate,
      total,
    };
    _topUpLog = [..._topUpLog, result];
    return result;
  },

  bulk: async (req: BulkTopUpRequest): Promise<BulkTopUpResult> => {
    await delay(400);
    const rows: BulkTopUpRowResult[] = [];
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
        _topUpLog.push({
          employeeNumber: row.employeeNumber,
          topUpDate: row.unitPriceDate,
          total,
        });
        rows.push({
          employeeNumber: row.employeeNumber,
          ok: true,
          message: 'Top-up created',
          total,
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

// ── Net Company Funds ────────────────────────────────────────────

export const netCompanyFundsApi = {
  calculate: async (companyNumber: string, valuationDate: string): Promise<NetCompanyFundsResult> => {
    await delay(450);

    const company = _companies.find((c) => c.companyNumber === companyNumber);
    if (!company) throw new Error('Company not found.');

    const unitPrice = _unitPrices.find((u) => u.priceDate === valuationDate);
    if (!unitPrice) throw new Error('No unit price for the selected valuation date.');

    const employees = _employees.filter((e) => e.companyNumber === companyNumber && e.active);
    const rows: FundNetSummary[] = [];

    for (let i = 1; i <= 10; i += 1) {
      const price = ((unitPrice as unknown) as Record<string, number>)[`fund${i}`] ?? 0;
      const eeUnits = employees.length * (100 + i);
      const veeUnits = employees.length * (25 + i * 0.5);
      const erUnits = employees.length * (150 + i);
      const totalUnits = eeUnits + veeUnits + erUnits;
      const eeFunds = eeUnits * price;
      const veeFunds = veeUnits * price;
      const erFunds = erUnits * price;
      const totalFunds = eeFunds + veeFunds + erFunds;

      rows.push({
        fund: i,
        eeUnits,
        veeUnits,
        erUnits,
        totalUnits,
        unitPrice: price,
        eeFunds,
        veeFunds,
        erFunds,
        totalFunds,
      });
    }

    const totalEEFunds = rows.reduce((s, r) => s + r.eeFunds, 0);
    const totalVEEFunds = rows.reduce((s, r) => s + r.veeFunds, 0);
    const totalERFunds = rows.reduce((s, r) => s + r.erFunds, 0);
    const totalFunds = totalEEFunds + totalVEEFunds + totalERFunds;

    return {
      companyNumber,
      companyName: company.companyName,
      valuationDate,
      rows,
      totalEEFunds,
      totalVEEFunds,
      totalERFunds,
      totalFunds,
    };
  },
};

// Payment-date variant of the same report.
export const netCompanyFundsPaymentDateApi = netCompanyFundsApi;

// ── Net Employee Funds ───────────────────────────────────────────

export const netEmployeeFundsApi = {
  calculate: async (
    companyNumber: string,
    employeeNumber: string,
    valuationDate: string,
  ): Promise<NetEmployeeFundsResult> => {
    await delay(450);

    const company = _companies.find((c) => c.companyNumber === companyNumber);
    if (!company) throw new Error('Company not found.');

    const employee = _employees.find(
      (e) => e.employeeNumber === employeeNumber && e.companyNumber === companyNumber,
    );
    if (!employee) throw new Error('Employee not found for this company.');

    const unitPrice = _unitPrices.find((u) => u.priceDate === valuationDate);
    if (!unitPrice) throw new Error('No unit price for the selected valuation date.');

    const factor = Number(employeeNumber.replace(/\D/g, '')) || 1;
    const rows: FundNetSummary[] = [];

    for (let i = 1; i <= 10; i += 1) {
      const price = ((unitPrice as unknown) as Record<string, number>)[`fund${i}`] ?? 0;
      const eeUnits = factor * (10 + i);
      const veeUnits = factor * (2.5 + i * 0.05);
      const erUnits = factor * (15 + i);
      const totalUnits = eeUnits + veeUnits + erUnits;
      const eeFunds = eeUnits * price;
      const veeFunds = veeUnits * price;
      const erFunds = erUnits * price;
      const totalFunds = eeFunds + veeFunds + erFunds;

      rows.push({
        fund: i,
        eeUnits,
        veeUnits,
        erUnits,
        totalUnits,
        unitPrice: price,
        eeFunds,
        veeFunds,
        erFunds,
        totalFunds,
      });
    }

    const totalEEFunds = rows.reduce((s, r) => s + r.eeFunds, 0);
    const totalVEEFunds = rows.reduce((s, r) => s + r.veeFunds, 0);
    const totalERFunds = rows.reduce((s, r) => s + r.erFunds, 0);
    const totalFunds = totalEEFunds + totalVEEFunds + totalERFunds;

    return {
      companyNumber,
      companyName: company.companyName,
      employeeNumber,
      employeeName: employee.fullName,
      valuationDate,
      rows,
      totalEEFunds,
      totalVEEFunds,
      totalERFunds,
      totalFunds,
    };
  },
};

// ── Net Funds ────────────────────────────────────────────────────

export const netFundsApi = {
  calculate: async (valuationDate: string): Promise<NetFundsResult> => {
    await delay(450);

    const unitPrice = _unitPrices.find((u) => u.priceDate === valuationDate);
    if (!unitPrice) throw new Error('No unit price for the selected valuation date.');

    const activeEmployees = _employees.filter((e) => e.active).length;
    const rows: FundNetSummary[] = [];

    for (let i = 1; i <= 10; i += 1) {
      const price = ((unitPrice as unknown) as Record<string, number>)[`fund${i}`] ?? 0;
      const eeUnits = activeEmployees * (100 + i);
      const veeUnits = activeEmployees * (25 + i * 0.5);
      const erUnits = activeEmployees * (150 + i);
      const totalUnits = eeUnits + veeUnits + erUnits;
      const eeFunds = eeUnits * price;
      const veeFunds = veeUnits * price;
      const erFunds = erUnits * price;
      const totalFunds = eeFunds + veeFunds + erFunds;

      rows.push({
        fund: i,
        eeUnits,
        veeUnits,
        erUnits,
        totalUnits,
        unitPrice: price,
        eeFunds,
        veeFunds,
        erFunds,
        totalFunds,
      });
    }

    const totalEEFunds = rows.reduce((s, r) => s + r.eeFunds, 0);
    const totalVEEFunds = rows.reduce((s, r) => s + r.veeFunds, 0);
    const totalERFunds = rows.reduce((s, r) => s + r.erFunds, 0);
    const totalFunds = totalEEFunds + totalVEEFunds + totalERFunds;

    return {
      valuationDate,
      rows,
      totalEEFunds,
      totalVEEFunds,
      totalERFunds,
      totalFunds,
    };
  },
};

// ── Net Units ────────────────────────────────────────────────────

export const netUnitsApi = {
  calculate: async (valuationDate: string): Promise<NetUnitsResult> => {
    await delay(350);

    const unitPrice = _unitPrices.find((u) => u.priceDate === valuationDate);
    if (!unitPrice) throw new Error('No unit price for the selected valuation date.');

    const activeEmployees = _employees.filter((e) => e.active).length;
    const rows: FundUnitRow[] = [];

    for (let i = 1; i <= 10; i += 1) {
      const eeUnits = activeEmployees * (100 + i);
      const veeUnits = activeEmployees * (25 + i * 0.5);
      const erUnits = activeEmployees * (150 + i);
      const totalUnits = eeUnits + veeUnits + erUnits;

      rows.push({
        fund: i,
        eeUnits,
        veeUnits,
        erUnits,
        totalUnits,
      });
    }

    const totalEEUnits = rows.reduce((s, r) => s + r.eeUnits, 0);
    const totalVEEUnits = rows.reduce((s, r) => s + r.veeUnits, 0);
    const totalERUnits = rows.reduce((s, r) => s + r.erUnits, 0);
    const totalUnits = totalEEUnits + totalVEEUnits + totalERUnits;

    return {
      valuationDate,
      rows,
      totalEEUnits,
      totalVEEUnits,
      totalERUnits,
      totalUnits,
    };
  },
};

// ── Monthly IMC and Admin Charges ────────────────────────────────

let _monthlyChargesLog: MonthlyChargeRun[] = recentDates(12).map((paymentDate) => {
  const d = parseIso(paymentDate);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return {
    paymentDate,
    runDate: paymentDate,
    month,
    year,
    processedCount: Math.floor(Math.random() * 50) + 10,
  };
}).sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));

export const monthlyChargesApi = {
  listPrevious: async (): Promise<MonthlyChargeRun[]> => {
    await delay();
    return [..._monthlyChargesLog];
  },

  run: async (runDate: string, month: number, year: number): Promise<MonthlyChargesResult> => {
    await delay(500);

    if (!runDate) throw new Error('Run Date is required.');
    if (!month || month < 1 || month > 12) throw new Error('Month must be between 1 and 12.');
    if (!year || year < 2000) throw new Error('Year is required.');

    const run: MonthlyChargeRun = {
      paymentDate: runDate,
      runDate,
      month,
      year,
      processedCount: _employees.filter((e) => e.active).length,
    };

    _monthlyChargesLog = [run, ..._monthlyChargesLog].sort(
      (a, b) => b.paymentDate.localeCompare(a.paymentDate),
    );

    return { run, previousRuns: [..._monthlyChargesLog] };
  },
};

// ── Vesting Rules ────────────────────────────────────────────────

let _vestingRules: VestingRule[] = [
  {
    companyNumber: 'C001',
    year1: 100, year2: 100, year3: 100, year4: 100, year5: 100,
    year6: 100, year7: 100, year8: 100, year9: 100, year10: 100,
  },
];

export const vestingRulesApi = {
  list: async (): Promise<VestingRuleSummary[]> => {
    await delay();
    return [..._vestingRules].sort((a, b) => a.companyNumber.localeCompare(b.companyNumber));
  },

  create: async (rule: VestingRule): Promise<VestingRule> => {
    await delay(350);

    const company = _companies.find((c) => c.companyNumber === rule.companyNumber);
    if (!company) throw new Error('Company not found.');

    for (let i = 1; i <= 10; i += 1) {
      const key = `year${i}` as keyof VestingRule;
      const value = Number(rule[key]);
      if (i <= 9 && (Number.isNaN(value) || value < 0 || value > 100)) {
        throw new Error(`Year ${i} must be a percentage between 0 and 100.`);
      }
      if (i === 10 && (Number.isNaN(value) || value < 0 || value > 100)) {
        throw new Error(`Year 10 must be a percentage between 0 and 100.`);
      }
    }

    const existing = _vestingRules.find((r) => r.companyNumber === rule.companyNumber);
    if (existing) throw new Error('Vesting rules already exist for this company.');

    const saved: VestingRule = { ...rule };
    _vestingRules = [..._vestingRules, saved];
    return saved;
  },

  get: async (companyNumber: string): Promise<VestingRule | null> => {
    await delay(120);
    const rule = _vestingRules.find((r) => r.companyNumber === companyNumber);
    return rule ? { ...rule } : null;
  },

  update: async (rule: VestingRule): Promise<VestingRule> => {
    await delay(350);

    for (let i = 1; i <= 10; i += 1) {
      const key = `year${i}` as keyof VestingRule;
      const value = Number(rule[key]);
      if (Number.isNaN(value) || value < 0 || value > 100) {
        throw new Error(`Year ${i} must be a percentage between 0 and 100.`);
      }
    }

    const existing = _vestingRules.find((r) => r.companyNumber === rule.companyNumber);
    if (!existing) throw new Error('No vesting rules found for this company.');

    _vestingRules = _vestingRules.map((r) =>
      r.companyNumber === rule.companyNumber ? { ...rule } : r,
    );

    return { ...rule };
  },
};

// ── Employee Funds Withdrawal ────────────────────────────────────

export const employeeFundsWithdrawalApi = {
  estimate: async (
    companyNumber: string,
    employeeNumber: string,
    withdrawalDate: string,
  ): Promise<EmployeeFundsWithdrawalEstimate> => {
    await delay(500);

    const company = _companies.find((c) => c.companyNumber === companyNumber);
    if (!company) throw new Error('Company not found.');

    const employee = _employees.find(
      (e) => e.employeeNumber === employeeNumber && e.companyNumber === companyNumber,
    );
    if (!employee) throw new Error('Employee not found for this company.');

    const unitPrice = _unitPrices.find((u) => u.priceDate === withdrawalDate);
    if (!unitPrice) throw new Error('No unit price for the selected withdrawal date.');

    const rule = _vestingRules.find((r) => r.companyNumber === companyNumber);
    const vestingPct = rule ? (rule.year1 / 100) : 1;

    const factor = Number(employeeNumber.replace(/\D/g, '')) || 1;
    const rows: WithdrawalRow[] = [];

    for (let i = 1; i <= 10; i += 1) {
      const price = ((unitPrice as unknown) as Record<string, number>)[`fund${i}`] ?? 0;
      const employeeFundUnits = factor * (10 + i) * 0.4;
      const voluntaryEmployeeFundUnits = factor * (2.5 + i * 0.05);
      const employerFundUnits = factor * (15 + i) * 0.6;

      const employeeFundTotal = employeeFundUnits * price;
      const voluntaryEmployeeFundTotal = voluntaryEmployeeFundUnits * price;
      const employerFundTotal = employerFundUnits * price;

      const availableEmployeeFund = employeeFundTotal * vestingPct;
      const availableVoluntaryEmployeeFund = voluntaryEmployeeFundTotal * vestingPct;
      const availableEmployerFund = employerFundTotal * vestingPct;

      rows.push({
        fund: i,
        employeeFundUnits,
        voluntaryEmployeeFundUnits,
        employerFundUnits,
        unitPrice: price,
        employeeFundTotal,
        voluntaryEmployeeFundTotal,
        employerFundTotal,
        availableEmployeeFund,
        availableVoluntaryEmployeeFund,
        availableEmployerFund,
      });
    }

    const totalEmployeeFund = rows.reduce((s, r) => s + r.employeeFundTotal, 0);
    const totalVoluntaryEmployeeFund = rows.reduce((s, r) => s + r.voluntaryEmployeeFundTotal, 0);
    const totalEmployerFund = rows.reduce((s, r) => s + r.employerFundTotal, 0);
    const availableEmployeeFund = rows.reduce((s, r) => s + r.availableEmployeeFund, 0);
    const availableVoluntaryEmployeeFund = rows.reduce((s, r) => s + r.availableVoluntaryEmployeeFund, 0);
    const availableEmployerFund = rows.reduce((s, r) => s + r.availableEmployerFund, 0);

    return {
      companyNumber,
      companyName: company.companyName,
      employeeNumber,
      employeeName: employee.fullName,
      withdrawalDate,
      rows,
      charges: {
        ee: totalEmployeeFund * 0.02,
        voluntaryEE: totalVoluntaryEmployeeFund * 0.02,
        er: totalEmployerFund * 0.02,
      },
      maximumWithdrawalPercentage: 0.3,
      maximumWithdrawalCount: 5,
      withdrawalCountInPast365Days: Math.floor(Math.random() * 3),
      vestingRulePercentage: rule ? rule.year1 : 100,
      totalEmployeeFund,
      totalVoluntaryEmployeeFund,
      totalEmployerFund,
      availableEmployeeFund,
      availableVoluntaryEmployeeFund,
      availableEmployerFund,
    };
  },

  withdraw: async (
    companyNumber: string,
    employeeNumber: string,
    withdrawalDate: string,
    path: string,
  ): Promise<EmployeeFundsWithdrawalResult> => {
    await delay(450);
    if (!path.trim()) throw new Error('Path is required.');
    const company = _companies.find((c) => c.companyNumber === companyNumber);
    if (!company) throw new Error('Company not found.');
    return {
      reference: `W-${Date.now()}`,
      message: `Withdrawal recorded for ${employeeNumber} on ${withdrawalDate}.`,
    };
  },
};

// ── Estimate Employee Termination ────────────────────────────────

export const employeeTerminationApi = {
  estimate: async (
    companyNumber: string,
    employeeNumber: string,
    terminationDate: string,
    path: string,
  ): Promise<EmployeeTerminationEstimate> => {
    await delay(500);

    if (!path.trim()) throw new Error('Path is required.');

    const company = _companies.find((c) => c.companyNumber === companyNumber);
    if (!company) throw new Error('Company not found.');

    const employee = _employees.find(
      (e) => e.employeeNumber === employeeNumber && e.companyNumber === companyNumber,
    );
    if (!employee) throw new Error('Employee not found for this company.');

    const unitPrice = _unitPrices.find((u) => u.priceDate === terminationDate);
    if (!unitPrice) throw new Error('No unit price for the selected termination date.');

    const factor = Number(employeeNumber.replace(/\D/g, '')) || 1;
    const rows: TerminationFundRow[] = [];

    for (let i = 1; i <= 10; i += 1) {
      const price = ((unitPrice as unknown) as Record<string, number>)[`fund${i}`] ?? 0;
      const employeeFund = factor * (10 + i) * price;
      const voluntaryEmployeeFund = factor * (2.5 + i * 0.05) * price;
      const employerFund = factor * (15 + i) * price;

      rows.push({
        fund: i,
        employeeFund,
        voluntaryEmployeeFund,
        employerFund,
        unitPrice: price,
        total: employeeFund + voluntaryEmployeeFund + employerFund,
      });
    }

    const totalEmployeeFund = rows.reduce((s, r) => s + r.employeeFund, 0);
    const totalVoluntaryEmployeeFund = rows.reduce((s, r) => s + r.voluntaryEmployeeFund, 0);
    const totalEmployerFund = rows.reduce((s, r) => s + r.employerFund, 0);
    const total = totalEmployeeFund + totalVoluntaryEmployeeFund + totalEmployerFund;

    return {
      companyNumber,
      companyName: company.companyName,
      employeeNumber,
      employeeName: employee.fullName,
      terminationDate,
      path,
      rows,
      totalEmployeeFund,
      totalVoluntaryEmployeeFund,
      totalEmployerFund,
      total,
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
