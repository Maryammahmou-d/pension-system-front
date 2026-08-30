import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Play } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, reportsApi } from '../../lib/api';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';
import { extractApiError } from '../../lib/httpClient';

export default function RunHrBalanceDashboard() {
  const [valuationDate, setValuationDate] = useState(dateHelpers.todayIso());
  const [previousRuns, setPreviousRuns] = useState<string[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPreviousRuns() {
      setLoadingRuns(true);
      try {
        const runs = await reportsApi.getHrBalanceDashboardPreviousRuns();
        if (!cancelled && Array.isArray(runs)) {
          setPreviousRuns(runs);
        }
      } catch (err) {
        console.error('Failed to load previous HR dashboard runs:', err);
      } finally {
        if (!cancelled) {
          setLoadingRuns(false);
        }
      }
    }
    void loadPreviousRuns();
    return () => {
      cancelled = true;
    };
  }, []);

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
      const result = await reportsApi.runHrBalanceDashboard(valuationDate);
      if (result.previousRuns) {
        setPreviousRuns(result.previousRuns);
      } else {
        setPreviousRuns((prev) => {
          if (prev.includes(valuationDate)) return prev;
          return [valuationDate, ...prev];
        });
      }
      setSuccess(`HR Balance Dashboard run completed successfully for ${dateHelpers.formatDisplay(valuationDate)}.`);
    } catch (err) {
      setError(extractApiError(err, 'Run failed. Please try again.'));
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
              {loadingRuns ? (
                <tr>
                  <td style={{ color: 'var(--kaf-muted)' }}>
                    <span className="kaf-spinner" style={{ display: 'inline-block', marginRight: 8 }} />
                    Loading previous runs…
                  </td>
                </tr>
              ) : (
                <>
                  {sortedRuns.map((iso) => (
                    <tr key={iso}>
                      <td>{dateHelpers.formatDisplay(iso)}</td>
                    </tr>
                  ))}
                  {sortedRuns.length === 0 && (
                    <tr>
                      <td style={{ color: 'var(--kaf-muted)' }}>No previous runs recorded.</td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
