import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { vestingRulesApi } from '../../lib/api';
import { companiesApi } from '../../lib/companiesApi';
import { extractApiError } from '../../lib/httpClient';
import type { Company, VestingRule, VestingRuleSummary } from '../../types';

const YEARS = [
  { key: 'year1', label: 'Year 1', required: true },
  { key: 'year2', label: 'Year 2', required: true },
  { key: 'year3', label: 'Year 3', required: true },
  { key: 'year4', label: 'Year 4', required: true },
  { key: 'year5', label: 'Year 5', required: true },
  { key: 'year6', label: 'Year 6', required: true },
  { key: 'year7', label: 'Year 7', required: true },
  { key: 'year8', label: 'Year 8', required: true },
  { key: 'year9', label: 'Year 9', required: true },
  { key: 'year10', label: 'Year 10', required: false },
] as const;

type YearKey = typeof YEARS[number]['key'];

const EMPTY: Record<YearKey, string> = {
  year1: '100', year2: '100', year3: '100', year4: '100', year5: '100',
  year6: '100', year7: '100', year8: '100', year9: '100', year10: '100',
};

export default function AddVestingRules() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [rules, setRules] = useState<VestingRuleSummary[]>([]);
  const [companyNumber, setCompanyNumber] = useState('');
  const [values, setValues] = useState<Record<YearKey, string>>({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  useEffect(() => {
    if (!companyNumber) {
      setRules([]);
      return;
    }
    let cancelled = false;
    void vestingRulesApi
      .get(companyNumber)
      .then((rule) => {
        if (!cancelled) setRules(rule ? [rule] : []);
      })
      .catch(() => {
        if (!cancelled) setRules([]);
      });
    return () => {
      cancelled = true;
    };
  }, [companyNumber]);

  const handleChange = (key: YearKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!companyNumber) {
      setError('Company Number is required.');
      return;
    }

    for (const { key, label, required } of YEARS) {
      const value = values[key].trim();
      if (required && value === '') {
        setError(`${label} is required.`);
        return;
      }
      if (value !== '' && (Number.isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
        setError(`${label} must be a percentage between 0 and 100.`);
        return;
      }
    }

    const rule: VestingRule = {
      companyNumber,
      year1: Number(values.year1),
      year2: Number(values.year2),
      year3: Number(values.year3),
      year4: Number(values.year4),
      year5: Number(values.year5),
      year6: Number(values.year6),
      year7: Number(values.year7),
      year8: Number(values.year8),
      year9: Number(values.year9),
      year10: Number(values.year10),
    };

    setLoading(true);
    try {
      await vestingRulesApi.create(rule);
      setSuccess(`Vesting rules added for ${companyNumber}.`);
      setCompanyNumber('');
      setValues({ ...EMPTY });
      setRules([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vesting rules.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={Scale}
          title="Add New Vesting Rules"
          subtitle="Define yearly vesting percentages for a company."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '20px 22px', marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <label className="kaf-label">
            Company Number<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
          </label>
          <select
            className="kaf-input kaf-select"
            value={companyNumber}
            onChange={(e) => { setCompanyNumber(e.target.value); setError(null); setSuccess(null); }}
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 200px',
            gap: '10px 12px',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          {YEARS.map(({ key, label, required }) => (
            <>
              <label key={`${key}-label`} className="kaf-label">
                {label}{required ? <span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span> : null}
              </label>
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  className="kaf-input"
                  type="number"
                  min={0}
                  max={100}
                  value={values[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  disabled={loading}
                  style={{ textAlign: 'right' }}
                />
                <span className="kaf-label" style={{ marginBottom: 0, color: 'var(--kaf-muted)' }}>%</span>
              </div>
            </>
          ))}
        </div>

        <button
          type="button"
          className="kaf-btn"
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
        >
          {loading ? (
            <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Saving…</>
          ) : (
            <><PlusCircle size={14} /> Add Vesting Rules</>
          )}
        </button>

        {error && (
          <div className="kaf-callout error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {success && (
          <div className="kaf-callout ok" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={16} /> {success}
          </div>
        )}
      </div>

      <div className="kaf-card" style={{ padding: '20px 22px' }}>
        <h2 className="kaf-section-head" style={{ marginBottom: 12 }}>Existing Vesting Rules</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="kaf-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Company Number</th>
                {YEARS.map(({ label }) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.companyNumber}>
                  <td>{rule.companyNumber}</td>
                  {YEARS.map(({ key }) => (
                    <td key={`${rule.companyNumber}-${key}`}>{rule[key]}%</td>
                  ))}
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ color: 'var(--kaf-muted)' }}>
                    {companyNumber
                      ? 'No vesting rules defined for this company.'
                      : 'Select a company to view existing vesting rules.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
