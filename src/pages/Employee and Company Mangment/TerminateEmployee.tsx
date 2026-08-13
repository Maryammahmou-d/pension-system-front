import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { UserX } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import type { Company, Employee } from '../../types';
import { companiesApi } from '../../lib/companiesApi';
import { employeesApi } from '../../lib/employeesApi';
import { extractApiError } from '../../lib/httpClient';

interface FormState {
  companyNumber: string;
  employeeNumber: string;
  terminationDate: string;
  resignationDate: string;
  path: string;
}

const emptyState = (): FormState => ({
  companyNumber: '',
  employeeNumber: '',
  terminationDate: '',
  resignationDate: '',
  path: '',
});

export default function TerminateEmployee() {
  const [s, setS] = useState<FormState>(emptyState());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const selectedEmployee = employees.find((e) => e.employeeNumber === s.employeeNumber);

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

  useEffect(() => {
    if (!s.companyNumber) {
      setEmployees([]);
      setEmployeesLoading(false);
      return;
    }
    let cancelled = false;
    setEmployeesLoading(true);
    setEmployees([]);
    employeesApi
      .getByCompanyNumber(s.companyNumber)
      .then((list) => {
        if (cancelled) return;
        setEmployees(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiError(err, 'Failed to load employees.'));
      })
      .finally(() => {
        if (!cancelled) setEmployeesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [s.companyNumber]);

  const onChange = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setS((prev) => ({ ...prev, [key]: e.target.value } as FormState));
    setError(null);
    setSuccess(null);
  };

  const handleCompany = (e: ChangeEvent<HTMLSelectElement>) => {
    setS({ ...emptyState(), companyNumber: e.target.value, employeeNumber: '' });
    setError(null);
    setSuccess(null);
  };

  const handleEmployee = (e: ChangeEvent<HTMLSelectElement>) => {
    setS((prev) => ({ ...prev, employeeNumber: e.target.value } as FormState));
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
    if (!s.employeeNumber.trim()) {
      setError('Employee Number is required.');
      return;
    }
    if (!s.terminationDate.trim()) {
      setError('Termination Date is required.');
      return;
    }
    if (!s.resignationDate.trim()) {
      setError('Resignation Date is required.');
      return;
    }
    if (!s.path.trim()) {
      setError('Path is required.');
      return;
    }

    setSuccess(`Employee ${s.employeeNumber} termination simulated. Backend is not yet connected.`);
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
        icon={UserX}
        title="Terminate Employee"
        subtitle="Record an employee termination and off-boarding details."
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

        {selectedEmployee && (
          <div style={{ textAlign: 'right', marginBottom: 20, fontSize: 16, fontWeight: 700, color: 'var(--kaf-text)' }}>
            {selectedEmployee.fullName}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 640 }}>
          <FieldGroup label="Company Number" required>
            <select
              className="kaf-input kaf-select"
              value={s.companyNumber}
              onChange={handleCompany}
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

          <FieldGroup label="Employee Number" required>
            <select
              className="kaf-input kaf-select"
              value={s.employeeNumber}
              onChange={handleEmployee}
              disabled={!s.companyNumber || employeesLoading}
            >
              <option value="" disabled>
                {!s.companyNumber
                  ? 'Select a company first'
                  : employeesLoading
                    ? 'Loading employees…'
                    : 'Select employee number'}
              </option>
              {employees.map((emp) => (
                <option key={emp.employeeNumber} value={emp.employeeNumber}>
                  {emp.employeeNumber} - {emp.fullName}
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

          <FieldGroup label="Resignation Date" required>
            <input
              className="kaf-input"
              type="date"
              value={s.resignationDate}
              onChange={onChange('resignationDate')}
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
            Terminate Employee
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
