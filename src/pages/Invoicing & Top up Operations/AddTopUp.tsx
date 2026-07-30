import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, lookupsApi, topUpsApi } from '../../lib/api';
import type { CompanySummary, EmployeeSummary, TopUpResult } from '../../types';

export default function AddTopUp() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [companyNumber, setCompanyNumber] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [topUpDate, setTopUpDate] = useState(dateHelpers.todayIso());
  const [topUpEE, setTopUpEE] = useState('0.00');
  const [topUpVEE, setTopUpVEE] = useState('0.00');
  const [topUpER, setTopUpER] = useState('0.00');
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TopUpResult | null>(null);

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

  const total = useMemo(() => {
    const ee = Number(topUpEE) || 0;
    const vee = Number(topUpVEE) || 0;
    const er = Number(topUpER) || 0;
    return ee + vee + er;
  }, [topUpEE, topUpVEE, topUpER]);

  const onCompanyChange = (value: string) => {
    setCompanyNumber(value);
    setEmployeeNumber('');
    setTopUpEE('0.00');
    setTopUpVEE('0.00');
    setTopUpER('0.00');
    setPath('');
    setTopUpDate(dateHelpers.todayIso());
    setError(null);
    setResult(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!companyNumber || !employeeNumber || !topUpDate) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const res = await topUpsApi.create({
        companyNumber,
        employeeNumber,
        topUpDate,
        topUpEE: Number(topUpEE) || 0,
        topUpVEE: Number(topUpVEE) || 0,
        topUpER: Number(topUpER) || 0,
        path: path || undefined,
      });
      setResult(res);
      setCompanyNumber('');
      setEmployeeNumber('');
      setTopUpEE('0.00');
      setTopUpVEE('0.00');
      setTopUpER('0.00');
      setPath('');
      setTopUpDate(dateHelpers.todayIso());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Top up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={Wallet}
          title="Top Up"
          subtitle="Add a voluntary / employer / employee top-up for a single member."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '20px 22px', maxWidth: 760 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <Field label="Company Number" required span={2}>
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
            </Field>

            <Field label="Employee Number" required span={2}>
              <select
                className="kaf-input kaf-select"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                disabled={loading || !companyNumber}
              >
                <option value="">Select employee…</option>
                {employees.map((e) => (
                  <option key={e.employeeNumber} value={e.employeeNumber}>
                    {e.employeeNumber} — {e.fullName}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Top Up Date" required>
              <input
                className="kaf-input"
                type="date"
                value={topUpDate}
                onChange={(e) => setTopUpDate(e.target.value)}
                disabled={loading}
              />
            </Field>

            <Field label="Top Up EE" required>
              <input
                className="kaf-input"
                type="number"
                step="0.01"
                min="0"
                value={topUpEE}
                onChange={(e) => setTopUpEE(e.target.value)}
                disabled={loading}
              />
            </Field>

            <Field label="Top Up VEE" required>
              <input
                className="kaf-input"
                type="number"
                step="0.01"
                min="0"
                value={topUpVEE}
                onChange={(e) => setTopUpVEE(e.target.value)}
                disabled={loading}
              />
            </Field>

            <Field label="Top Up ER" required>
              <input
                className="kaf-input"
                type="number"
                step="0.01"
                min="0"
                value={topUpER}
                onChange={(e) => setTopUpER(e.target.value)}
                disabled={loading}
              />
            </Field>

            <Field label="Total">
              <input
                className="kaf-input"
                readOnly
                value={total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              />
            </Field>

            <Field label="Path" span={2}>
              <input
                className="kaf-input"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="Optional report label"
                disabled={loading}
              />
            </Field>

            {error && (
              <div className="kaf-callout error" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button type="submit" className="kaf-btn" disabled={loading} style={{ gridColumn: '1 / -1', width: '100%', marginTop: 2 }}>
              {loading
                ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Saving…</>
                : <><Wallet size={14} /> Add Top Up</>}
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="kaf-callout ok"
            style={{ marginTop: 16, maxWidth: 560, display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <CheckCircle2 size={16} />
            Top-up recorded for {result.employeeNumber} · total {result.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label, required, children, span = 1,
}: { label: string; required?: boolean; children: React.ReactNode; span?: 1 | 2 }) {
  return (
    <div style={span === 2 ? { gridColumn: '1 / -1' } : undefined}>
      <label className="kaf-label">
        {label}{required ? <span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span> : null}
      </label>
      {children}
    </div>
  );
}
