import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { Field, ReportBusyOverlay, ReportFeedback } from '../../components/reports/reportFormBits';
import { dateHelpers, reportsApi } from '../../lib/api';
import { employeeExtractAppExcelName } from '../../lib/balanceReportPdf';
import { extractApiError } from '../../lib/httpClient';
import {
  discardUnusedSaveLocation,
  requestSaveLocation,
  suggestedNameFromPath,
  writeSaveLocation,
} from '../../lib/saveFile';

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

    const locationPromise = requestSaveLocation({
      suggestedName: suggestedNameFromPath(path, employeeExtractAppExcelName(reportDate)),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const location = await locationPromise;
    if (location.mode === 'cancelled') return;

    setLoading(true);
    try {
      const contents = await reportsApi.downloadEmployeeExtractAppExcel(reportDate);
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
          icon={Smartphone}
          title="Extract App Data"
          subtitle="Export employee extract data for the app."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 560, position: 'relative' }}>
        <ReportBusyOverlay show={loading} message="Generating Excel…" />
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
