import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { reportsApi } from '../../lib/api';
import { companiesApi } from '../../lib/companiesApi';
import { extractApiError } from '../../lib/httpClient';
import {
  discardUnusedSaveLocation,
  requestSaveLocation,
  suggestedNameFromPath,
  writeSaveLocation,
} from '../../lib/saveFile';
import type { Company } from '../../types';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';

export default function EmployeeRecordsReport() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companyNumber, setCompanyNumber] = useState('');
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

  const run = async () => {
    setError(null);
    setSuccess(null);
    if (!companyNumber) {
      setError('Company Number is required.');
      return;
    }

    const defaultFilename = `Employee_${companyNumber}.xlsx`;
    const locationPromise = requestSaveLocation({
      suggestedName: suggestedNameFromPath(path, defaultFilename),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const location = await locationPromise;
    if (location.mode === 'cancelled') return;

    setLoading(true);
    try {
      const contents = await reportsApi.downloadEmployeeRecordsExcel(companyNumber);
      await writeSaveLocation(location, contents);
      setSuccess('Excel report generated successfully.');
    } catch (err) {
      await discardUnusedSaveLocation(location);
      setError(extractApiError(err, 'Extract failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={Users}
          title="Extract Employee Records"
          subtitle="Export employee records for a company."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 560 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Company Number" required>
            <select
              className="kaf-input kaf-select"
              value={companyNumber}
              onChange={(e) => { setCompanyNumber(e.target.value); setError(null); setSuccess(null); }}
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
              : 'Extract Records'}
          </button>
        </div>
      </div>
    </div>
  );
}
