import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import { useAuth } from '../../../lib/auth';
import { dateHelpers, unitPricesApi } from '../../../lib/api';
import type { UnitPriceRow } from '../../../types';

const FUNDS = [
  { key: 'fund1', label: 'Fund1 - ABA', required: true },
  { key: 'fund2', label: 'Fund2 - GB', required: true },
  { key: 'fund3', label: 'Fund3 - MSMEDA', required: true },
  { key: 'fund4', label: 'Fund4 - Gold', required: true },
  { key: 'fund5', label: 'Fund5 - Money Market', required: true },
  { key: 'fund6', label: 'Fund6 - USD', required: true },
  { key: 'fund7', label: 'Fund7', required: true },
  { key: 'fund8', label: 'Fund8', required: true },
  { key: 'fund9', label: 'Fund9', required: true },
  { key: 'fund10', label: 'Fund10', required: false },
] as const;

type FundKey = typeof FUNDS[number]['key'];

const EMPTY: Record<FundKey, string> = Object.fromEntries(
  FUNDS.map((f) => [f.key, '']),
) as Record<FundKey, string>;

export default function UpdateUnitPrice() {
  const [priceDate, setPriceDate] = useState(dateHelpers.todayIso());
  const [values, setValues] = useState<Record<FundKey, string>>({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();

  const handleChange = (key: FundKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const clear = () => {
    setPriceDate(dateHelpers.todayIso());
    setValues({ ...EMPTY });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!priceDate) {
      setError('Price Date is required.');
      return;
    }

    for (const { key, label, required } of FUNDS) {
      if (required && values[key].trim() === '') {
        setError(`${label} is required.`);
        return;
      }
      if (values[key].trim() !== '' && Number.isNaN(Number(values[key]))) {
        setError(`${label} must be a valid number.`);
        return;
      }
    }

    const row = { priceDate } as UnitPriceRow;
    for (const { key } of FUNDS) {
      (row as Record<FundKey, number>)[key] = Number(values[key]) || 0;
    }

    if (!user?.id) {
      setError('You must be signed in to save unit prices.');
      return;
    }

    setLoading(true);
    try {
      await unitPricesApi.save(user.id, row);
      setSuccess(`Unit prices saved for ${priceDate}.`);
      setPriceDate(dateHelpers.todayIso());
      setValues({ ...EMPTY });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save unit price.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={TrendingUp}
          title="Update Unit Price"
          subtitle="Add or update daily unit prices for the ten funds."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '20px 22px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 360px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 220px',
                  gap: '10px 12px',
                  alignItems: 'center',
                }}
              >
                <label className="kaf-label">
                  Price Date<span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>
                </label>
                <input
                  className="kaf-input"
                  type="date"
                  value={priceDate}
                  onChange={(e) => setPriceDate(e.target.value)}
                  disabled={loading}
                />

                {FUNDS.map(({ key, label, required }) => (
                  <>
                    <label key={`${key}-label`} className="kaf-label">
                      {label}
                      {required ? <span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span> : null}
                    </label>
                    <input
                      key={key}
                      className="kaf-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={values[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      disabled={loading}
                    />
                  </>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                minWidth: 120,
                paddingTop: 70,
              }}
            >
              <button
                type="submit"
                className="kaf-btn"
                disabled={loading}
                style={{ width: 120, justifyContent: 'center' }}
              >
                {loading ? (
                  <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Saving…</>
                ) : (
                  <><TrendingUp size={14} /> Add</>
                )}
              </button>
              <button
                type="button"
                className="kaf-btn-ghost"
                onClick={clear}
                disabled={loading}
                style={{ width: 120, justifyContent: 'center' }}
              >
                <RotateCcw size={14} /> Clear
              </button>
            </div>
          </div>

          {error && (
            <div
              className="kaf-callout error"
              style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <AlertCircle size={15} /> {error}
            </div>
          )}
        </form>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="kaf-callout ok"
              style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <CheckCircle2 size={16} /> {success}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
