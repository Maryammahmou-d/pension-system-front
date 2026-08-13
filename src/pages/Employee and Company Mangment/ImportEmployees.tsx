import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../lib/auth';
import { companiesApi } from '../../lib/companiesApi';
import { employeesApi } from '../../lib/employeesApi';
import { extractApiError } from '../../lib/httpClient';
import type { Company } from '../../types';

export default function ImportEmployees() {
  const { user } = useAuth();
  const currentUser = user?.fullName ?? user?.username ?? '';

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companyNumber, setCompanyNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [companyIssueDate, setCompanyIssueDate] = useState('');
  const [username, setUsername] = useState(currentUser);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleCompany = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setCompanyNumber(selected);
    setError(null);
    setSuccess(null);
    setEmployeeId('');
    setEmployeeNumber('');
    setCompanyIssueDate('');

    if (!selected) {
      return;
    }

    const company = companies.find((c) => c.companyNumber === selected);
    if (company) {
      setCompanyIssueDate(company.issueDate);
    }

    employeesApi
      .getNextNumber(selected)
      .then(({ employeeId: nextId, employeeNumber: nextNumber }) => {
        setEmployeeId(String(nextId));
        setEmployeeNumber(nextNumber);
      })
      .catch((err) => {
        setError(extractApiError(err, 'Failed to load next employee number.'));
      });
  };

  const handleClear = () => {
    setCompanyNumber('');
    setEmployeeId('');
    setEmployeeNumber('');
    setCompanyIssueDate('');
    setUsername(currentUser);
    setFile(null);
    setError(null);
    setSuccess(null);
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
    setSuccess(null);
  };

  const handleImport = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!companyNumber.trim()) {
      setError('Company Number is required.');
      return;
    }

    if (!file) {
      setError('Please select an Excel file to import.');
      return;
    }

    // TODO: parse Excel file with xlsx once structure is provided
    setSuccess(
      'Import validation passed. Excel parsing is not yet wired; this is a UI preview.'
    );
  };

  return (
    <motion.div
      className="kaf-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      <PageHeader
        icon={Upload}
        title="Find Next Employee ID and Import New Employees"
        subtitle="Import employee records from an Excel template."
      />

      <form onSubmit={handleImport} className="kaf-card" style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FieldGroup label="Company Number" required>
              <select className="kaf-input kaf-select" value={companyNumber} onChange={handleCompany} disabled={companiesLoading}>
                <option value="">
                  {companiesLoading ? 'Loading companies…' : 'Select company number'}
                </option>
                {companies.map((c) => (
                  <option key={c.companyNumber} value={c.companyNumber}>
                    {c.companyNumber} — {c.companyName}
                  </option>
                ))}
              </select>
            </FieldGroup>

            <FieldGroup label="Employee ID">
              <input className="kaf-input" type="text" value={employeeId} readOnly />
            </FieldGroup>

            <FieldGroup label="Employee Number">
              <input className="kaf-input" type="text" value={employeeNumber} readOnly />
            </FieldGroup>

            <FieldGroup label="Company Issue Date">
              <input className="kaf-input" type="text" value={companyIssueDate} readOnly />
            </FieldGroup>

            <FieldGroup label="Username">
              <input className="kaf-input" type="text" value={username} readOnly />
            </FieldGroup>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="kaf-callout" style={{ fontSize: 13 }}>
              <p>Please use the Excel template to import new employees.</p>
              <p style={{ marginTop: 10 }}>
                For new employees, please use the Employee ID provided above for the first record.
              </p>
              <p style={{ marginTop: 10 }}>For existing employees, please use their existing ID.</p>
              <p style={{ marginTop: 10 }}>
                Unit prices have to be available in the database for all Kaf Joining Dates in the Excel.
              </p>
            </div>
          </div>
        </div>

        <div
          className="kaf-card"
          style={{
            marginTop: 24,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: 'var(--kaf-surface-2)',
            alignSelf: 'start',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label className="kaf-btn" htmlFor="import-file">
              Choose Excel File
            </label>
            <input
              id="import-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
            <span style={{ color: 'var(--kaf-muted)', fontSize: 13 }}>
              {file ? file.name : 'No file selected'}
            </span>
          </div>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              color: 'var(--kaf-text)',
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
              <tr style={{ borderBottom: '1px solid var(--kaf-border)' }}>
                <td style={{ padding: '8px 6px' }}>{companyNumber || '-'}</td>
                <td style={{ padding: '8px 6px' }}>1</td>
                <td style={{ padding: '8px 6px' }}>100</td>
                <td style={{ padding: '8px 6px' }}>0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button type="button" className="kaf-btn-ghost" onClick={handleClear}>
            Clear
          </button>
          <button type="submit" className="kaf-btn">
            Import Employees
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
