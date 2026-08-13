import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilePlus2, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, invoicesApi } from '../../lib/api';
import { companiesApi } from '../../lib/companiesApi';
import { extractApiError } from '../../lib/httpClient';
import { mockExportContents, saveFileWithPicker, suggestedNameFromPath } from '../../lib/saveFile';
import type { Company, CreateInvoiceResult } from '../../types';

const MONTHS = [
  { value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' },
  { value: 4, label: '4' }, { value: 5, label: '5' }, { value: 6, label: '6' },
  { value: 7, label: '7' }, { value: 8, label: '8' }, { value: 9, label: '9' },
  { value: 10, label: '10' }, { value: 11, label: '11' }, { value: 12, label: '12' },
];

export default function CreateInvoice() {
  const now = new Date();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companyNumber, setCompanyNumber] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateInvoiceResult | null>(null);

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

  const range = useMemo(() => dateHelpers.monthRange(year, month), [year, month]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!companyNumber) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await invoicesApi.create({
        companyNumber,
        year,
        month,
        dateFrom: range.dateFrom,
        dateTo: range.dateTo,
        path: path || undefined,
      });
      const saved = await saveFileWithPicker({
        suggestedName: suggestedNameFromPath(path, `${res.invoiceNumber}.txt`),
        contents: mockExportContents('Create Invoice', {
          invoiceNumber: res.invoiceNumber,
          companyNumber,
          year,
          month,
        }),
      });
      if (saved === 'cancelled') {
        setResult(res);
        return;
      }
      setResult(res);
      setCompanyNumber('');
      setPath('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invoice could not be created');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={FilePlus2}
          title="Create Invoice"
          subtitle="Generate a contribution invoice for a company and billing month."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 560 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Company Number" required>
              <select
                className="kaf-input kaf-select"
                value={companyNumber}
                onChange={(e) => setCompanyNumber(e.target.value)}
                disabled={loading || companiesLoading}
              >
                <option value="">{companiesLoading ? 'Loading companies…' : 'Select company…'}</option>
                {companies.map((c) => (
                  <option key={c.companyNumber} value={c.companyNumber}>
                    {c.companyNumber} — {c.companyName}
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '176px 176px', gap: 14, alignItems: 'end' }}>
              <Field label="Month" required>
                <select
                  className="kaf-input kaf-select"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  disabled={loading}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Year" required>
                <input
                  className="kaf-input"
                  type="number"
                  min={2000}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())}
                  disabled={loading}
                />
              </Field>
            </div>

            <Field label="Path">
              <input
                className="kaf-input"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="Optional — choose location in the save dialog"
                disabled={loading}
              />
            </Field>

            <div style={{
              marginTop: 4, paddingTop: 14,
              borderTop: '1px solid var(--kaf-border)',
            }}>
              <p className="kaf-section-head" style={{ marginBottom: 12 }}>Invoice Range</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Start date">
                  <input className="kaf-input" readOnly value={dateHelpers.formatDisplay(range.dateFrom)} />
                </Field>
                <Field label="End date">
                  <input className="kaf-input" readOnly value={dateHelpers.formatDisplay(range.dateTo)} />
                </Field>
              </div>
            </div>

            {error && (
              <div className="kaf-callout error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button type="submit" className="kaf-btn" disabled={loading} style={{ width: '100%', marginTop: 6 }}>
              {loading
                ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Creating…</>
                : <><FilePlus2 size={14} /> Create Invoice</>}
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="kaf-callout ok"
            style={{ marginTop: 16, maxWidth: 560, display: 'flex', alignItems: 'flex-start', gap: 10 }}
          >
            <CheckCircle2 size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600 }}>Invoice created successfully.</div>
              <div style={{ fontSize: 12.5, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                {result.invoiceNumber} · {result.employeeLineCount} employee line(s) · EGP {result.egpAmount.toLocaleString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="kaf-label">
        {label}{required ? <span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span> : null}
      </label>
      {children}
    </div>
  );
}
