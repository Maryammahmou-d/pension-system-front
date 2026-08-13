import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { companiesApi } from '../../lib/companiesApi';
import { contributionsApi } from '../../lib/contributionsApi';
import { extractApiError } from '../../lib/httpClient';
import type { Company, CreateContributionRequest } from '../../types';

interface Contribution {
  companyNumber: string;
  category: string;
  ee: string;
  er: string;
}

interface FormState {
  companyNumber: string;
  category: string;
  ee: string;
  er: string;
}

const emptyState = (): FormState => ({
  companyNumber: '',
  category: '',
  ee: '0.00',
  er: '0.00',
});

export default function AddContributions() {
  const [s, setS] = useState<FormState>(emptyState());
  const [rows, setRows] = useState<Contribution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCompaniesLoading(true);
    companiesApi
      .getLatest()
      .then((list) => {
        if (cancelled) return;
        setCompanies(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiError(err, 'Failed to load companies.'));
      })
      .finally(() => {
        if (!cancelled) setCompaniesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setS((prev) => ({ ...prev, [key]: e.target.value } as FormState));
    setError(null);
    setSuccess(null);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const company = companies.find((c) => c.companyNumber === s.companyNumber);
    const ee = parseFloat(s.ee);
    const er = parseFloat(s.er);

    if (!company || !s.companyNumber.trim()) {
      setError('Please select a company.');
      return;
    }
    if (!s.category.trim()) {
      setError('Category is required.');
      return;
    }
    if (!s.ee.trim() || !Number.isFinite(ee)) {
      setError('Employee Contribution is required.');
      return;
    }
    if (!s.er.trim() || !Number.isFinite(er)) {
      setError('Employer Contribution is required.');
      return;
    }

    const payload: CreateContributionRequest = {
      companyNumber: s.companyNumber,
      category: s.category,
      EE: ee,
      ER: er,
    };

    setLoading(true);
    try {
      await contributionsApi.create(payload);
      setRows((prev) => [...prev, { companyNumber: s.companyNumber, category: s.category, ee: s.ee, er: s.er }]);
      setS((prev) => ({ ...emptyState(), companyNumber: prev.companyNumber }));
      setSuccess(`Contribution for ${s.companyNumber} added.`);
    } catch (err) {
      setError(extractApiError(err, 'Failed to add contribution.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="kaf-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      <PageHeader
        icon={PlusCircle}
        title="Add New Contributions"
        subtitle="Create employee and employer contribution entries."
      />

      <form onSubmit={handleAdd} className="kaf-card" style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
        {error && (
          <div className="kaf-callout error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}
        {success && (
          <div className="kaf-callout ok" style={{ marginBottom: 20 }}>
            {success}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 640 }}>
          <FieldGroup label="Company Number" required>
            <select
              className="kaf-input kaf-select"
              value={s.companyNumber}
              onChange={onChange('companyNumber')}
              disabled={companiesLoading || loading}
            >
              <option value="" disabled>
                {companiesLoading ? 'Loading companies…' : 'Select company number'}
              </option>
              {companies.map((c) => (
                <option key={c.companyNumber} value={c.companyNumber}>
                  {c.companyNumber} — {c.companyName}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Category" required>
            <input
              className="kaf-input"
              type="text"
              value={s.category}
              onChange={onChange('category')}
            />
          </FieldGroup>

          <FieldGroup label="Employee Contribution" required>
            <PercentInput value={s.ee} onChange={onChange('ee')} />
          </FieldGroup>

          <FieldGroup label="Employer Contribution" required>
            <PercentInput value={s.er} onChange={onChange('er')} />
          </FieldGroup>
        </div>

        <button type="submit" className="kaf-btn" disabled={loading || companiesLoading} style={{ display: 'block', width: '100%', maxWidth: 640, marginTop: 24 }}>
          {loading ? 'Adding…' : 'Add Contribution'}
        </button>

        {rows.length > 0 && (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              color: 'var(--kaf-text)',
              marginTop: 24,
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--kaf-border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Company_Number</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>EE</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>ER</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--kaf-border)' }}>
                  <td style={{ padding: '8px 6px' }}>{row.companyNumber}</td>
                  <td style={{ padding: '8px 6px' }}>{row.category}</td>
                  <td style={{ padding: '8px 6px' }}>{row.ee}%</td>
                  <td style={{ padding: '8px 6px' }}>{row.er}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </form>
    </motion.div>
  );
}

interface FieldGroupProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldGroup({ label, required, children }: FieldGroupProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: 14 }}>
      <label className="kaf-label" style={{ margin: 0, textAlign: 'right' }}>
        {label}
        {required && <span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}

interface PercentInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function PercentInput({ value, onChange }: PercentInputProps) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="kaf-input"
        type="text"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        style={{ textAlign: 'right', paddingRight: 30 }}
      />
      <span
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--kaf-muted)',
          fontSize: 12,
          pointerEvents: 'none',
        }}
      >
        %
      </span>
    </div>
  );
}
