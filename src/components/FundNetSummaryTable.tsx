import type { CSSProperties } from 'react';
import type { FundNetSummary, NetCompanyFundRow } from '../types';
import { fmtAccessFundCell } from '../lib/formatNumber';

type FundRow = FundNetSummary | NetCompanyFundRow;

const UNIT_COLUMNS = ['eeUnits', 'veeUnits', 'erUnits', 'totalUnits'] as const;
const FUND_COLUMNS = ['eeFunds', 'veeFunds', 'erFunds', 'totalFunds'] as const;

const UNIT_HEADERS = ['EE Fund', 'VEE Fund', 'ER Fund', 'Total Units'] as const;
const FUND_HEADERS = ['EE Fund', 'VEE Fund', 'ER Fund', 'Total Funds'] as const;

const heading: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--kaf-muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  textAlign: 'center',
  margin: 0,
  minHeight: 16,
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

const section: CSSProperties = {
  display: 'grid',
  rowGap: 8,
  columnGap: 6,
  alignItems: 'center',
};

const divider: CSSProperties = {
  width: 1,
  alignSelf: 'stretch',
  background: 'var(--kaf-text)',
  flexShrink: 0,
};

function HeaderCell({ children, style }: { children?: string; style?: CSSProperties }) {
  return <div style={{ ...heading, ...style }}>{children ?? '\u00a0'}</div>;
}

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
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, minWidth: 940 }}>
        <div style={{ ...section, gridTemplateColumns: '72px' }}>
          <HeaderCell style={rowLabel} />
          <HeaderCell style={rowLabel}>Fund</HeaderCell>
          {rows.map((row) => (
            <div key={row.fund} style={rowLabel}>Fund {row.fund}</div>
          ))}
          <HeaderCell />
        </div>

        <div style={{ ...section, gridTemplateColumns: 'repeat(4, minmax(70px, 1fr))', flex: 1 }}>
          <HeaderCell style={{ gridColumn: '1 / -1' }}>Total Units</HeaderCell>
          {UNIT_HEADERS.map((label) => (
            <HeaderCell key={label}>{label}</HeaderCell>
          ))}
          {rows.map((row) =>
            UNIT_COLUMNS.map((col) => (
              <input
                key={`${row.fund}-${col}`}
                className="kaf-input"
                type="text"
                readOnly
                value={fmtAccessFundCell(col, row[col])}
                style={cellInput}
              />
            )),
          )}
          <HeaderCell style={{ gridColumn: '1 / -1' }} />
        </div>

        <div style={divider} />

        <div style={{ ...section, gridTemplateColumns: '96px' }}>
          <HeaderCell>Unit Price</HeaderCell>
          <HeaderCell />
          {rows.map((row) => (
            <input
              key={row.fund}
              className="kaf-input"
              type="text"
              readOnly
              value={fmtAccessFundCell('unitPrice', row.unitPrice)}
              style={cellInput}
            />
          ))}
          <HeaderCell>Total</HeaderCell>
        </div>

        <div style={divider} />

        <div style={{ ...section, gridTemplateColumns: 'repeat(4, minmax(70px, 1fr))', flex: 1 }}>
          <HeaderCell style={{ gridColumn: '1 / -1' }}>Total Funds</HeaderCell>
          {FUND_HEADERS.map((label) => (
            <HeaderCell key={label}>{label}</HeaderCell>
          ))}
          {rows.map((row) =>
            FUND_COLUMNS.map((col) => (
              <input
                key={`${row.fund}-${col}`}
                className="kaf-input"
                type="text"
                readOnly
                value={fmtAccessFundCell(col, row[col])}
                style={cellInput}
              />
            )),
          )}
          <input className="kaf-input" type="text" readOnly value={fmtAccessFundCell('eeFunds', totalEEFunds)} style={cellInput} />
          <input className="kaf-input" type="text" readOnly value={fmtAccessFundCell('veeFunds', totalVEEFunds)} style={cellInput} />
          <input className="kaf-input" type="text" readOnly value={fmtAccessFundCell('erFunds', totalERFunds)} style={cellInput} />
          <input className="kaf-input" type="text" readOnly value={fmtAccessFundCell('totalFunds', totalFunds)} style={cellInput} />
        </div>
      </div>
    </div>
  );
}
