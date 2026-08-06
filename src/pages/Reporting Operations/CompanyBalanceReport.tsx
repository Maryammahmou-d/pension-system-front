import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, FileSpreadsheet, FileText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, lookupsApi, reportsApi } from '../../lib/api';
import { mockExportContents, saveFileWithPicker, suggestedNameFromPath } from '../../lib/saveFile';
import type { CompanySummary } from '../../types';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';

export default function CompanyBalanceReport() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [companyNumber, setCompanyNumber] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [valuationDate, setValuationDate] = useState(dateHelpers.todayIso());
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState<'pdf' | 'excel' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void lookupsApi.listCompanies(false).then(setCompanies).catch(() => setCompanies([]));
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
      const res = await reportsApi.extract('company-balance', format, {
        companyNumber, activeOnly, valuationDate, path: path || undefined,
      });
      const ext = format === 'pdf' ? 'pdf.txt' : 'xlsx.txt';
      const saved = await saveFileWithPicker({
        suggestedName: suggestedNameFromPath(path, `company-balance.${ext}`),
        contents: mockExportContents('Company Balance', { companyNumber, valuationDate, format, activeOnly }),
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
          icon={Building2}
          title="Create Company Balance Reports"
          subtitle="Generate company balance PDF or Excel for a valuation date."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 560 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Company Number" required>
            <select
              className="kaf-input kaf-select"
              value={companyNumber}
              onChange={(e) => { setCompanyNumber(e.target.value); setError(null); setSuccess(null); }}
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

