import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Play } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, reportsApi } from '../../lib/api';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';

/** Seed previous runs like Access (month-end valuation dates, newest first). */
const INITIAL_RUNS = [
  '2026-05-31',
  '2026-04-30',
  '2026-03-31',
  '2026-02-28',
  '2026-01-31',
  '2025-12-31',
  '2025-11-30',
  '2025-10-31',
  '2025-09-30',
  '2025-08-31',
  '2025-07-31',
  '2025-06-30',
  '2025-05-31',
  '2025-04-30',
  '2025-03-31',
];

export default function RunHrBalanceDashboard() {
  const [valuationDate, setValuationDate] = useState(dateHelpers.todayIso());
  const [previousRuns, setPreviousRuns] = useState<string[]>(INITIAL_RUNS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sortedRuns = useMemo(
    () => [...previousRuns].sort((a, b) => b.localeCompare(a)),
    [previousRuns],
  );

  const run = async () => {
    setError(null);
    setSuccess(null);
    if (!valuationDate) {
      setError('Valuation Date is required.');
      return;
    }
    setLoading(true);
    try {
      await reportsApi.extract('hr-balance-dashboard', 'data', { valuationDate });
      setPreviousRuns((prev) => {
        if (prev.includes(valuationDate)) return prev;
        return [valuationDate, ...prev];
      });
      setSuccess(`HR Balance Dashboard run completed for ${dateHelpers.formatDisplay(valuationDate)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={LayoutDashboard}
          title="Run HR Balance Dashboard"
          subtitle="Run the HR balance dashboard for a valuation date."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 520 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Valuation Date" required>
            <input
              className="kaf-input"
              type="date"
              value={valuationDate}
              onChange={(e) => {
                setValuationDate(e.target.value);
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
            />
          </Field>

          <ReportFeedback error={error} success={success} />

          <button
            type="button"
            className="kaf-btn"
            disabled={loading}
            onClick={() => void run()}
            style={{ alignSelf: 'flex-start', minWidth: 120 }}
          >
            {loading
              ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Running…</>
              : <><Play size={14} /> Run</>}
          </button>
        </div>
      </div>

      <div className="kaf-card" style={{ padding: '18px 20px', maxWidth: 520, marginTop: 18 }}>
        <h2 style={{
          margin: '0 0 12px',
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--kaf-purple-deep, var(--kaf-purple))',
        }}>
          Previous Runs
        </h2>
        <div style={{ maxHeight: 320, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--kaf-border)' }}>
          <table className="kaf-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Valuation Date</th>
              </tr>
            </thead>
            <tbody>
              {sortedRuns.map((iso) => (
                <tr key={iso}>
                  <td>{dateHelpers.formatDisplay(iso)}</td>
                </tr>
              ))}
              {sortedRuns.length === 0 && (
                <tr>
                  <td style={{ color: 'var(--kaf-muted)' }}>No previous runs.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

