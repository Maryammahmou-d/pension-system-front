import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import { dateHelpers, employeeTerminationApi } from '../../../lib/api';
import { companiesApi } from '../../../lib/companiesApi';
import { employeesApi } from '../../../lib/employeesApi';
import { extractApiError } from '../../../lib/httpClient';
import { saveFileWithPicker, suggestedNameFromPath } from '../../../lib/saveFile';
import { buildTerminationEstimatePdf } from '../../../lib/terminationEstimatePdf';
import type { Company, Employee } from '../../../types';

export default function EstimateEmployeeTermination() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [companyNumber, setCompanyNumber] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [terminationDate, setTerminationDate] = useState(dateHelpers.todayIso());
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

  const onCompanyChange = (value: string) => {
    setCompanyNumber(value);
    setEmployeeNumber('');
    setError(null);
    setSuccess(null);
  };

  const handleEstimate = async () => {
    setError(null);
    setSuccess(null);

    if (!companyNumber) return setError('Company Number is required.');
    if (!employeeNumber) return setError('Employee Number is required.');
    if (!terminationDate) return setError('Termination Date is required.');

    setLoading(true);
    try {
      const res = await employeeTerminationApi.estimate(companyNumber, employeeNumber, terminationDate);
      const pdf = buildTerminationEstimatePdf(res);
      const saved = await saveFileWithPicker({
        suggestedName: suggestedNameFromPath(path, `Estimate_Termination_${employeeNumber}.pdf`),
        contents: pdf,
        mimeType: 'application/pdf',
      });
      if (saved === 'saved') {
        setSuccess(`Estimate Employee Termination PDF saved for ${employeeNumber}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Estimate failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={Users}
          title="Estimate Employee Termination"
          subtitle="Estimate termination fund totals for an employee."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="kaf-label">
              Company Number<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
            </label>
            <select
              className="kaf-input kaf-select"
              value={companyNumber}
              onChange={(e) => onCompanyChange(e.target.value)}
              disabled={loading || companiesLoading}
            >
              <option value="">{companiesLoading ? 'Loading companies…' : 'Select company…'}</option>
              {companies.map((c) => (
                <option key={c.companyNumber} value={c.companyNumber}>
                  {c.companyNumber} — {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="kaf-label">Employee Number</label>
            <select
              className="kaf-input kaf-select"
              value={employeeNumber}
              onChange={(e) => { setEmployeeNumber(e.target.value); setError(null); setSuccess(null); }}
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
          </div>

          <div>
            <label className="kaf-label">
              Termination Date<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
            </label>
            <input
              className="kaf-input"
              type="date"
              value={terminationDate}
              onChange={(e) => { setTerminationDate(e.target.value); setError(null); setSuccess(null); }}
              disabled={loading}
            />
          </div>

          <div>
            <label className="kaf-label">Path</label>
            <input
              className="kaf-input"
              value={path}
              onChange={(e) => { setPath(e.target.value); setError(null); setSuccess(null); }}
              placeholder="Optional — choose location in the save dialog"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="button"
          className="kaf-btn"
          onClick={handleEstimate}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? (
            <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Estimating…</>
          ) : (
            <><Calculator size={14} /> Estimate Employee Termination Funds</>
          )}
        </button>

        {error && (
          <div className="kaf-callout error" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div className="kaf-callout ok" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={16} /> {success}
          </div>
        )}
      </div>
    </div>
  );
}
