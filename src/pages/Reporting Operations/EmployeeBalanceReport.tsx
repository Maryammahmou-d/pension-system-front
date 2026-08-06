import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, FileText, User } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, lookupsApi, reportsApi } from '../../lib/api';
import { mockExportContents, saveFileWithPicker, suggestedNameFromPath } from '../../lib/saveFile';
import type { CompanySummary, EmployeeSummary } from '../../types';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';

export default function EmployeeBalanceReport() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [companyNumber, setCompanyNumber] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [valuationDate, setValuationDate] = useState(dateHelpers.todayIso());
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState<'pdf' | 'excel' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void lookupsApi.listCompanies(true).then(setCompanies).catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    if (!companyNumber) { setEmployees([]); return; }
    void lookupsApi.listEmployees(companyNumber).then(setEmployees).catch(() => setEmployees([]));
  }, [companyNumber]);

  const run = async (format: 'pdf' | 'excel') => {
    setError(null);
    setSuccess(null);
    if (!companyNumber || !employeeNumber || !valuationDate) {
      setError('Company Number, Employee Number, and Valuation Date are required.');
      return;
    }
    setLoading(format);
    try {
      const res = await reportsApi.extract('employee-balance', format, {
        companyNumber, employeeNumber, valuationDate, path: path || undefined,
      });
      const ext = format === 'pdf' ? 'pdf.txt' : 'xlsx.txt';
      const saved = await saveFileWithPicker({
        suggestedName: suggestedNameFromPath(path, `employee-balance.${ext}`),
        contents: mockExportContents('Employee Balance', { companyNumber, employeeNumber, valuationDate, format }),
      });
      if (saved === 'cancelled') return;
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extract failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={User}
          title="Create Employee Balance Reports For Company"
          subtitle="Generate employee balance PDF or Excel for a member."
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
              disabled={!!loading}
            >
              <option value="">Select company…</option>
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
              disabled={!!loading || !companyNumber}
            >
              <option value="">Select employee…</option>
              {employees.map((e) => (
                <option key={e.employeeNumber} value={e.employeeNumber}>
                  {e.employeeNumber} — {e.fullName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Valuation Date" required>
            <input
              className="kaf-input"
              type="date"
              value={valuationDate}
              onChange={(e) => setValuationDate(e.target.value)}
              disabled={!!loading}
            />
          </Field>

          <Field label="Path">
            <input
              className="kaf-input"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="Optional — choose location in the save dialog"
              disabled={!!loading}
            />
          </Field>

          <ReportFeedback error={error} success={success} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
            <button type="button" className="kaf-btn" disabled={!!loading} onClick={() => void run('pdf')}>
              {loading === 'pdf'
                ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Extracting…</>
                : <><FileText size={14} /> Extract PDF</>}
            </button>
            <button type="button" className="kaf-btn" disabled={!!loading} onClick={() => void run('excel')}>
              {loading === 'excel'
                ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Extracting…</>
                : <><FileSpreadsheet size={14} /> Extract Excel</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

