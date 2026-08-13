import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart2, Calculator, AlertCircle } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import { netCompanyFundsPaymentDateApi } from '../../../lib/api';
import { companiesApi } from '../../../lib/companiesApi';
import { extractApiError } from '../../../lib/httpClient';
import type { Company, NetCompanyFundsResult } from '../../../types';

const FUND_COLUMNS = [
  'eeUnits',
  'veeUnits',
  'erUnits',
  'totalUnits',
  'unitPrice',
  'eeFunds',
  'veeFunds',
  'erFunds',
  'totalFunds',
] as const;

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export default function NetCompanyFundsPaymentDate() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companyNumber, setCompanyNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NetCompanyFundsResult | null>(null);

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

  const handleCalculate = async () => {
    setError(null);
    setResult(null);

    if (!companyNumber) {
      setError('Company Number is required.');
      return;
    }
    if (!paymentDate) {
      setError('Payment Date is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await netCompanyFundsPaymentDateApi.calculate(companyNumber, paymentDate);
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
          title="Net Company Funds"
          subtitle="Payment Date basis."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="kaf-label">
              Company Number<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
            </label>
            <select
              className="kaf-input kaf-select"
              value={companyNumber}
              onChange={(e) => { setCompanyNumber(e.target.value); setResult(null); setError(null); }}
              disabled={loading || companiesLoading}
            >
              <option value="">{companiesLoading ? 'Loading companies…' : 'Select company…'}</option>
              {companies.map((c) => (
                <option key={c.companyNumber} value={c.companyNumber}>
                  {c.companyNumber} — {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="kaf-label">
              Payment Date<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
            </label>
            <input
              className="kaf-input"
              type="date"
              value={paymentDate}
              onChange={(e) => { setPaymentDate(e.target.value); setResult(null); setError(null); }}
              disabled={loading}
            />
          </div>
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
                gridTemplateColumns: '70px repeat(4, minmax(0, 1fr)) 100px repeat(4, minmax(0, 1fr))',
                gap: 6,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <div></div>
              <div className="kaf-label" style={{ textAlign: 'center', gridColumn: '2 / span 4' }}>Total Units</div>
              <div className="kaf-label" style={{ textAlign: 'center', gridColumn: '7 / span 1' }}>Unit Price</div>
              <div className="kaf-label" style={{ textAlign: 'center', gridColumn: '8 / span 4' }}>Total Funds</div>

              <div className="kaf-label" style={{ textAlign: 'left' }}>Fund</div>
              {['EE Fund', 'VEE Fund', 'ER Fund', 'Total Units', 'Unit Price', 'EE Fund', 'VEE Fund', 'ER Fund', 'Total Funds'].map((h) => (
                <div key={h} className="kaf-label" style={{ textAlign: 'center' }}>{h}</div>
              ))}

              {result.rows.map((row) => (
                <>
                  <div key={`f${row.fund}-label`} className="kaf-label" style={{ textAlign: 'left' }}>Fund {row.fund}</div>
                  {FUND_COLUMNS.map((col) => (
                    <input
                      key={`f${row.fund}-${col}`}
                      className="kaf-input"
                      type="text"
                      readOnly
                      value={col === 'unitPrice' ? fmt(row[col]) : fmt(row[col] as number)}
                      style={{ textAlign: 'right', padding: '6px 8px', fontSize: 12 }}
                    />
                  ))}
                </>
              ))}

              <div key="total-label" className="kaf-label" style={{ textAlign: 'left' }}></div>
              <div key="total-eeu" className="kaf-label" style={{ textAlign: 'left' }}></div>
              <div key="total-veeu" className="kaf-label" style={{ textAlign: 'left' }}></div>
              <div key="total-eru" className="kaf-label" style={{ textAlign: 'left' }}></div>
              <div key="total-tu" className="kaf-label" style={{ textAlign: 'left' }}></div>
              <div key="total-text" className="kaf-label" style={{ textAlign: 'center' }}>Total</div>
              <input key="total-ee" className="kaf-input" type="text" readOnly value={fmt(result.totalEEFunds)} style={{ textAlign: 'right', padding: '6px 8px', fontSize: 12 }} />
              <input key="total-vee" className="kaf-input" type="text" readOnly value={fmt(result.totalVEEFunds)} style={{ textAlign: 'right', padding: '6px 8px', fontSize: 12 }} />
              <input key="total-er" className="kaf-input" type="text" readOnly value={fmt(result.totalERFunds)} style={{ textAlign: 'right', padding: '6px 8px', fontSize: 12 }} />
              <input key="total-all" className="kaf-input" type="text" readOnly value={fmt(result.totalFunds)} style={{ textAlign: 'right', padding: '6px 8px', fontSize: 12 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
              <label className="kaf-label" style={{ marginBottom: 0 }}>Results are extracted for:</label>
              <input
                className="kaf-input"
                type="text"
                readOnly
                value={`${result.companyNumber} — ${result.companyName} | ${result.valuationDate}`}
                style={{ maxWidth: 360, background: 'var(--kaf-surface-3)' }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
