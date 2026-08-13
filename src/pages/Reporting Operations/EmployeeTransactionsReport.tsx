import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { reportsApi } from '../../lib/api';
import { companiesApi } from '../../lib/companiesApi';
import { employeesApi } from '../../lib/employeesApi';
import { extractApiError } from '../../lib/httpClient';
import { mockExportContents, saveFileWithPicker, suggestedNameFromPath } from '../../lib/saveFile';
import type { Company, Employee } from '../../types';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';

export default function EmployeeTransactionsReport() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [companyNumber, setCompanyNumber] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (!companyNumber) {
      setEmployees([]);
      return;
    }
    let cancelled = false;
    setEmployeesLoading(true);
    employeesApi
      .getByCompanyNumber(companyNumber)
      .then((list) => {
        if (!cancelled) setEmployees(list);
      })
      .catch((err) => {
        if (!cancelled) setError(extractApiError(err, 'Failed to load employees.'));
      })
      .finally(() => {
        if (!cancelled) setEmployeesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyNumber]);

  const run = async () => {
    setError(null);
    setSuccess(null);
    if (!companyNumber || !employeeNumber) {
      setError('Company Number and Employee Number are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await reportsApi.extract('employee-transactions', 'transactions', {
        companyNumber, employeeNumber, path: path || undefined,
      });
      const saved = await saveFileWithPicker({
        suggestedName: suggestedNameFromPath(path, 'employee-transactions.txt'),
        contents: mockExportContents('Employee Transactions', { companyNumber, employeeNumber }),
      });
      if (saved === 'cancelled') return;
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extract failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={User}
          title="Extract Employee Transactions"
          subtitle="Export transaction history for an employee."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 560 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Company Number" required>
            <select
              className="kaf-input kaf-select"
              value={companyNumber}
              onChange={(e) => {
                setCompanyNumber(e.target.value);
                setEmployeeNumber('');
                setError(null);
                setSuccess(null);
              }}
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

          <Field label="Employee Number" required>
            <select
              className="kaf-input kaf-select"
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              disabled={loading || !companyNumber || employeesLoading}
            >
              <option value="">
                {!companyNumber ? 'Select company first' : employeesLoading ? 'Loading employees…' : 'Select employee…'}
              </option>
              {employees.map((e) => (
                <option key={e.employeeNumber} value={e.employeeNumber}>
                  {e.employeeNumber} — {e.fullName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Path">
            <input
              className="kaf-input"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="Optional — choose location in the save dialog"
              disabled={loading}
            />
          </Field>

          <ReportFeedback error={error} success={success} />

          <button type="button" className="kaf-btn" disabled={loading} onClick={() => void run()} style={{ width: '100%', marginTop: 4 }}>
            {loading
              ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Extracting…</>
              : 'Extract Transactions'}
          </button>
        </div>
      </div>
    </div>
  );
}
