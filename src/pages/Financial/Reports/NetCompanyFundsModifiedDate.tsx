import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart2, Calculator, AlertCircle } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import FundNetSummaryTable from '../../../components/FundNetSummaryTable';
import { netCompanyFundsApi } from '../../../lib/api';
import { companiesApi } from '../../../lib/companiesApi';
import { extractApiError } from '../../../lib/httpClient';
import type { Company, NetCompanyFundsResult } from '../../../types';

export default function NetCompanyFundsModifiedDate() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companyNumber, setCompanyNumber] = useState('');
  const [valuationDate, setValuationDate] = useState('');
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

    if (!companyNumber || !valuationDate) {
      setError('Please fill all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await netCompanyFundsApi.calculate(companyNumber, valuationDate);
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
          subtitle="Modified Date basis."
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              <label className="kaf-label" style={{ marginBottom: 0 }}>Results are extracted for:</label>
              <input
                className="kaf-input"
                type="text"
                readOnly
                dir="ltr"
                value={`${result.companyNumber} | ${result.dateFinal ?? result.valuationDate} | ${result.companyName}`}
                style={{ maxWidth: 480, background: 'var(--kaf-surface-3)' }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
