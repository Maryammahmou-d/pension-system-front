import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, FileText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, reportsApi } from '../../lib/api';
import { extractApiError } from '../../lib/httpClient';
import {
  discardUnusedSaveLocation,
  requestSaveLocation,
  suggestedNameFromPath,
  writeSaveLocation,
} from '../../lib/saveFile';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';

export default function MovementSummaryForDayReport() {
  const [reportDate, setReportDate] = useState(dateHelpers.todayIso());
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const produceReport = async () => {
    setError(null);
    setSuccess(null);
    if (!reportDate) {
      setError('Report Date is required.');
      return;
    }

    const [y, m, d] = reportDate.split('-').map(Number);
    const fallbackName = `Movement_${y}_${m}_${d}.pdf`;

    const locationPromise = requestSaveLocation({
      suggestedName: suggestedNameFromPath(path, fallbackName),
      mimeType: 'application/pdf',
    });

    const location = await locationPromise;
    if (location.mode === 'cancelled') return;

    setLoading(true);
    try {
      const { blob } = await reportsApi.downloadDailyMovementPdf(reportDate);
      await writeSaveLocation(location, blob);
      setSuccess(`Saved ${location.fileName}`);
    } catch (err) {
      await discardUnusedSaveLocation(location);
      setError(extractApiError(err, 'Produce Report failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={CalendarDays}
          title="Extract Daily Movement Report"
          subtitle="Produce the daily movement summary PDF report for a single date."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 640 }}>
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

          <Field label="Path" required>
            <input
              className="kaf-input"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="Optional — choose location in the save dialog"
              disabled={loading}
            />
          </Field>

          <ReportFeedback error={error} success={success} />

          <button
            type="button"
            className="kaf-btn"
            disabled={loading}
            onClick={() => void produceReport()}
            style={{
              width: '100%',
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
            }}
          >
            {loading ? (
              <>
                <span className="kaf-spinner" style={{ display: 'inline-block' }} /> Producing Report…
              </>
            ) : (
              <>
                <FileText size={16} /> Produce Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
