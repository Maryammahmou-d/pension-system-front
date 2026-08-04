import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, employeeFundsWithdrawalApi, lookupsApi } from '../../lib/api';
import type { CompanySummary, EmployeeSummary, EmployeeFundsWithdrawalEstimate, EmployeeFundsWithdrawalResult } from '../../types';

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export default function EmployeeFundsWithdrawal() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [companyNumber, setCompanyNumber] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [withdrawalDate, setWithdrawalDate] = useState(dateHelpers.todayIso());
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmployeeFundsWithdrawalEstimate | null>(null);
  const [withdrawResult, setWithdrawResult] = useState<EmployeeFundsWithdrawalResult | null>(null);

  useEffect(() => {
    void lookupsApi.listCompanies(true).then(setCompanies).catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    if (!companyNumber) {
      setEmployees([]);
      return;
    }
    void lookupsApi.listEmployees(companyNumber).then(setEmployees).catch(() => setEmployees([]));
  }, [companyNumber]);

  const onCompanyChange = (value: string) => {
    setCompanyNumber(value);
    setEmployeeNumber('');
    setResult(null);
    setWithdrawResult(null);
    setError(null);
  };

  const handleEstimate = async () => {
    setError(null);
    setResult(null);
    setWithdrawResult(null);

    if (!companyNumber) return setError('Company Number is required.');
    if (!employeeNumber) return setError('Employee Number is required.');
    if (!withdrawalDate) return setError('Withdrawal Date is required.');

    setLoading(true);
    try {
      const res = await employeeFundsWithdrawalApi.estimate(companyNumber, employeeNumber, withdrawalDate);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Estimate failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setError(null);
    setWithdrawResult(null);

    if (!result) return;
    if (!path.trim()) return setError('Path is required.');

    setWithdrawing(true);
    try {
      const res = await employeeFundsWithdrawalApi.withdraw(companyNumber, employeeNumber, withdrawalDate, path);
      setWithdrawResult(res);
      setPath('');
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
          subtitle="Estimate and process an employee funds withdrawal."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="kaf-label">
              Company Number<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
            </label>
            <select
              className="kaf-input kaf-select"
              value={companyNumber}
              onChange={(e) => onCompanyChange(e.target.value)}
              disabled={loading || withdrawing}
            >
              <option value="">Select company…</option>
              {companies.map((c) => (
                <option key={c.companyNumber} value={c.companyNumber}>
                  {c.companyNumber} — {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="kaf-label">
              Employee Number<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
            </label>
            <select
              className="kaf-input kaf-select"
              value={employeeNumber}
              onChange={(e) => { setEmployeeNumber(e.target.value); setResult(null); setWithdrawResult(null); }}
              disabled={loading || withdrawing || !companyNumber}
            >
              <option value="">Select employee…</option>
              {employees.map((e) => (
                <option key={e.employeeNumber} value={e.employeeNumber}>
                  {e.employeeNumber} — {e.fullName}
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
              onChange={(e) => { setWithdrawalDate(e.target.value); setResult(null); setWithdrawResult(null); }}
              disabled={loading || withdrawing}
            />
          </div>
        </div>

        <button
          type="button"
          className="kaf-btn"
          onClick={handleEstimate}
          disabled={loading || withdrawing}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
        >
          {loading ? (
            <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Estimating…</>
          ) : (
            <><Calculator size={14} /> Estimate</>
          )}
        </button>

        {error && (
          <div className="kaf-callout error" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}
      </div>

      {result && (
        <div className="kaf-card" style={{ padding: '20px 22px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 600px', overflowX: 'auto' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px repeat(12, minmax(90px, 1fr))',
                  gap: 4,
                  minWidth: 1100,
                }}
              >
                <div></div>
                <div className="kaf-label" style={{ textAlign: 'center', gridColumn: '2 / span 3' }}>Total Units</div>
                <div className="kaf-label" style={{ textAlign: 'center', gridColumn: '5 / span 1' }}>Unit Price</div>
                <div className="kaf-label" style={{ textAlign: 'center', gridColumn: '6 / span 3' }}>Total Funds</div>
                <div className="kaf-label" style={{ textAlign: 'center', gridColumn: '9 / span 3' }}>Available for withdrawal</div>
                <div className="kaf-label" style={{ textAlign: 'center', gridColumn: '12 / span 3' }}>Withdrawal</div>

                <div className="kaf-label" style={{ textAlign: 'left' }}>Fund</div>
                {['Employee Fund', 'Voluntary Employee Fund', 'Employer Fund'].map((h, i) => (
                  <div key={`u${i}`} className="kaf-label" style={{ textAlign: 'center' }}>{h}</div>
                ))}
                <div key="up" className="kaf-label" style={{ textAlign: 'center' }}>Unit Price</div>
                {['Employee Fund', 'Voluntary Employee Fund', 'Employer Fund'].map((h, i) => (
                  <div key={`t${i}`} className="kaf-label" style={{ textAlign: 'center' }}>{h}</div>
                ))}
                {['Employee Fund', 'Voluntary Employee Fund', 'Employer Fund'].map((h, i) => (
                  <div key={`a${i}`} className="kaf-label" style={{ textAlign: 'center' }}>{h}</div>
                ))}
                {['Employee Fund', 'Voluntary Employee Fund', 'Employer Fund'].map((h, i) => (
                  <div key={`w${i}`} className="kaf-label" style={{ textAlign: 'center' }}>{h}</div>
                ))}

                {result.rows.map((row) => (
                  <>
                    <div key={`f${row.fund}-label`} className="kaf-label" style={{ textAlign: 'left' }}>Fund {row.fund}</div>
                    <input key={`f${row.fund}-eu`} className="kaf-input" readOnly value={fmt(row.employeeFundUnits)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                    <input key={`f${row.fund}-vu`} className="kaf-input" readOnly value={fmt(row.voluntaryEmployeeFundUnits)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                    <input key={`f${row.fund}-eru`} className="kaf-input" readOnly value={fmt(row.employerFundUnits)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                    <input key={`f${row.fund}-price`} className="kaf-input" readOnly value={fmt(row.unitPrice)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                    <input key={`f${row.fund}-et`} className="kaf-input" readOnly value={fmt(row.employeeFundTotal)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                    <input key={`f${row.fund}-vt`} className="kaf-input" readOnly value={fmt(row.voluntaryEmployeeFundTotal)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                    <input key={`f${row.fund}-ert`} className="kaf-input" readOnly value={fmt(row.employerFundTotal)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                    <input key={`f${row.fund}-ea`} className="kaf-input" readOnly value={fmt(row.availableEmployeeFund)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                    <input key={`f${row.fund}-va`} className="kaf-input" readOnly value={fmt(row.availableVoluntaryEmployeeFund)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                    <input key={`f${row.fund}-era`} className="kaf-input" readOnly value={fmt(row.availableEmployerFund)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                    <input key={`f${row.fund}-ew`} className="kaf-input" readOnly value={fmt(0)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                    <input key={`f${row.fund}-vw`} className="kaf-input" readOnly value={fmt(0)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                    <input key={`f${row.fund}-erw`} className="kaf-input" readOnly value={fmt(0)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                  </>
                ))}

                <div key="total-label" className="kaf-label" style={{ textAlign: 'left' }}></div>
                <div key="total-eeu" className="kaf-label" style={{ textAlign: 'right' }}></div>
                <div key="total-veu" className="kaf-label" style={{ textAlign: 'right' }}></div>
                <div key="total-eru" className="kaf-label" style={{ textAlign: 'right' }}></div>
                <div key="total-price" className="kaf-label" style={{ textAlign: 'right' }}></div>
                <input key="total-ee" className="kaf-input" readOnly value={fmt(result.totalEmployeeFund)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                <input key="total-vee" className="kaf-input" readOnly value={fmt(result.totalVoluntaryEmployeeFund)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                <input key="total-er" className="kaf-input" readOnly value={fmt(result.totalEmployerFund)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                <input key="total-eea" className="kaf-input" readOnly value={fmt(result.availableEmployeeFund)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                <input key="total-veea" className="kaf-input" readOnly value={fmt(result.availableVoluntaryEmployeeFund)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                <input key="total-era" className="kaf-input" readOnly value={fmt(result.availableEmployerFund)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                <input key="total-eew" className="kaf-input" readOnly value={fmt(0)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                <input key="total-veew" className="kaf-input" readOnly value={fmt(0)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
                <input key="total-erw" className="kaf-input" readOnly value={fmt(0)} style={{ textAlign: 'right', padding: 4, fontSize: 11 }} />
              </div>
            </div>

            <div style={{ width: 280, flexShrink: 0 }}>
              <div className="kaf-card" style={{ padding: 16 }}>
                <h3 className="kaf-section-head" style={{ marginBottom: 12 }}>Withdrawal Details</h3>
                <div style={{ display: 'grid', gap: 10 }}>
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
                      <input className="kaf-input" readOnly value={fmt(result.maximumWithdrawalPercentage * 100)} style={{ textAlign: 'right' }} />
                      <span>%</span>
                    </div>
                  </div>
                  <div>
                    <label className="kaf-label">Maximum Withdrawal Count</label>
                    <input className="kaf-input" readOnly value={result.maximumWithdrawalCount} style={{ textAlign: 'right' }} />
                  </div>
                  <div>
                    <label className="kaf-label">Withdrawal Count in past 365 days</label>
                    <input className="kaf-input" readOnly value={result.withdrawalCountInPast365Days} style={{ textAlign: 'right' }} />
                  </div>
                  <div>
                    <label className="kaf-label">Vesting Rule</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input className="kaf-input" readOnly value={fmt(result.vestingRulePercentage)} style={{ textAlign: 'right' }} />
                      <span>%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="kaf-label">
              Path<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
            </label>
            <input
              className="kaf-input"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              disabled={withdrawing}
              style={{ marginBottom: 12 }}
            />
            <button
              type="button"
              className="kaf-btn"
              onClick={handleWithdraw}
              disabled={withdrawing}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {withdrawing ? (
                <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Withdrawing…</>
              ) : (
                <><Banknote size={14} /> Withdraw</>
              )}
            </button>
          </div>

          {withdrawResult && (
            <div className="kaf-callout ok" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={16} /> {withdrawResult.reference} — {withdrawResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
