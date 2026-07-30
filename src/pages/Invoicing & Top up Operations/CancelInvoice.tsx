import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileX2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, invoicesApi } from '../../lib/api';
import type { Invoice } from '../../types';

export default function CancelInvoice() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [cancellationDate, setCancellationDate] = useState(dateHelpers.todayIso());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const list = await invoicesApi.list('Unsettled');
    setInvoices(list);
  }, []);

  useEffect(() => {
    void refresh().catch(() => setInvoices([]));
  }, [refresh]);

  const selected = useMemo(
    () => invoices.find((i) => i.invoiceNumber === invoiceNumber) ?? null,
    [invoices, invoiceNumber],
  );

  const clear = () => {
    setInvoiceNumber('');
    setCancellationDate(dateHelpers.todayIso());
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!invoiceNumber || !cancellationDate) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    try {
      const inv = await invoicesApi.cancel({
        invoiceNumber,
        cancellationDate,
      });
      setSuccess(`Invoice ${inv.invoiceNumber} cancelled.`);
      setInvoiceNumber('');
      setCancellationDate(dateHelpers.todayIso());
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={FileX2}
          title="Cancel Invoice"
          subtitle="Cancel an unsettled invoice."
          actions={
            (invoiceNumber || success || error) ? (
              <button type="button" className="kaf-btn-ghost" onClick={clear}>
                <X size={13} /> Clear
              </button>
            ) : undefined
          }
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 820 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Field label="Invoice Number" required>
              <select
                className="kaf-input"
                value={invoiceNumber}
                onChange={(e) => { setInvoiceNumber(e.target.value); setError(null); setSuccess(null); }}
                disabled={loading}
              >
                <option value="">Select invoice…</option>
                {invoices.map((i) => (
                  <option key={i.invoiceNumber} value={i.invoiceNumber}>
                    {i.invoiceNumber} — {i.companyNumber}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date From">
              <input
                className="kaf-input"
                readOnly
                value={selected ? dateHelpers.formatDisplay(selected.dateFrom) : ''}
              />
            </Field>
            <Field label="Date To">
              <input
                className="kaf-input"
                readOnly
                value={selected ? dateHelpers.formatDisplay(selected.dateTo) : ''}
              />
            </Field>
          </div>

          <div style={{ marginBottom: 14, maxWidth: 240 }}>
            <Field label="Cancellation Date" required>
              <input
                className="kaf-input"
                type="date"
                value={cancellationDate}
                onChange={(e) => setCancellationDate(e.target.value)}
                disabled={loading}
              />
            </Field>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 18,
          }}>
            <Field label="Company Number">
              <input className="kaf-input" readOnly value={selected?.companyNumber ?? ''} />
            </Field>
            <Field label="Invoice Date">
              <input
                className="kaf-input"
                readOnly
                value={selected ? dateHelpers.formatDisplay(selected.invoiceDate) : ''}
              />
            </Field>
            <Field label="EGP Amount">
              <input
                className="kaf-input"
                readOnly
                value={selected ? Math.round(selected.egpAmount).toLocaleString() : ''}
              />
            </Field>
          </div>

          {error && (
            <div className="kaf-callout error" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="kaf-btn" disabled={loading}>
              {loading
                ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Cancelling…</>
                : <><FileX2 size={14} /> Cancel Invoice</>}
            </button>
            <button type="button" className="kaf-btn-ghost" onClick={clear} disabled={loading}>
              Clear
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="kaf-callout ok"
            style={{ marginTop: 16, maxWidth: 820, display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <CheckCircle2 size={16} /> {success}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="kaf-label">
        {label}{required ? <span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span> : null}
      </label>
      {children}
    </div>
  );
}
