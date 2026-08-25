import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Building2, FileSpreadsheet, FileText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { Field, ReportBusyOverlay, ReportFeedback } from '../../components/reports/reportFormBits';
import { dateHelpers, reportsApi } from '../../lib/api';
import {
  companyBalanceFolderName,
  employeeBalanceExcelName,
  employeeBalancePdfName,
} from '../../lib/balanceReportPdf';
import { companiesApi } from '../../lib/companiesApi';
import { extractApiError } from '../../lib/httpClient';
import { requestDirectoryLocation } from '../../lib/saveFile';
import type { Company } from '../../types';

function isSkippableEmployeeError(err: unknown): boolean {
  if (axios.isAxiosError(err) && err.response?.status === 404) return true;
  const message = err instanceof Error ? err.message : String(err ?? '');
  return message.includes('No data to export for this Employee');
}

/** Run async work over items with a fixed concurrency limit. */
async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

export default function CompanyBalanceReport() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companyNumber, setCompanyNumber] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [valuationDate, setValuationDate] = useState(dateHelpers.todayIso());
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState<'pdf' | 'excel' | null>(null);
  const [progress, setProgress] = useState(0);
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

  const run = async (format: 'pdf' | 'excel') => {
    setError(null);
    setSuccess(null);
    if (!companyNumber || !valuationDate) {
      setError('Company Number and Valuation Date are required.');
      return;
    }

    // Folder picker first in this click turn (Chrome drops the gesture after network awaits).
    const parentPromise = requestDirectoryLocation();
    const parent = await parentPromise;
    if (parent.mode === 'cancelled') return;
    if (parent.mode === 'unsupported') {
      setError('Folder selection is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    const folderName = companyBalanceFolderName(valuationDate, companyNumber);
    setProgress(0);
    setLoading(format);
    try {
      // Validates unit price + returns the same employee set the ZIP used to build.
      const employeeNumbers = await reportsApi.listCompanyBalanceEmployees(
        companyNumber,
        valuationDate,
        activeOnly,
      );
      if (employeeNumbers.length === 0) {
        setError('No employee reports were returned for this company and date.');
        return;
      }

      const folder = await parent.createNamedSubfolder(folderName);
      let saved = 0;
      let completed = 0;
      const total = employeeNumbers.length;
      const concurrency = 8;

      // Generate/save several employees at once so files appear as each finishes.
      await runWithConcurrency(employeeNumbers, concurrency, async (employeeNumber) => {
        try {
          const contents =
            format === 'pdf'
              ? await reportsApi.downloadEmployeeBalancePdf(companyNumber, employeeNumber, valuationDate)
              : await reportsApi.downloadEmployeeBalanceExcel(companyNumber, employeeNumber, valuationDate);
          const fileName =
            format === 'pdf'
              ? employeeBalancePdfName(valuationDate, employeeNumber)
              : employeeBalanceExcelName(valuationDate, employeeNumber);
          await folder.writeFile(fileName, contents);
          saved += 1;
        } catch (err) {
          // Match ZIP service: skip employees with no balance data; fail hard on other errors.
          if (!isSkippableEmployeeError(err)) throw err;
        } finally {
          completed += 1;
          setProgress(Math.round((completed / total) * 100));
        }
      });

      if (saved === 0) {
        setError('No employee reports were returned for this company and date.');
        return;
      }

      setProgress(100);
      setSuccess(
        format === 'pdf'
          ? `Saved ${saved} PDF report${saved === 1 ? '' : 's'} in ${folder.name}.`
          : `Saved ${saved} Excel report${saved === 1 ? '' : 's'} in ${folder.name}.`,
      );
    } catch (err) {
      setError(extractApiError(err, 'Extract failed'));
    } finally {
      setLoading(null);
      setProgress(0);
    }
  };

  const busyMessage =
    loading === 'excel' ? 'Generating Excel…' : 'Generating company balance reports…';

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={Building2}
          title="Create Company Balance Reports"
          subtitle="Generate company balance PDF or Excel for a valuation date."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 560, position: 'relative' }}>
        <ReportBusyOverlay show={!!loading} message={busyMessage} progress={progress} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Company Number" required>
            <select
              className="kaf-input kaf-select"
              value={companyNumber}
              onChange={(e) => { setCompanyNumber(e.target.value); setError(null); setSuccess(null); }}
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

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--kaf-text)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              disabled={!!loading}
            />
            Active Employees Only?
          </label>

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
