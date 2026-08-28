import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import PageHeader from '../../components/PageHeader';
import type { Company } from '../../types';
import { companiesApi } from '../../lib/companiesApi';
import { employeeTerminationApi } from '../../lib/employeeFundsApi';
import { extractApiError } from '../../lib/httpClient';




interface FormState {
  companyNumber: string;
  file: File | null;
  path: string;
}

const emptyState = (): FormState => ({
  companyNumber: '',
  file: null,
  path: '',
});

function toIsoDate(value: unknown): string {
  if (typeof value === 'number' && !Number.isNaN(value) && value > 1) {
    return XLSX.SSF.format('yyyy-mm-dd', value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  throw new Error(`Invalid date value: ${value}`);
}

export default function TerminateEmployeesBulk() {
  const [s, setS] = useState<FormState>(emptyState());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCompaniesLoading(true);
    companiesApi
      .getActive()
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

  const onChange = (key: keyof Omit<FormState, 'file'>) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setS((prev) => ({ ...prev, [key]: e.target.value } as FormState));
    setError(null);
    setSuccess(null);
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    setSuccess(null);

    if (!s.companyNumber.trim()) {
      setError('Company Number is required.');
      setS((prev) => ({ ...prev, file: null }));
      e.target.value = '';
      return;
    }
    if (!s.path.trim()) {
      setError('Path is required.');
      setS((prev) => ({ ...prev, file: null }));
      e.target.value = '';
      return;
    }
    if (!selected) {
      setS((prev) => ({ ...prev, file: null }));
      return;
    }

    setS((prev) => ({ ...prev, file: selected }));
    setLoading(true);
    try {
      const ab = await selected.arrayBuffer();
      const workbook = XLSX.read(ab, { type: 'array' });
      const allRows: (string | number)[][] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, defval: '' });
        if (rows.length) allRows.push(...rows);
      }
      const headerRowIdx = allRows.findIndex((row) =>
        row.some((cell) => /employee.*number|emp.*number|employee/i.test(String(cell).trim()))
      );
      if (headerRowIdx === -1) {
        setError('Could not find Employee Number column in the uploaded file.');
        return;
      }
      const headers = allRows[headerRowIdx].map((h) => String(h).trim().toLowerCase());
      const employeeIdx = headers.findIndex((h) => /employee.*number|emp.*number|employee/i.test(h));
      const terminationIdx = headers.findIndex((h) => /termination/i.test(h));
      const resignationIdx = headers.findIndex((h) => /resignation/i.test(h));
      if (employeeIdx === -1 || terminationIdx === -1 || resignationIdx === -1) {
        setError('Employee Number, Termination Date and Resignation Date columns are required.');
        return;
      }
      const employees = allRows
        .slice(headerRowIdx + 1)
        .map((row) => ({
          employeeNumber: String(row[employeeIdx] ?? '').trim(),
          terminationDate: toIsoDate(row[terminationIdx]),
          resignationDate: toIsoDate(row[resignationIdx]),
        }))
        .filter((row) => row.employeeNumber);
      if (employees.length === 0) {
        setError('No valid employee rows found after the header.');
        return;
      }
      const result = await employeeTerminationApi.terminateBulk({
        companyNumber: s.companyNumber,
        employees,
        path: s.path,
      });
      setSuccess(result.message ?? `Bulk termination submitted for ${s.companyNumber}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk termination failed.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
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
        subtitle="Upload a list of employees to terminate. The backend will generate the files."
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

          <FieldGroup label="Path" required>
            <input
              className="kaf-input"
              type="text"
              value={s.path}
              onChange={onChange('path')}
              placeholder="Server-side folder (e.g. D:\\Rubix)"
              disabled={loading}
            />
          </FieldGroup>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, maxWidth: 640 }}>
          <button type="button" className="kaf-btn-ghost" onClick={handleClear} disabled={loading}>
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
            onChange={(e) => void handleFile(e)}
            disabled={loading}
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
