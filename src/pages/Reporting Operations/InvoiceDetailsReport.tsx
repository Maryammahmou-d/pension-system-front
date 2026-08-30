import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, invoicesApi, reportsApi } from '../../lib/api';
import { extractApiError } from '../../lib/httpClient';
import {
  discardUnusedSaveLocation,
  requestSaveLocation,
  suggestedNameFromPath,
  writeSaveLocation,
} from '../../lib/saveFile';
import type { Invoice } from '../../types';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';

function formatAmount(val: number | null | undefined): string {
  if (val == null) return '';
  const num = Number(val);
  if (Number.isNaN(num)) return '';
  const fixed = num.toFixed(5);
  return fixed.replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');
}

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

    const defaultFilename = `Invoice_${invoiceNumber}.xlsx`;
    const locationPromise = requestSaveLocation({
      suggestedName: suggestedNameFromPath(path, defaultFilename),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const location = await locationPromise;
    if (location.mode === 'cancelled') return;

    setLoading(true);
    try {
      const contents = await reportsApi.downloadInvoiceDetailsExcel(invoiceNumber);
      await writeSaveLocation(location, contents);
      setSuccess('Excel report generated successfully.');
    } catch (err) {
      await discardUnusedSaveLocation(location);
      setError(extractApiError(err, 'Extract failed'));
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

      <div className="kaf-card" style={{ padding: '24px 28px', maxWidth: 960 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16, alignItems: 'end' }}>
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
            marginTop: 4,
            paddingTop: 18,
            borderTop: '1px solid var(--kaf-border)',
          }}>
            <p className="kaf-section-head" style={{ marginBottom: 14 }}>Invoice Details</p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(120px, 1.1fr) minmax(110px, 1fr) minmax(140px, 1.3fr) minmax(80px, 0.8fr) minmax(80px, 0.8fr) minmax(80px, 0.8fr)',
              gap: 12,
            }}>
              <Field label="Company Number">
                <input className="kaf-input" readOnly value={selected?.companyNumber ?? ''} style={{ whiteSpace: 'nowrap' }} />
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
                  value={formatAmount(selected?.egpAmount)}
                />
              </Field>
              <Field label="USD Amount">
                <input
                  className="kaf-input"
                  readOnly
                  value={formatAmount(selected?.usdAmount)}
                />
              </Field>
              <Field label="EUR Amount">
                <input
                  className="kaf-input"
                  readOnly
                  value={formatAmount(selected?.eurAmount)}
                />
              </Field>
              <Field label="Status">
                <input className="kaf-input" readOnly value={selected?.status ?? ''} />
              </Field>
            </div>
          </div>

          <ReportFeedback error={error} success={success} />

          <button type="button" className="kaf-btn" disabled={loading} onClick={() => void run()} style={{ width: '100%', marginTop: 4 }}>
            {loading
              ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Extracting…</>
              : 'Extract Invoice Details'}
          </button>
        </div>
      </div>
    </div>
  );
}
