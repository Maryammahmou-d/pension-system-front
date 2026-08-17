import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart2, Calculator, AlertCircle } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import FundNetSummaryTable from '../../../components/FundNetSummaryTable';
import { netFundsApi } from '../../../lib/api';
import type { NetFundsResult } from '../../../types';

export default function NetFunds() {
  const [valuationDate, setValuationDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NetFundsResult | null>(null);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);

    if (!valuationDate) {
      setError('Valuation Date is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await netFundsApi.calculate(valuationDate);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={FileBarChart2}
          title="Net Funds"
          subtitle="Calculate total net funds across all active members."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '20px 22px' }}>
        <div style={{ maxWidth: 300, marginBottom: 16 }}>
          <label className="kaf-label">
            Valuation Date<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
          </label>
          <input
            className="kaf-input"
            type="date"
            value={valuationDate}
            onChange={(e) => { setValuationDate(e.target.value); setResult(null); setError(null); }}
            disabled={loading}
          />
        </div>

        <button
          type="button"
          className="kaf-btn"
          onClick={handleCalculate}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}
        >
          {loading ? (
            <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Calculating…</>
          ) : (
            <><Calculator size={14} /> Calculate</>
          )}
        </button>

        {error && (
          <div className="kaf-callout error" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {result && (
          <>
            <FundNetSummaryTable
              rows={result.rows}
              totalEEFunds={result.totalEEFunds}
              totalVEEFunds={result.totalVEEFunds}
              totalERFunds={result.totalERFunds}
              totalFunds={result.totalFunds}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
              <label className="kaf-label" style={{ marginBottom: 0 }}>Results are extracted for:</label>
              <input
                className="kaf-input"
                type="text"
                readOnly
                value={result.valuationDate}
                style={{ maxWidth: 200, background: 'var(--kaf-surface-3)' }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
