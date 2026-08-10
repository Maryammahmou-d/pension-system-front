import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, invoicesApi, reportsApi } from '../../lib/api';
import { mockExportContents, saveFileWithPicker, suggestedNameFromPath } from '../../lib/saveFile';
import type { Invoice } from '../../types';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';

export default function InvoiceDetailsReport() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void invoicesApi.list().then(setInvoices).catch(() => setInvoices([]));
  }, []);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (dateFrom && inv.invoiceDate < dateFrom) return false;
      if (dateTo && inv.invoiceDate > dateTo) return false;
      return true;
    });
  }, [invoices, dateFrom, dateTo]);

  const selected = useMemo(
    () => filtered.find((i) => i.invoiceNumber === invoiceNumber) ?? null,
    [filtered, invoiceNumber],
  );

  useEffect(() => {
    if (invoiceNumber && !filtered.some((i) => i.invoiceNumber === invoiceNumber)) {
      setInvoiceNumber('');
    }
  }, [filtered, invoiceNumber]);

  const run = async () => {
    setError(null);
    setSuccess(null);
    if (!invoiceNumber) {
      setError('Invoice Number is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await reportsApi.extract('invoice-details', 'data', {
        invoiceNumber, path: path || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
      });
      const saved = await saveFileWithPicker({
        suggestedName: suggestedNameFromPath(path, `invoice-details-${invoiceNumber}.txt`),
        contents: mockExportContents('Invoice Details', {
          invoiceNumber, dateFrom, dateTo, selected,
        }),
      });
      if (saved === 'cancelled') return;
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extract failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={FileText}
          title="Extract Invoice Details"
          subtitle="Select an invoice and extract its detail record."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 820 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 14, alignItems: 'end' }}>
            <Field label="Invoice Number" required>
              <select
                className="kaf-input kaf-select"
                value={invoiceNumber}
                onChange={(e) => { setInvoiceNumber(e.target.value); setError(null); setSuccess(null); }}
                disabled={loading}
              >
                <option value="">Select invoice…</option>
                {filtered.map((i) => (
                  <option key={i.invoiceNumber} value={i.invoiceNumber}>
                    {i.invoiceNumber} — {i.companyNumber}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date From">
              <input
                className="kaf-input"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                disabled={loading}
              />
            </Field>
            <Field label="Date To">
              <input
                className="kaf-input"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                disabled={loading}
              />
            </Field>
          </div>

          <Field label="Path">
            <input
              className="kaf-input"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="Optional — choose location in the save dialog"
              disabled={loading}
            />
          </Field>

          <div style={{
            marginTop: 2,
            paddingTop: 16,
            borderTop: '1px solid var(--kaf-border)',
          }}>
            <p className="kaf-section-head" style={{ marginBottom: 12 }}>Invoice Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
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
              <Field label="Status">
                <input className="kaf-input" readOnly value={selected?.status ?? ''} />
              </Field>
              <Field label="EGP Amount">
                <input
                  className="kaf-input"
                  readOnly
                  value={selected ? selected.egpAmount.toLocaleString() : ''}
                />
              </Field>
              <Field label="USD Amount">
                <input
                  className="kaf-input"
                  readOnly
                  value={selected ? selected.usdAmount.toLocaleString() : ''}
                />
              </Field>
              <Field label="EUR Amount">
                <input
                  className="kaf-input"
                  readOnly
                  value={selected ? selected.eurAmount.toLocaleString() : ''}
                />
              </Field>
            </div>
          </div>

          <ReportFeedback error={error} success={success} />

          <button type="button" className="kaf-btn" disabled={loading} onClick={() => void run()} style={{ width: '100%', marginTop: 2 }}>
            {loading
              ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Extracting…</>
              : 'Extract Invoice Details'}
          </button>
        </div>
      </div>
    </div>
  );
}

