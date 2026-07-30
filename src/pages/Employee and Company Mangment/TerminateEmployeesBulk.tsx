import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const COMPANIES = [
  { number: '1001', issueDate: '2015-03-12' },
  { number: '1002', issueDate: '2018-07-20' },
  { number: '1003', issueDate: '2021-11-05' },
];

interface FormState {
  companyNumber: string;
  path: string;
  file: File | null;
}

const emptyState = (): FormState => ({
  companyNumber: '',
  path: '',
  file: null,
});

export default function TerminateEmployeesBulk() {
  const [s, setS] = useState<FormState>(emptyState());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onChange = (key: keyof Omit<FormState, 'file'>) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setS((prev) => ({ ...prev, [key]: e.target.value } as FormState));
    setError(null);
    setSuccess(null);
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    setSuccess(null);

    if (!s.companyNumber.trim()) {
      setError('Company Number is required.');
      setS((prev) => ({ ...prev, file: null }));
      return;
    }
    if (!s.path.trim()) {
      setError('Path is required.');
      setS((prev) => ({ ...prev, file: null }));
      return;
    }
    if (!selected) {
      setS((prev) => ({ ...prev, file: null }));
      return;
    }

    setS((prev) => ({ ...prev, file: selected }));
    setSuccess(`List uploaded for ${s.companyNumber}. PDF/Excel generation will be wired once the structure is provided.`);
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
        icon={Users}
        title="Terminate Employees in Bulk"
        subtitle="Upload a list of employees to terminate. PDF/Excel generation will be added once the structure is provided."
      />

      <form className="kaf-card" style={{ padding: 28, maxWidth: 900, margin: '0 auto' }} onSubmit={(e: FormEvent) => e.preventDefault()}>
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
          <FieldGroup label="Path" required>
            <input
              className="kaf-input"
              type="text"
              value={s.path}
              onChange={onChange('path')}
            />
          </FieldGroup>

          <FieldGroup label="Company Number" required>
            <select
              className="kaf-input kaf-select"
              value={s.companyNumber}
              onChange={onChange('companyNumber')}
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
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, maxWidth: 640 }}>
          <button type="button" className="kaf-btn-ghost" onClick={handleClear}>
            Clear
          </button>
          <label className="kaf-btn" htmlFor="bulk-file" style={{ flex: 1, textAlign: 'center' }}>
            Upload List of Employees to Terminate
          </label>
          <input
            id="bulk-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
        </div>

        {s.file && (
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--kaf-muted)' }}>
            Selected file: {s.file.name}
          </div>
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
