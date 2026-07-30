import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const COMPANIES = [
  { number: '1001', issueDate: '2015-03-12' },
  { number: '1002', issueDate: '2018-07-20' },
  { number: '1003', issueDate: '2021-11-05' },
];


interface Contribution {
  companyNumber: string;
  category: string;
  ee: string;
  er: string;
}

// TODO: replace with /api/contributions data
const EXISTING_CONTRIBUTIONS: Contribution[] = [
  { companyNumber: '1001', category: 'Category 1', ee: '10.00', er: '15.00' },
  { companyNumber: '1001', category: 'Category 2', ee: '12.00', er: '18.00' },
  { companyNumber: '1002', category: 'Category 1', ee: '8.00', er: '12.00' },
  { companyNumber: '1003', category: 'Category 1', ee: '9.00', er: '14.00' },
];

interface FormState {
  companyNumber: string;
  category: string;
  ee: string;
  er: string;
}

const emptyState = (): FormState => ({
  companyNumber: '',
  category: '',
  ee: '0',
  er: '0',
});

export default function EditContributions() {
  const [rows, setRows] = useState<Contribution[]>(EXISTING_CONTRIBUTIONS);
  const [s, setS] = useState<FormState>(emptyState());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categoriesForCompany = useMemo(
    () => [...new Set(rows.filter((r) => r.companyNumber === s.companyNumber).map((r) => r.category))],
    [rows, s.companyNumber]
  );
  const filteredRows = useMemo(() => rows.filter((r) => r.companyNumber === s.companyNumber), [rows, s.companyNumber]);

  const onChange = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setS((prev) => ({ ...prev, [key]: e.target.value } as FormState));
    setError(null);
    setSuccess(null);
  };

  const handleCompany = (e: ChangeEvent<HTMLSelectElement>) => {
    const company = e.target.value;
    const first = rows.find((r) => r.companyNumber === company)?.category ?? '';
    setS((prev) => ({ ...prev, companyNumber: company, category: first } as FormState));
    setError(null);
    setSuccess(null);
  };

  const handleEdit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!s.companyNumber.trim()) {
      setError('Company Number is required.');
      return;
    }
    if (!s.category.trim()) {
      setError('Category is required.');
      return;
    }
    if (!s.ee.trim()) {
      setError('Employee Contribution is required.');
      return;
    }
    if (!s.er.trim()) {
      setError('Employer Contribution is required.');
      return;
    }

    const index = rows.findIndex((r) => r.companyNumber === s.companyNumber && r.category === s.category);
    if (index === -1) {
      setError('No existing contribution found for the selected company and category.');
      return;
    }

    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ee: s.ee, er: s.er };
      return next;
    });
    setSuccess(`Contribution for ${s.companyNumber} / ${s.category} updated.`);
  };

  const handleClear = () => {
    setS(emptyState());
    setError(null);
    setSuccess(null);
  };

  return (
    <motion.div
      className="kaf-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      <PageHeader
        icon={Pencil}
        title="Edit Existing Contributions"
        subtitle="Update employee and employer contribution values."
      />

      <form onSubmit={handleEdit} className="kaf-card" style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
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
              onChange={handleCompany}
            >
              <option value="" disabled>
                Select company number
              </option>
              {COMPANIES.map((c) => (
                <option key={c.number} value={c.number}>
                  {c.number}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Category" required>
            <select
              className="kaf-input kaf-select"
              value={s.category}
              onChange={onChange('category')}
              disabled={!s.companyNumber}
            >
              <option value="" disabled>
                {s.companyNumber ? 'Select category' : 'Select a company first'}
              </option>
              {categoriesForCompany.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Employee Contribution" required>
            <PercentInput value={s.ee} onChange={onChange('ee')} />
          </FieldGroup>

          <FieldGroup label="Employer Contribution" required>
            <PercentInput value={s.er} onChange={onChange('er')} />
          </FieldGroup>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, maxWidth: 640 }}>
          <button type="button" className="kaf-btn-ghost" onClick={handleClear}>
            Clear
          </button>
          <button type="submit" className="kaf-btn" style={{ flex: 1 }}>
            Edit Contribution
          </button>
        </div>

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
            {filteredRows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--kaf-border)' }}>
                <td style={{ padding: '8px 6px' }}>{row.companyNumber}</td>
                <td style={{ padding: '8px 6px' }}>{row.category}</td>
                <td style={{ padding: '8px 6px' }}>{row.ee}%</td>
                <td style={{ padding: '8px 6px' }}>{row.er}%</td>
              </tr>
            ))}
          </tbody>
        </table>
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
