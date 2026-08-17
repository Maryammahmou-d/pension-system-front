import type { CSSProperties } from 'react';
import type { FundNetSummary, NetCompanyFundRow } from '../types';
import { fmtAccessFundCell } from '../lib/formatNumber';

type FundRow = FundNetSummary | NetCompanyFundRow;

const COLUMNS = [
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

const HEADERS = [
  'EE Fund',
  'VEE Fund',
  'ER Fund',
  'Total Units',
  'Unit Price',
  'EE Fund',
  'VEE Fund',
  'ER Fund',
  'Total Funds',
] as const;

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '72px repeat(4, minmax(70px, 1fr)) 96px repeat(4, minmax(70px, 1fr))',
  columnGap: 6,
  rowGap: 8,
  alignItems: 'center',
};

const heading: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--kaf-muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  textAlign: 'center',
  margin: 0,
};

const rowLabel: CSSProperties = {
  ...heading,
  textAlign: 'left',
};

const cellInput: CSSProperties = {
  textAlign: 'right',
  padding: '6px 8px',
  fontSize: 12,
  width: '100%',
  minWidth: 0,
};

export default function FundNetSummaryTable({
  rows,
  totalEEFunds,
  totalVEEFunds,
  totalERFunds,
  totalFunds,
}: {
  rows: FundRow[];
  totalEEFunds: number;
  totalVEEFunds: number;
  totalERFunds: number;
  totalFunds: number;
}) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 8 }}>
      <div style={{ ...grid, minWidth: 920 }}>
        <div />
        <div style={{ ...heading, gridColumn: '2 / span 4' }}>Total Units</div>
        <div style={{ ...heading, gridColumn: '6 / span 1' }}>Unit Price</div>
        <div style={{ ...heading, gridColumn: '7 / span 4' }}>Total Funds</div>

        <div style={rowLabel}>Fund</div>
        {HEADERS.map((label, i) => (
          <div key={`${label}-${i}`} style={heading}>{label}</div>
        ))}

        {rows.map((row) => (
          <div key={row.fund} style={{ display: 'contents' }}>
            <div style={rowLabel}>Fund {row.fund}</div>
            {COLUMNS.map((col) => (
              <input
                key={col}
                className="kaf-input"
                type="text"
                readOnly
                value={fmtAccessFundCell(col, row[col])}
                style={cellInput}
              />
            ))}
          </div>
        ))}

        <div />
        <div />
        <div />
        <div />
        <div />
        <div style={heading}>Total</div>
        <input className="kaf-input" type="text" readOnly value={fmtAccessFundCell('eeFunds', totalEEFunds)} style={cellInput} />
        <input className="kaf-input" type="text" readOnly value={fmtAccessFundCell('veeFunds', totalVEEFunds)} style={cellInput} />
        <input className="kaf-input" type="text" readOnly value={fmtAccessFundCell('erFunds', totalERFunds)} style={cellInput} />
        <input className="kaf-input" type="text" readOnly value={fmtAccessFundCell('totalFunds', totalFunds)} style={cellInput} />
      </div>
    </div>
  );
}
