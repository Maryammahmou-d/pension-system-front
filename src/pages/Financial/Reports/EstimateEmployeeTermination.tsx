import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Calculator, AlertCircle } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import { dateHelpers, employeeTerminationApi, lookupsApi } from '../../../lib/api';
import type { CompanySummary, EmployeeSummary, EmployeeTerminationEstimate } from '../../../types';

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export default function EstimateEmployeeTermination() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [companyNumber, setCompanyNumber] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [terminationDate, setTerminationDate] = useState(dateHelpers.todayIso());
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmployeeTerminationEstimate | null>(null);

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
    setError(null);
  };

  const handleEstimate = async () => {
    setError(null);
    setResult(null);

    if (!companyNumber) return setError('Company Number is required.');
    if (!employeeNumber) return setError('Employee Number is required.');
    if (!terminationDate) return setError('Termination Date is required.');
    if (!path.trim()) return setError('Path is required.');

    setLoading(true);
    try {
      const res = await employeeTerminationApi.estimate(companyNumber, employeeNumber, terminationDate, path);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Estimate failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={Users}
          title="Estimate Employee Termination"
          subtitle="Estimate termination fund totals for an employee."
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
              disabled={loading}
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
            <label className="kaf-label">Employee Number</label>
            <select
              className="kaf-input kaf-select"
              value={employeeNumber}
              onChange={(e) => { setEmployeeNumber(e.target.value); setResult(null); setError(null); }}
              disabled={loading || !companyNumber}
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
              Termination Date<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
            </label>
            <input
              className="kaf-input"
              type="date"
              value={terminationDate}
              onChange={(e) => { setTerminationDate(e.target.value); setResult(null); setError(null); }}
              disabled={loading}
            />
          </div>

          <div>
            <label className="kaf-label">
              Path<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
            </label>
            <input
              className="kaf-input"
              value={path}
              onChange={(e) => { setPath(e.target.value); setResult(null); setError(null); }}
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="button"
          className="kaf-btn"
          onClick={handleEstimate}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? (
            <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Estimating…</>
          ) : (
            <><Calculator size={14} /> Estimate Employee Termination Funds</>
          )}
        </button>

        {error && (
          <div className="kaf-callout error" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}
      </div>

      {result && (
        <div className="kaf-card" style={{ padding: '20px 22px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '70px repeat(4, minmax(0, 1fr))',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <div className="kaf-label" style={{ textAlign: 'left' }}>Fund</div>
            <div className="kaf-label" style={{ textAlign: 'center' }}>Employee Fund</div>
            <div className="kaf-label" style={{ textAlign: 'center' }}>Voluntary Employee Fund</div>
            <div className="kaf-label" style={{ textAlign: 'center' }}>Employer Fund</div>
            <div className="kaf-label" style={{ textAlign: 'center' }}>Unit Price</div>

            {result.rows.map((row) => (
              <>
                <div key={`f${row.fund}-label`} className="kaf-label" style={{ textAlign: 'left' }}>Fund {row.fund}</div>
                <input key={`f${row.fund}-ee`} className="kaf-input" readOnly value={fmt(row.employeeFund)} style={{ textAlign: 'right', padding: 4, fontSize: 12 }} />
                <input key={`f${row.fund}-vee`} className="kaf-input" readOnly value={fmt(row.voluntaryEmployeeFund)} style={{ textAlign: 'right', padding: 4, fontSize: 12 }} />
                <input key={`f${row.fund}-er`} className="kaf-input" readOnly value={fmt(row.employerFund)} style={{ textAlign: 'right', padding: 4, fontSize: 12 }} />
                <input key={`f${row.fund}-price`} className="kaf-input" readOnly value={fmt(row.unitPrice)} style={{ textAlign: 'right', padding: 4, fontSize: 12 }} />
              </>
            ))}

            <div className="kaf-label" style={{ textAlign: 'left' }}>Total</div>
            <input className="kaf-input" readOnly value={fmt(result.totalEmployeeFund)} style={{ textAlign: 'right', padding: 4, fontSize: 12 }} />
            <input className="kaf-input" readOnly value={fmt(result.totalVoluntaryEmployeeFund)} style={{ textAlign: 'right', padding: 4, fontSize: 12 }} />
            <input className="kaf-input" readOnly value={fmt(result.totalEmployerFund)} style={{ textAlign: 'right', padding: 4, fontSize: 12 }} />
            <input className="kaf-input" readOnly value={fmt(result.rows.reduce((s, r) => s + r.unitPrice, 0) / 10)} style={{ textAlign: 'right', padding: 4, fontSize: 12 }} />
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="kaf-label">Estimated total funds</label>
            <input className="kaf-input" readOnly value={fmt(result.total)} style={{ maxWidth: 300, textAlign: 'right', background: 'var(--kaf-surface-3)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
