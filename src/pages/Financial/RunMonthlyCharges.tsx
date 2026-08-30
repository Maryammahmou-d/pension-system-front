import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Play, AlertCircle, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, monthlyChargesApi } from '../../lib/api';
import type { MonthlyChargeRun, MonthlyChargesResult } from '../../types';

export default function RunMonthlyCharges() {
  const today = new Date();
  const [runDate, setRunDate] = useState(dateHelpers.todayIso());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MonthlyChargesResult | null>(null);
  const [previousRuns, setPreviousRuns] = useState<MonthlyChargeRun[]>([]);

  useEffect(() => {
    setLoadingRuns(true);
    monthlyChargesApi
      .listPrevious()
      .then(setPreviousRuns)
      .catch(() => setPreviousRuns([]))
      .finally(() => setLoadingRuns(false));
  }, []);

  const handleRun = async () => {
    setError(null);
    setResult(null);

    setLoading(true);
    try {
      const res = await monthlyChargesApi.run(runDate, month, year);
      setResult(res);
      setPreviousRuns(res.previousRuns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Run failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={CalendarClock}
          title="Monthly IMC and Admin Charges Deduction"
          subtitle="Run the monthly charges and review previous runs."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="kaf-label">
              Run Date<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
            </label>
            <input
              className="kaf-input"
              type="date"
              value={runDate}
              onChange={(e) => { setRunDate(e.target.value); setError(null); }}
              disabled={loading}
            />
          </div>

          <div>
            <label className="kaf-label">Month</label>
            <input
              className="kaf-input"
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              disabled={loading}
            />
          </div>

          <div>
            <label className="kaf-label">Year</label>
            <input
              className="kaf-input"
              type="number"
              min={2000}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="button"
          className="kaf-btn"
          onClick={handleRun}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
        >
          {loading ? (
            <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Running…</>
          ) : (
            <><Play size={14} /> Run</>
          )}
        </button>

        {error && (
          <div className="kaf-callout error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {result && (
          <div className="kaf-callout ok" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={16} />
            Run completed for {result.run.paymentDate} · {result.run.processedCount} records processed.
          </div>
        )}
      </div>

      <div className="kaf-card" style={{ padding: '18px 20px' }}>
        <h2 className="kaf-section-head" style={{ marginBottom: 12 }}>Previous Runs</h2>
        <div style={{ maxHeight: 320, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--kaf-border)' }}>
          <table className="kaf-table" style={{ margin: 0, width: '100%' }}>
            <thead>
              <tr>
                <th>Payment Date</th>
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
                  {previousRuns.map((run) => (
                    <tr key={run.paymentDate}>
                      <td>{dateHelpers.formatDisplay(run.paymentDate)}</td>
                    </tr>
                  ))}
                  {previousRuns.length === 0 && (
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
