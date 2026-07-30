import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { UserX } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface Employee {
  companyNumber: string;
  employeeNumber: string;
  fullName: string;
}

// TODO: replace with /api/companies data
const COMPANIES = [
  { number: '1001', issueDate: '2015-03-12' },
  { number: '1002', issueDate: '2018-07-20' },
  { number: '1003', issueDate: '2021-11-05' },
];

// TODO: replace with /api/employees data
const EMPLOYEES: Employee[] = [
  { companyNumber: '1001', employeeNumber: '1001-001', fullName: 'Ahmed Mohamed' },
  { companyNumber: '1001', employeeNumber: '1001-002', fullName: 'Mohamed Ali' },
  { companyNumber: '1001', employeeNumber: '1001-003', fullName: 'Mohamed Essayy' },
  { companyNumber: '1002', employeeNumber: '1002-001', fullName: 'Sara Hany' },
  { companyNumber: '1003', employeeNumber: '1003-001', fullName: 'Laila Saad' },
];

interface FormState {
  companyNumber: string;
  employeeNumber: string;
  terminationDate: string;
  resignationDate: string;
  path: string;
}

const emptyState = (): FormState => ({
  companyNumber: '1001',
  employeeNumber: '1001-003',
  terminationDate: '',
  resignationDate: '',
  path: '',
});

export default function TerminateEmployee() {
  const [s, setS] = useState<FormState>(emptyState());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedEmployee = EMPLOYEES.find((e) => e.employeeNumber === s.employeeNumber);

  const onChange = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setS((prev) => ({ ...prev, [key]: e.target.value } as FormState));
    setError(null);
    setSuccess(null);
  };

  const handleCompany = (e: ChangeEvent<HTMLSelectElement>) => {
    const company = e.target.value;
    const first = EMPLOYEES.find((emp) => emp.companyNumber === company);
    setS({ ...emptyState(), companyNumber: company, employeeNumber: first?.employeeNumber ?? '' });
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

          <FieldGroup label="Employee Number" required>
            <select
              className="kaf-input kaf-select"
              value={s.employeeNumber}
              onChange={handleEmployee}
              disabled={!s.companyNumber}
            >
              <option value="" disabled>
                {s.companyNumber ? 'Select employee number' : 'Select a company first'}
              </option>
              {EMPLOYEES.filter((emp) => emp.companyNumber === s.companyNumber).map((emp) => (
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
