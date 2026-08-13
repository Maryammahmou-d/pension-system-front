import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Building } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import type { Company } from '../../types';
import { companiesApi } from '../../lib/companiesApi';
import { extractApiError } from '../../lib/httpClient';



interface FormState {
  companyNumber: string;
  terminationDate: string;
  path: string;
}

const emptyState = (): FormState => ({
  companyNumber: '',
  terminationDate: '',
  path: '',
});

export default function TerminateCompany() {
  const [s, setS] = useState<FormState>(emptyState());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

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

  const handleTerminate = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!s.companyNumber.trim()) {
      setError('Company Number is required.');
      return;
    }
    if (!s.terminationDate.trim()) {
      setError('Termination Date is required.');
      return;
    }
    if (!s.path.trim()) {
      setError('Path is required.');
      return;
    }

    setSuccess(`Company ${s.companyNumber} termination simulated. PDF/Excel generation will be wired once the structure is provided.`);
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
        icon={Building}
        title="Terminate Company"
        subtitle="Record a company termination and the download path."
      />

      <form onSubmit={handleTerminate} className="kaf-card" style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
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
              disabled={companiesLoading}
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

          <FieldGroup label="Termination Date" required>
            <input
              className="kaf-input"
              type="date"
              value={s.terminationDate}
              onChange={onChange('terminationDate')}
            />
          </FieldGroup>

          <FieldGroup label="Path" required>
            <input
              className="kaf-input"
              type="text"
              value={s.path}
              onChange={onChange('path')}
            />
          </FieldGroup>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, maxWidth: 640 }}>
          <button type="button" className="kaf-btn-ghost" onClick={handleClear}>
            Clear
          </button>
          <button type="submit" className="kaf-btn" style={{ flex: 1 }}>
            Terminate Company
          </button>
        </div>
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
