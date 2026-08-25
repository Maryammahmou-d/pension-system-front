import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarRange } from 'lucide-react';
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

export default function TransactionsBetweenDatesReport() {
  const today = dateHelpers.todayIso();
  const [path, setPath] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    setSuccess(null);
    if (!startDate || !endDate) {
      setError('Start Date and End Date are required.');
      return;
    }
    if (startDate > endDate) {
      setError('Start Date must be on or before End Date.');
      return;
    }
    const fallbackName = `Transactions_${startDate.replace(/-/g, '')}_${endDate.replace(/-/g, '')}.xlsx`;
    const locationPromise = requestSaveLocation({
      suggestedName: suggestedNameFromPath(path, fallbackName),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const location = await locationPromise;
    if (location.mode === 'cancelled') return;

    setLoading(true);
    try {
      const { blob } = await reportsApi.downloadTransactionsBetweenDates(startDate, endDate);
      await writeSaveLocation(location, blob);
      setSuccess(`Saved ${location.fileName}`);
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
          icon={CalendarRange}
          title="Extract Transactions Between Dates"
          subtitle="Export transactions for a date range."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 560 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Path">
            <input
              className="kaf-input"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="Optional — choose location in the save dialog"
              disabled={loading}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Start Date" required>
              <input
                className="kaf-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
              />
            </Field>
            <Field label="End Date" required>
              <input
                className="kaf-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
              />
            </Field>
          </div>

          <ReportFeedback error={error} success={success} />

          <button type="button" className="kaf-btn" disabled={loading} onClick={() => void run()} style={{ width: '100%', marginTop: 4 }}>
            {loading
              ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Extracting…</>
              : 'Extract Transactions'}
          </button>
        </div>
      </div>
    </div>
  );
}

