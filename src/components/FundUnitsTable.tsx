import type { CSSProperties } from 'react';
import type { FundUnitRow } from '../types';
import { fmtAccessUnits } from '../lib/formatNumber';

const FUND_COLUMNS = ['eeUnits', 'veeUnits', 'erUnits'] as const;
const FUND_HEADERS = ['EE Fund', 'VEE Fund', 'ER Fund'] as const;

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

export default function FundUnitsTable({
  rows,
  totalEEUnits,
  totalVEEUnits,
  totalERUnits,
  totalUnits,
}: {
  rows: FundUnitRow[];
  totalEEUnits: number;
  totalVEEUnits: number;
  totalERUnits: number;
  totalUnits: number;
}) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, minWidth: 540 }}>
        <div style={{ ...section, gridTemplateColumns: '72px' }}>
          <HeaderCell style={rowLabel}>Fund</HeaderCell>
          {rows.map((row) => (
            <div key={row.fund} style={rowLabel}>Fund {row.fund}</div>
          ))}
          <HeaderCell style={rowLabel}>Total</HeaderCell>
        </div>

        <div style={{ ...section, gridTemplateColumns: 'repeat(3, minmax(70px, 1fr))', flex: 1 }}>
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
                value={fmtAccessUnits(row[col])}
                style={cellInput}
              />
            )),
          )}
          <input className="kaf-input" type="text" readOnly value={fmtAccessUnits(totalEEUnits)} style={cellInput} />
          <input className="kaf-input" type="text" readOnly value={fmtAccessUnits(totalVEEUnits)} style={cellInput} />
          <input className="kaf-input" type="text" readOnly value={fmtAccessUnits(totalERUnits)} style={cellInput} />
        </div>

        <div style={divider} />

        <div style={{ ...section, gridTemplateColumns: 'minmax(70px, 1fr)', flex: '0 0 140px' }}>
          <HeaderCell>Total Units</HeaderCell>
          {rows.map((row) => (
            <input
              key={row.fund}
              className="kaf-input"
              type="text"
              readOnly
              value={fmtAccessUnits(row.totalUnits)}
              style={cellInput}
            />
          ))}
          <input className="kaf-input" type="text" readOnly value={fmtAccessUnits(totalUnits)} style={cellInput} />
        </div>
      </div>
    </div>
  );
}
