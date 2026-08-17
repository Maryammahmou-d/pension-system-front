import type { CSSProperties, ReactNode } from 'react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, employeeFundsWithdrawalApi } from '../../lib/api';
import { companiesApi } from '../../lib/companiesApi';
import { employeesApi } from '../../lib/employeesApi';
import { extractApiError } from '../../lib/httpClient';
import { requestSaveLocation, suggestedNameFromPath, writeSaveLocation } from '../../lib/saveFile';
import { buildWithdrawalPdf } from '../../lib/withdrawalPdf';
import type { Company, Employee, EmployeeFundsWithdrawalEstimate, WithdrawalRow } from '../../types';

const FUNDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

const numFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const intFmt = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

function fmt(n: number): string {
  return numFmt.format(n ?? 0);
}

function pct(n: number): string {
  const display = n <= 1 ? n * 100 : n;
  return numFmt.format(display);
}

type AmountKey = 'ee' | 'vee' | 'er';
type Amounts = Record<number, { ee: string; vee: string; er: string }>;

function emptyAmounts(): Amounts {
  return Object.fromEntries(FUNDS.map((f) => [f, { ee: '0', vee: '0', er: '0' }])) as Amounts;
}

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const emptyRow = (fund: number): WithdrawalRow => ({
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
});

const heading: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--kaf-muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  textAlign: 'center',
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const rowLabel: CSSProperties = {
  ...heading,
  justifyContent: 'flex-start',
  textAlign: 'left',
};

const ROW_H = 34;

const cellInput: CSSProperties = {
  textAlign: 'right',
  padding: '0 8px',
  fontSize: 12,
  width: '100%',
  minWidth: 0,
  height: ROW_H,
  boxSizing: 'border-box',
};

const section: CSSProperties = {
  display: 'grid',
  rowGap: 8,
  columnGap: 6,
  alignItems: 'center',
  gridAutoRows: ROW_H,
};

const divider: CSSProperties = {
  width: 1,
  alignSelf: 'stretch',
  background: 'var(--kaf-text)',
  flexShrink: 0,
};

const GROUP_HEADERS = ['Employee Fund', 'Voluntary Employee Fund', 'Employer Fund'] as const;

function HeaderCell({ children, style }: { children?: string; style?: CSSProperties }) {
  return <div style={{ ...heading, ...style }}>{children ?? '\u00a0'}</div>;
}

function FundLabels({ rows }: { rows: WithdrawalRow[] }) {
  return (
    <div style={{ ...section, gridTemplateColumns: '72px' }}>
      <HeaderCell style={rowLabel} />
      <HeaderCell style={rowLabel}>Fund</HeaderCell>
      {rows.map((row) => (
        <div key={row.fund} style={rowLabel}>Fund {row.fund}</div>
      ))}
    </div>
  );
}

function ThreeColGroup({
  title,
  rows,
  values,
}: {
  title: string;
  rows: WithdrawalRow[];
  values: (row: WithdrawalRow) => number[];
}) {
  return (
    <div style={{ ...section, gridTemplateColumns: 'repeat(3, minmax(88px, 1fr))', flex: 1 }}>
      <HeaderCell style={{ gridColumn: '1 / -1' }}>{title}</HeaderCell>
      {GROUP_HEADERS.map((label) => (
        <HeaderCell key={`${title}-${label}`}>{label}</HeaderCell>
      ))}
      {rows.map((row) => (
        <Fragment key={`${title}-${row.fund}`}>
          {values(row).map((value, i) => (
            <input
              key={`${title}-${row.fund}-${i}`}
              className="kaf-input"
              readOnly
              value={fmt(value)}
              style={cellInput}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
}

function WithdrawalGrid({
  rows,
  amounts,
  onChange,
  rules,
}: {
  rows: WithdrawalRow[];
  amounts: Amounts;
  onChange: (fund: number, field: AmountKey, value: string) => void;
  rules: ReactNode;
}) {
  const byFund = FUNDS.map((fund) => rows.find((r) => r.fund === fund) ?? emptyRow(fund));

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ overflowX: 'auto', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, minWidth: 520 }}>
            <FundLabels rows={byFund} />
            <ThreeColGroup
              title="Total Units"
              rows={byFund}
              values={(row) => [row.employeeFundUnits, row.voluntaryEmployeeFundUnits, row.employerFundUnits]}
            />
            <div style={divider} />
            <div style={{ ...section, gridTemplateColumns: '88px' }}>
              <HeaderCell>Unit Price</HeaderCell>
              <HeaderCell />
              {byFund.map((row) => (
                <input
                  key={`up-${row.fund}`}
                  className="kaf-input"
                  readOnly
                  value={fmt(row.unitPrice)}
                  style={cellInput}
                />
              ))}
            </div>
          </div>
        </div>
        {rules}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, minWidth: 980 }}>
          <FundLabels rows={byFund} />
          <ThreeColGroup
            title="Total Funds"
            rows={byFund}
            values={(row) => [row.employeeFundTotal, row.voluntaryEmployeeFundTotal, row.employerFundTotal]}
          />
          <div style={divider} />
          <ThreeColGroup
            title="Available for withdrawal"
            rows={byFund}
            values={(row) => [row.availableEmployeeFund, row.availableVoluntaryEmployeeFund, row.availableEmployerFund]}
          />
          <div style={divider} />
          <div style={{ ...section, gridTemplateColumns: 'repeat(3, minmax(88px, 1fr))', flex: 1 }}>
            <HeaderCell style={{ gridColumn: '1 / -1' }}>Withdrawal</HeaderCell>
            {GROUP_HEADERS.map((label) => (
              <HeaderCell key={`w-${label}`}>{label}</HeaderCell>
            ))}
            {byFund.map((row) => (
              <Fragment key={`w-${row.fund}`}>
                {(['ee', 'vee', 'er'] as AmountKey[]).map((field) => (
                  <input
                    key={`${row.fund}-w-${field}`}
                    className="kaf-input"
                    value={amounts[row.fund][field]}
                    onChange={(e) => onChange(row.fund, field, e.target.value)}
                    style={cellInput}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeFundsWithdrawal() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [companyNumber, setCompanyNumber] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [withdrawalDate, setWithdrawalDate] = useState(dateHelpers.todayIso());
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<EmployeeFundsWithdrawalEstimate | null>(null);
  const [amounts, setAmounts] = useState<Amounts>(emptyAmounts());
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setCompaniesLoading(true);
    companiesApi
      .getLatest()
      .then((list) => {
        if (!cancelled) setCompanies(list);
      })
      .catch((err) => {
        if (!cancelled) setError(extractApiError(err, 'Failed to load companies.'));
      })
      .finally(() => {
        if (!cancelled) setCompaniesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!companyNumber) {
      setEmployees([]);
      return;
    }
    let cancelled = false;
    setEmployeesLoading(true);
    employeesApi
      .getByCompanyNumber(companyNumber)
      .then((list) => {
        if (!cancelled) setEmployees(list);
      })
      .catch((err) => {
        if (!cancelled) setError(extractApiError(err, 'Failed to load employees.'));
      })
      .finally(() => {
        if (!cancelled) setEmployeesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyNumber]);

  useEffect(() => {
    if (success || error) {
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [success, error]);

  const onCompanyChange = (value: string) => {
    setCompanyNumber(value);
    setEmployeeNumber('');
    setResult(null);
    setAmounts(emptyAmounts());
    setError(null);
    setSuccess(null);
  };

  const handleEstimate = async () => {
    setError(null);
    setSuccess(null);
    setResult(null);

    if (!companyNumber) return setError('Company Number is required.');
    if (!employeeNumber) return setError('Employee Number is required.');
    if (!withdrawalDate) return setError('Withdrawal Date is required.');

    setLoading(true);
    try {
      const res = await employeeFundsWithdrawalApi.estimate(companyNumber, employeeNumber, withdrawalDate);
      setResult(res);
      setAmounts(emptyAmounts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Estimate failed.');
    } finally {
      setLoading(false);
    }
  };

  const setAmount = (fund: number, field: AmountKey, value: string) => {
    setAmounts((prev) => ({ ...prev, [fund]: { ...prev[fund], [field]: value } }));
    setError(null);
    setSuccess(null);
  };

  const handleWithdraw = async () => {
    if (!result) return;
    setError(null);
    setSuccess(null);

    const payload = FUNDS.map((fund) => ({
      fund,
      employeeFund: toNumber(amounts[fund].ee),
      voluntaryEmployeeFund: toNumber(amounts[fund].vee),
      employerFund: toNumber(amounts[fund].er),
    }));

    for (const row of result.rows) {
      const take = payload.find((p) => p.fund === row.fund);
      if (!take) continue;
      if (take.employeeFund > row.availableEmployeeFund + 0.01
        || take.voluntaryEmployeeFund > row.availableVoluntaryEmployeeFund + 0.01
        || take.employerFund > row.availableEmployerFund + 0.01) {
        setError('Withdrawal cannot exceed available funds.');
        return;
      }
    }
    if (payload.every((p) => p.employeeFund + p.voluntaryEmployeeFund + p.employerFund <= 0)) {
      setError('Please enter a withdrawal amount.');
      return;
    }

    setWithdrawing(true);
    try {
      const location = await requestSaveLocation({
        suggestedName: suggestedNameFromPath(path, `Employee_Funds_Withdrawal_${employeeNumber}.pdf`),
        mimeType: 'application/pdf',
      });
      if (location.mode === 'cancelled') {
        return;
      }

      await employeeFundsWithdrawalApi.withdraw(companyNumber, employeeNumber, withdrawalDate, payload);
      const numericAmounts = Object.fromEntries(
        FUNDS.map((fund) => [fund, {
          ee: toNumber(amounts[fund].ee),
          vee: toNumber(amounts[fund].vee),
          er: toNumber(amounts[fund].er),
        }]),
      ) as Record<number, { ee: number; vee: number; er: number }>;
      setAmounts(emptyAmounts());
      try {
        const refreshed = await employeeFundsWithdrawalApi.estimate(companyNumber, employeeNumber, withdrawalDate);
        setResult(refreshed);
      } catch {
        /* keep the estimate already on screen if refresh fails */
      }
      const pdf = await buildWithdrawalPdf(result, numericAmounts);
      await writeSaveLocation(location, pdf);
      setSuccess(`Employee Funds Withdrawal PDF saved for ${employeeNumber}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed.');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={Banknote}
          title="Employee Funds Withdrawal"
          subtitle="Estimate available funds and process a withdrawal."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="kaf-label">
              Company Number<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
            </label>
            <select
              className="kaf-input kaf-select"
              value={companyNumber}
              onChange={(e) => onCompanyChange(e.target.value)}
              disabled={loading || withdrawing || companiesLoading}
            >
              <option value="">{companiesLoading ? 'Loading companies…' : 'Select company…'}</option>
              {companies.map((c) => (
                <option key={c.companyNumber} value={c.companyNumber}>
                  {c.companyNumber} — {c.companyName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="kaf-label">
              Employee Name<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
            </label>
            <select
              className="kaf-input kaf-select"
              value={employeeNumber}
              onChange={(e) => { setEmployeeNumber(e.target.value); setResult(null); setSuccess(null); }}
              disabled={loading || withdrawing || !companyNumber || employeesLoading}
            >
              <option value="">
                {!companyNumber ? 'Select company first' : employeesLoading ? 'Loading employees…' : 'Select employee…'}
              </option>
              {employees.map((e) => (
                <option key={e.employeeNumber} value={e.employeeNumber}>
                  {e.fullName} — {e.employeeNumber}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="kaf-label">
              Withdrawal Date<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
            </label>
            <input
              className="kaf-input"
              type="date"
              value={withdrawalDate}
              onChange={(e) => { setWithdrawalDate(e.target.value); setResult(null); setSuccess(null); }}
              disabled={loading || withdrawing}
            />
          </div>
          <div>
            <label className="kaf-label">Path</label>
            <input
              className="kaf-input"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="Optional — choose location in the save dialog"
              disabled={loading || withdrawing}
            />
          </div>
        </div>

        <button
          type="button"
          className="kaf-btn"
          onClick={handleEstimate}
          disabled={loading || withdrawing}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? (
            <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Estimating…</>
          ) : (
            <><Calculator size={14} /> Estimate</>
          )}
        </button>
      </div>

      {result && (
        <div className="kaf-card" style={{ padding: '20px 22px' }}>
          <WithdrawalGrid
            rows={result.rows}
            amounts={amounts}
            onChange={setAmount}
            rules={(
              <div style={{ width: 240, flexShrink: 0, display: 'grid', gap: 10 }}>
                <div>
                  <label className="kaf-label">Withdrawal Charge EE</label>
                  <input className="kaf-input" readOnly value={fmt(result.charges.ee)} style={{ textAlign: 'right' }} />
                </div>
                <div>
                  <label className="kaf-label">Withdrawal Charge Voluntary EE</label>
                  <input className="kaf-input" readOnly value={fmt(result.charges.voluntaryEE)} style={{ textAlign: 'right' }} />
                </div>
                <div>
                  <label className="kaf-label">Withdrawal Charge ER</label>
                  <input className="kaf-input" readOnly value={fmt(result.charges.er)} style={{ textAlign: 'right' }} />
                </div>
                <div>
                  <label className="kaf-label">Maximum Withdrawal Percentage</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input className="kaf-input" readOnly value={pct(result.maximumWithdrawalPercentage)} style={{ textAlign: 'right' }} />
                    <span>%</span>
                  </div>
                </div>
                <div>
                  <label className="kaf-label">Maximum Withdrawal Count</label>
                  <input className="kaf-input" readOnly value={intFmt.format(result.maximumWithdrawalCount)} style={{ textAlign: 'right' }} />
                </div>
                <div>
                  <label className="kaf-label">Withdrawal Count in the past 365 days</label>
                  <input className="kaf-input" readOnly value={String(result.withdrawalCountInPast365Days)} style={{ textAlign: 'right' }} />
                </div>
                <div>
                  <label className="kaf-label">Vesting Rule</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input className="kaf-input" readOnly value={fmt(result.vestingRulePercentage)} style={{ textAlign: 'right' }} />
                    <span>%</span>
                  </div>
                </div>
              </div>
            )}
          />

          <button
            type="button"
            className="kaf-btn"
            onClick={handleWithdraw}
            disabled={withdrawing}
            style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
          >
            {withdrawing ? (
              <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Withdrawing…</>
            ) : (
              <><Banknote size={14} /> Withdraw</>
            )}
          </button>
        </div>
      )}

      <div ref={messageRef}>
        {error && (
          <div className="kaf-callout error" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div className="kaf-callout ok" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={16} /> {success}
          </div>
        )}
      </div>
    </div>
  );
}
