import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, reportsApi } from '../../lib/api';
import { mockExportContents, saveFileWithPicker, suggestedNameFromPath } from '../../lib/saveFile';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';

export default function EmployeeExtractAppReport() {
  const [reportDate, setReportDate] = useState(dateHelpers.todayIso());
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    setSuccess(null);
    if (!reportDate) {
      setError('Report Date is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await reportsApi.extract('employee-extract-app', 'data', {
        reportDate, path: path || undefined,
      });
      const saved = await saveFileWithPicker({
        suggestedName: suggestedNameFromPath(path, 'employee-extract-app.txt'),
        contents: mockExportContents('Employee Extract for App', { reportDate }),
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
          icon={Smartphone}
          title="Extract App Data"
          subtitle="Export employee extract data for the app."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 560 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Report Date" required>
            <input
              className="kaf-input"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              disabled={loading}
            />
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
              : 'Extract Data'}
          </button>
        </div>
      </div>
    </div>
  );
}

