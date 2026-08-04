import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart2, Calculator, AlertCircle } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import { netUnitsApi } from '../../../lib/api';
import type { NetUnitsResult } from '../../../types';

const COLUMNS = ['eeUnits', 'veeUnits', 'erUnits', 'totalUnits'] as const;

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export default function NetUnits() {
  const [valuationDate, setValuationDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NetUnitsResult | null>(null);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);

    if (!valuationDate) {
      setError('Valuation Date is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await netUnitsApi.calculate(valuationDate);
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
          title="Net Units"
          subtitle="Calculate total net units across all active members."
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '70px repeat(4, minmax(0, 1fr))',
                gap: 6,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <div className="kaf-label" style={{ textAlign: 'left' }}>Fund</div>
              {['EE Fund', 'VEE Fund', 'ER Fund', 'Total Units'].map((h) => (
                <div key={h} className="kaf-label" style={{ textAlign: 'center' }}>{h}</div>
              ))}

              {result.rows.map((row) => (
                <>
                  <div key={`f${row.fund}-label`} className="kaf-label" style={{ textAlign: 'left' }}>Fund {row.fund}</div>
                  {COLUMNS.map((col) => (
                    <input
                      key={`f${row.fund}-${col}`}
                      className="kaf-input"
                      type="text"
                      readOnly
                      value={fmt(row[col])}
                      style={{ textAlign: 'right', padding: '6px 8px', fontSize: 12 }}
                    />
                  ))}
                </>
              ))}

              <div key="total-label" className="kaf-label" style={{ textAlign: 'left' }}>Total</div>
              <input key="total-ee" className="kaf-input" type="text" readOnly value={fmt(result.totalEEUnits)} style={{ textAlign: 'right', padding: '6px 8px', fontSize: 12 }} />
              <input key="total-vee" className="kaf-input" type="text" readOnly value={fmt(result.totalVEEUnits)} style={{ textAlign: 'right', padding: '6px 8px', fontSize: 12 }} />
              <input key="total-er" className="kaf-input" type="text" readOnly value={fmt(result.totalERUnits)} style={{ textAlign: 'right', padding: '6px 8px', fontSize: 12 }} />
              <input key="total-all" className="kaf-input" type="text" readOnly value={fmt(result.totalUnits)} style={{ textAlign: 'right', padding: '6px 8px', fontSize: 12 }} />
            </div>

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
