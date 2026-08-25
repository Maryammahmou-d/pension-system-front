import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, FileText, User } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { Field, ReportBusyOverlay, ReportFeedback } from '../../components/reports/reportFormBits';
import { dateHelpers, reportsApi } from '../../lib/api';
import { employeeBalanceExcelName, employeeBalancePdfName } from '../../lib/balanceReportPdf';
import { companiesApi } from '../../lib/companiesApi';
import { employeesApi } from '../../lib/employeesApi';
import { extractApiError } from '../../lib/httpClient';
import {
  discardUnusedSaveLocation,
  requestSaveLocation,
  suggestedNameFromPath,
  writeSaveLocation,
} from '../../lib/saveFile';
import type { Company, Employee } from '../../types';

export default function EmployeeBalanceReport() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [companyNumber, setCompanyNumber] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [valuationDate, setValuationDate] = useState(dateHelpers.todayIso());
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState<'pdf' | 'excel' | null>(null);
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

  const run = async (format: 'pdf' | 'excel') => {
    setError(null);
    setSuccess(null);
    if (!companyNumber || !employeeNumber || !valuationDate) {
      setError('Company Number, Employee Number, and Valuation Date are required.');
      return;
    }

    const fallbackName =
      format === 'pdf'
        ? employeeBalancePdfName(valuationDate, employeeNumber)
        : employeeBalanceExcelName(valuationDate, employeeNumber);
    const mimeType =
      format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    // Start Save-As in this click turn (Chrome drops the gesture after network awaits).
    const locationPromise = requestSaveLocation({
      suggestedName: suggestedNameFromPath(path, fallbackName),
      mimeType,
    });

    const location = await locationPromise;
    if (location.mode === 'cancelled') return;

    setLoading(format);
    try {
      const contents =
        format === 'pdf'
          ? await reportsApi.downloadEmployeeBalancePdf(companyNumber, employeeNumber, valuationDate)
          : await reportsApi.downloadEmployeeBalanceExcel(companyNumber, employeeNumber, valuationDate);

      await writeSaveLocation(location, contents);
      setSuccess(format === 'pdf'
        ? 'PDF report generated successfully.'
        : 'Excel report generated successfully.');
    } catch (err) {
      await discardUnusedSaveLocation(location);
      setError(extractApiError(err, 'Extract failed'));
    } finally {
      setLoading(null);
    }
  };

  const busyMessage = loading === 'excel' ? 'Generating Excel…' : 'Generating PDF…';

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={User}
          title="Create Employee Balance Reports For Company"
          subtitle="Generate employee balance PDF or Excel for a member."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 560, position: 'relative' }}>
        <ReportBusyOverlay show={!!loading} message={busyMessage} />
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
              disabled={!!loading || companiesLoading}
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
              disabled={!!loading || !companyNumber || employeesLoading}
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
