import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, FileText, Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, reportsApi } from '../../lib/api';
import { companiesApi } from '../../lib/companiesApi';
import { extractApiError } from '../../lib/httpClient';
import { mockExportContents, saveFileWithPicker, suggestedNameFromPath } from '../../lib/saveFile';
import type { Company } from '../../types';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';

export default function AggregatedEmployeeBalanceReport() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companyNumber, setCompanyNumber] = useState('');
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

  const run = async (format: 'pdf' | 'excel') => {
    setError(null);
    setSuccess(null);
    if (!companyNumber || !valuationDate) {
      setError('Company Number and Valuation Date are required.');
      return;
    }
    setLoading(format);
    try {
      const res = await reportsApi.extract('aggregated-employee-balance', format, {
        companyNumber, valuationDate, path: path || undefined,
      });
      const ext = format === 'pdf' ? 'pdf.txt' : 'xlsx.txt';
      const saved = await saveFileWithPicker({
        suggestedName: suggestedNameFromPath(path, `aggregated-employee-balance.${ext}`),
        contents: mockExportContents('Aggregated Employee Balance', { companyNumber, valuationDate, format }),
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
          icon={Users}
          title="Create Aggregated Employee Balance Reports For Company"
          subtitle="Generate aggregated employee balance PDF or Excel for a company."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 560 }}>
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
