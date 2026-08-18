import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import { unitPricesApi } from '../../../lib/api';
import type { UnitPriceRow } from '../../../types';

const FUNDS = [
  { key: 'fund1' as const, label: 'Fund1' },
  { key: 'fund2' as const, label: 'Fund2' },
  { key: 'fund3' as const, label: 'Fund3' },
  { key: 'fund4' as const, label: 'Fund4' },
  { key: 'fund5' as const, label: 'Fund5' },
  { key: 'fund6' as const, label: 'Fund6' },
  { key: 'fund7' as const, label: 'Fund7' },
  { key: 'fund8' as const, label: 'Fund8' },
  { key: 'fund9' as const, label: 'Fund9' },
  { key: 'fund10' as const, label: 'Fund10' },
];

const fmt6 = (v: number | null | undefined) =>
  v == null ? '' : v.toFixed(6);

export default function ViewUnitPrices() {
  const [rows, setRows] = useState<UnitPriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    unitPricesApi.list()
      .then((data) => { if (!cancelled) setRows(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load unit prices.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={TrendingUp}
          title="View Unit Prices"
          subtitle="Read-only history of all daily unit prices for the ten funds."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '20px 22px', overflowX: 'auto' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--kaf-muted)', padding: '24px 0' }}>
            <span className="kaf-spinner" style={{ display: 'inline-block' }} />
            Loading unit prices…
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
                <th style={thStyle}>Price Date</th>
                {FUNDS.map((f) => (
                  <th key={f.key} style={thStyle}>{f.label}</th>
                ))}
                <th style={thStyle}>UserName</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--kaf-muted)' }}>
                    No unit prices found.
                  </td>
                </tr>
              )}
              {rows.map((row, i) => (
                <tr
                  key={row.priceDate + i}
                  style={{
                    borderBottom: '1px solid var(--kaf-border)',
                    background: i % 2 === 0 ? 'transparent' : 'var(--kaf-surface-alt, rgba(0,0,0,0.02))',
                  }}
                >
                  <td style={tdStyle}>{row.priceDate}</td>
                  {FUNDS.map((f) => (
                    <td key={f.key} style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt6(row[f.key])}
                    </td>
                  ))}
                  <td style={tdStyle}>{row.userName ?? ''}</td>
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
