import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle, CheckCircle2, UserSearch, X } from 'lucide-react';
import { amlApi } from '../lib/api';
import type { AmlCheckResponse } from '../types';
import Badge from '../components/Badge';
import MatchCard from '../components/MatchCard';
import PageHeader from '../components/PageHeader';
import UserGuide from '../components/UserGuide';
import { amlCheckGuide } from '../components/guides/guideContent';

interface FormField {
  key: 'name' | 'nationalId' | 'passportId' | 'crNumber' | 'policyNumber';
  label: string;
  placeholder: string;
  dir?: 'rtl' | 'ltr';
  hint?: string;
}

const FIELDS: FormField[] = [
  { key: 'name', label: 'Full Name', placeholder: 'محمد أحمد علي', dir: 'rtl', hint: 'Arabic' },
  { key: 'nationalId', label: 'National ID', placeholder: '29901011234567' },
  { key: 'passportId', label: 'Passport ID', placeholder: 'A12345678' },
  { key: 'crNumber', label: 'Commercial Registry', placeholder: '12345678', hint: 'CR No.' },
];

const POLICY_FIELD: FormField = { key: 'policyNumber', label: 'Policy No.', placeholder: 'POL-2026-001234', hint: 'Optional' };

export default function AmlCheck() {
  const [form, setForm] = useState({ name: '', nationalId: '', passportId: '', crNumber: '', policyNumber: '' });
  const [result, setResult] = useState<AmlCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const hasInput = Object.values(form).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setResult(null);
    if (!hasInput) { setError('Enter at least one search criterion.'); return; }
    const payload = {
      name: form.name || undefined,
      nationalId: form.nationalId || undefined,
      passportId: form.passportId || undefined,
      crNumber: form.crNumber || undefined,
      sourceSystem: 'AML_FRONTEND',
      policyNumber: form.policyNumber || undefined,
    };
    setLoading(true);
    try {
      setResult(await amlApi.check(payload));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Failed to connect to backend.');
    } finally { setLoading(false); }
  };

  const reset = () => {
    setForm({ name: '', nationalId: '', passportId: '', crNumber: '', policyNumber: '' });
    setResult(null);
    setError('');
  };

  return (
    <div className="kaf-page">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <PageHeader
          icon={UserSearch}
          title="AML Check"
          subtitle="Screen an individual or company against active lists."
          actions={(
            <>
              <UserGuide pageTitle="AML Check" sections={amlCheckGuide} />
              {(hasInput || result) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={reset}
                  className="kaf-btn-ghost"
                  style={{ fontSize: 12, padding: '6px 14px' }}
                >
                  <X size={13} /> Clear
                </motion.button>
              )}
            </>
          )}
        />
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.28 }}
        onSubmit={handleSubmit}
      >
        <div className="kaf-card" style={{ padding: '24px 26px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'var(--kaf-purple-bg)', border: '1px solid var(--kaf-purple-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserSearch size={14} color="var(--kaf-purple-light)" />
            </div>
            <p className="kaf-section-head" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
              Search Criteria
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 10 }}>
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="kaf-label">
                  {f.label}
                  {f.hint && (
                    <span style={{ color: 'var(--kaf-muted-2)', fontWeight: 400, marginLeft: 4 }}>
                      · {f.hint}
                    </span>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="kaf-input"
                    dir={f.dir}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => set(f.key)(e.target.value)}
                  />
                  {form[f.key] && (
                    <button
                      type="button"
                      onClick={() => set(f.key)('')}
                      style={{
                        position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                        color: 'var(--kaf-muted-2)', lineHeight: 0,
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 18 }}>
            <label className="kaf-label">
              {POLICY_FIELD.label}
              <span style={{ color: 'var(--kaf-muted-2)', fontWeight: 400, marginLeft: 4 }}>
                · {POLICY_FIELD.hint}
              </span>
            </label>
            <div style={{ position: 'relative', maxWidth: 320 }}>
              <input
                type="text"
                className="kaf-input"
                placeholder={POLICY_FIELD.placeholder}
                value={form.policyNumber}
                onChange={(e) => set('policyNumber')(e.target.value)}
              />
              {form.policyNumber && (
                <button
                  type="button"
                  onClick={() => set('policyNumber')('')}
                  style={{
                    position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                    color: 'var(--kaf-muted-2)', lineHeight: 0,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="kaf-callout error"
                style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" className="kaf-btn" disabled={loading}>
            {loading
              ? <span className="kaf-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              : <Search size={15} />}
            {loading ? 'Screening…' : 'Run AML Check'}
          </button>
        </div>
      </motion.form>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="kaf-card"
            style={{
              padding: '22px 26px',
              borderTop: `3px solid ${result.status === 'FLAGGED' ? 'var(--kaf-error)' : 'var(--kaf-success)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <p className="kaf-section-head" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                Screening Result
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {result.status === 'FLAGGED'
                  ? <AlertCircle size={16} color="var(--kaf-error)" />
                  : <CheckCircle2 size={16} color="var(--kaf-success)" />}
                <Badge variant={result.status === 'FLAGGED' ? 'flagged' : 'clear'}>
                  {result.status}
                </Badge>
              </div>
            </div>

            {result.status === 'FLAGGED' ? (
              <>
                <div className="kaf-callout error" style={{ marginBottom: 18, fontSize: 12.5 }}>
                  <strong>{result.totalMatches} match{result.totalMatches !== 1 ? 'es' : ''}</strong> found across active AML lists
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.matches.map((m, i) => <MatchCard key={m.recordId} match={m} index={i} />)}
                </div>
              </>
            ) : (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                style={{ textAlign: 'center', padding: '36px 0' }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(16,185,129,0.12)',
                  border: '2px solid rgba(16,185,129,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <CheckCircle2 size={26} color="var(--kaf-success)" />
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--kaf-dark)', marginBottom: 5 }}>No matches found</p>
                <p style={{ fontSize: 13, color: 'var(--kaf-muted)' }}>
                  This entity is not listed in any active AML list.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
