import { useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { CalendarRange, Download } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, reportsApi } from '../../lib/api';
import { extractApiError } from '../../lib/httpClient';
import {
  discardUnusedSaveLocation,
  requestSaveLocation,
  suggestedNameFromPath,
  writeSaveLocation,
} from '../../lib/saveFile';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';

interface FundRow {
  fund: number;
  unitsEE: number;
  unitsVEE: number;
  unitsER: number;
  unitsTotal: number;
  unitPrice: number;
  fundsEE: number;
  fundsVEE: number;
  fundsER: number;
  fundsTotal: number;
}

function emptyRows(): FundRow[] {
  return Array.from({ length: 10 }, (_, i) => ({
    fund: i + 1,
    unitsEE: 0,
    unitsVEE: 0,
    unitsER: 0,
    unitsTotal: 0,
    unitPrice: 0,
    fundsEE: 0,
    fundsVEE: 0,
    fundsER: 0,
    fundsTotal: 0,
  }));
}

function emptyTotals(): FundRow {
  return {
    fund: 0,
    unitsEE: 0,
    unitsVEE: 0,
    unitsER: 0,
    unitsTotal: 0,
    unitPrice: 0,
    fundsEE: 0,
    fundsVEE: 0,
    fundsER: 0,
    fundsTotal: 0,
  };
}

const th: CSSProperties = {
  padding: '6px 6px',
  fontSize: 11,
  fontWeight: 700,
  textAlign: 'center',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid var(--kaf-border)',
  color: 'var(--kaf-muted)',
  background: 'var(--kaf-bg)',
};

const td: CSSProperties = {
  padding: '5px 6px',
  fontSize: 12,
  textAlign: 'right',
  fontFamily: "'JetBrains Mono', monospace",
  borderBottom: '1px solid var(--kaf-border)',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};

function fmtStandardUnits(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function fmtStandardFunds(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function fmtStandardPrice(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BalanceTable({
  titleDate,
  rows,
  totals,
}: {
  titleDate: string;
  rows: FundRow[];
  totals: FundRow;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--kaf-muted)', whiteSpace: 'nowrap' }}>
          Results are extracted for:
        </span>
        <input
          className="kaf-input"
          readOnly
          value={titleDate}
          style={{ maxWidth: 220, fontWeight: 600 }}
        />
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--kaf-border)', borderRadius: 8, width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 980 }}>
          <colgroup>
            <col style={{ width: '80px' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left' }} rowSpan={2}>Fund</th>
              <th style={th} colSpan={4}>Total Units</th>
              <th style={th} rowSpan={2}>Unit Price</th>
              <th style={th} colSpan={4}>Total Funds</th>
            </tr>
            <tr>
              <th style={th}>Employee Fund</th>
              <th style={th}>VEE Fund</th>
              <th style={th}>Employer Fund</th>
              <th style={{ ...th, fontWeight: 800 }}>Total Units</th>
              <th style={th}>Employee Fund</th>
              <th style={th}>VEE Fund</th>
              <th style={th}>Employer Fund</th>
              <th style={{ ...th, fontWeight: 800 }}>Total Funds</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.fund}
                style={{
                  background: r.fund % 2 === 0 ? 'var(--kaf-bg-subtle, rgba(0,0,0,0.015))' : 'transparent',
                }}
              >
                <td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>Fund {r.fund}</td>
                <td style={td}>{fmtStandardUnits(r.unitsEE)}</td>
                <td style={td}>{fmtStandardUnits(r.unitsVEE)}</td>
                <td style={td}>{fmtStandardUnits(r.unitsER)}</td>
                <td style={{ ...td, fontWeight: 700 }}>{fmtStandardUnits(r.unitsTotal)}</td>
                <td style={{ ...td, color: 'var(--kaf-primary, #1e40af)' }}>{fmtStandardPrice(r.unitPrice)}</td>
                <td style={td}>{fmtStandardFunds(r.fundsEE)}</td>
                <td style={td}>{fmtStandardFunds(r.fundsVEE)}</td>
                <td style={td}>{fmtStandardFunds(r.fundsER)}</td>
                <td style={{ ...td, fontWeight: 700 }}>{fmtStandardFunds(r.fundsTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--kaf-bg)', borderTop: '2px solid var(--kaf-border)', fontWeight: 800 }}>
              <td style={{ ...td, textAlign: 'left', fontWeight: 800 }}>Total</td>
              <td style={td}>{fmtStandardUnits(totals.unitsEE)}</td>
              <td style={td}>{fmtStandardUnits(totals.unitsVEE)}</td>
              <td style={td}>{fmtStandardUnits(totals.unitsER)}</td>
              <td style={td}>{fmtStandardUnits(totals.unitsTotal)}</td>
              <td style={td}>—</td>
              <td style={td}>{fmtStandardFunds(totals.fundsEE)}</td>
              <td style={td}>{fmtStandardFunds(totals.fundsVEE)}</td>
              <td style={td}>{fmtStandardFunds(totals.fundsER)}</td>
              <td style={td}>{fmtStandardFunds(totals.fundsTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function MovementSummaryBetweenDatesReport() {
  const today = dateHelpers.todayIso();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [startRows, setStartRows] = useState<FundRow[]>(emptyRows);
  const [startTotals, setStartTotals] = useState<FundRow>(emptyTotals);
  const [startResultsFor, setStartResultsFor] = useState('');

  const [endRows, setEndRows] = useState<FundRow[]>(emptyRows);
  const [endTotals, setEndTotals] = useState<FundRow>(emptyTotals);
  const [endResultsFor, setEndResultsFor] = useState('');

  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const busy = loading || extracting;

  const showBalance = async () => {
    setError(null);
    setSuccess(null);
    if (!startDate || !endDate) {
      setError('Start Date and End Date are required.');
      return;
    }
    if (startDate > endDate) {
      setError('Start Date must be on or before End Date.');
      return;
    }

    setLoading(true);
    try {
      const data = await reportsApi.getMovementBetweenDatesBalance(startDate, endDate);

      const mapRows = (rows: typeof data.startDateBalance.rows): FundRow[] =>
        rows.map((r) => ({
          fund: r.fund,
          unitsEE: r.unitsEe,
          unitsVEE: r.unitsVee,
          unitsER: r.unitsEr,
          unitsTotal: r.unitsTotal,
          unitPrice: r.unitPrice,
          fundsEE: r.fundsEe,
          fundsVEE: r.fundsVee,
          fundsER: r.fundsEr,
          fundsTotal: r.fundsTotal,
        }));

      const mapTotals = (t: typeof data.startDateBalance.totals): FundRow => ({
        fund: 0,
        unitsEE: t.unitsEe,
        unitsVEE: t.unitsVee,
        unitsER: t.unitsEr,
        unitsTotal: t.unitsTotal,
        unitPrice: 0,
        fundsEE: t.fundsEe,
        fundsVEE: t.fundsVee,
        fundsER: t.fundsEr,
        fundsTotal: t.fundsTotal,
      });

      setStartRows(mapRows(data.startDateBalance.rows));
      setStartTotals(mapTotals(data.startDateBalance.totals));
      setStartResultsFor(dateHelpers.formatDisplay(data.startDateBalance.date));

      setEndRows(mapRows(data.endDateBalance.rows));
      setEndTotals(mapTotals(data.endDateBalance.totals));
      setEndResultsFor(dateHelpers.formatDisplay(data.endDateBalance.date));

      setSuccess('Balance summaries calculated successfully for both dates.');
    } catch (err) {
      setError(extractApiError(err, 'Calculation failed'));
    } finally {
      setLoading(false);
    }
  };

  const extractDetailed = async () => {
    setError(null);
    setSuccess(null);
    if (!startDate || !endDate) {
      setError('Start Date and End Date are required.');
      return;
    }
    if (startDate > endDate) {
      setError('Start Date must be on or before End Date.');
      return;
    }

    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const fallbackName = `Movements_${sy}${sm}${sd}_${ey}${em}${ed}.xlsx`;

    const locationPromise = requestSaveLocation({
      suggestedName: suggestedNameFromPath(path, fallbackName),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const location = await locationPromise;
    if (location.mode === 'cancelled') return;

    setExtracting(true);
    try {
      const { blob } = await reportsApi.downloadMovementBetweenDatesExcel(startDate, endDate);
      await writeSaveLocation(location, blob);
      setSuccess(`Saved ${location.fileName}`);
    } catch (err) {
      await discardUnusedSaveLocation(location);
      setError(extractApiError(err, 'Extract failed'));
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={CalendarRange}
          title="Extract Movements Between Dates"
          subtitle="Show fund balance summaries for start and end dates and extract detailed movements."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 1100 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Top Date Selection Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 160px 1fr', gap: 14, alignItems: 'end' }}>
            <Field label="Start Date" required>
              <input
                className="kaf-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={busy}
              />
            </Field>
            <Field label="End Date" required>
              <input
                className="kaf-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={busy}
              />
            </Field>
            <button
              type="button"
              className="kaf-btn"
              disabled={busy}
              onClick={() => void showBalance()}
              style={{ height: 38 }}
            >
              {loading ? (
                <>
                  <span className="kaf-spinner" style={{ display: 'inline-block' }} /> Calculating…
                </>
              ) : (
                'Show Balance'
              )}
            </button>
          </div>

          <ReportFeedback error={error} success={success} />

          {/* Table 1: Start Date Balance */}
          <BalanceTable
            titleDate={startResultsFor || (startDate ? dateHelpers.formatDisplay(startDate) : '')}
            rows={startRows}
            totals={startTotals}
          />

          {/* Table 2: End Date Balance */}
          <BalanceTable
            titleDate={endResultsFor || (endDate ? dateHelpers.formatDisplay(endDate) : '')}
            rows={endRows}
            totals={endTotals}
          />

          {/* Bottom Extract Detailed Movements Area */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'end', marginTop: 8 }}>
            <Field label="Path">
              <input
                className="kaf-input"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="Optional — choose location in the save dialog"
                disabled={busy}
              />
            </Field>
            <button
              type="button"
              className="kaf-btn"
              disabled={busy}
              onClick={() => void extractDetailed()}
              style={{
                height: 38,
                minWidth: 240,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {extracting ? (
                <>
                  <span className="kaf-spinner" style={{ display: 'inline-block' }} /> Extracting…
                </>
              ) : (
                <>
                  <Download size={16} /> Extract Detailed Movements
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
