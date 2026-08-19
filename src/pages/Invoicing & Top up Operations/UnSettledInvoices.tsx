import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, invoicesApi } from '../../lib/api';
import type { Invoice } from '../../types';

const fmt2 = (v: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

export default function UnSettledInvoices() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    invoicesApi
      .list('Pending')
      .then((all) => {
        if (!cancelled) setRows(all);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load invoices.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={FileText}
          title="Unsettled Invoices"
          subtitle="فواتير غير محصلة"
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '20px 22px', overflowX: 'auto' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--kaf-muted)', padding: '24px 0' }}>
            <span className="kaf-spinner" style={{ display: 'inline-block' }} />
            Loading invoices…
          </div>
        )}

        {error && !loading && (
          <div className="kaf-callout error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {!loading && !error && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--kaf-border)' }}>
                <th style={thStyle}>Invoice Number</th>
                <th style={thStyle}>Company Number</th>
                <th style={thStyle}>Invoice Date</th>
                <th style={thStyle}>Date From</th>
                <th style={thStyle}>Date To</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>EGP Amount</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>USD Amount</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>EUR Amount</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--kaf-muted)' }}>
                    No unsettled invoices.
                  </td>
                </tr>
              )}
              {rows.map((inv, i) => (
                <tr
                  key={inv.invoiceNumber}
                  style={{
                    borderBottom: '1px solid var(--kaf-border)',
                    background: i % 2 === 0 ? 'transparent' : 'var(--kaf-surface-alt, rgba(0,0,0,0.02))',
                  }}
                >
                  <td style={tdStyle}>{inv.invoiceNumber}</td>
                  <td style={tdStyle}>{inv.companyNumber}</td>
                  <td style={tdStyle}>{dateHelpers.formatDisplay(inv.invoiceDate)}</td>
                  <td style={tdStyle}>{dateHelpers.formatDisplay(inv.dateFrom)}</td>
                  <td style={tdStyle}>{dateHelpers.formatDisplay(inv.dateTo)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt2(inv.egpAmount)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt2(inv.usdAmount)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt2(inv.eurAmount)}</td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      background: 'var(--kaf-warning-bg, #fff7e6)',
                      color: 'var(--kaf-warning, #b45309)',
                    }}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'left',
  fontWeight: 600,
  color: 'var(--kaf-text-secondary)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 10px',
  whiteSpace: 'nowrap',
};
