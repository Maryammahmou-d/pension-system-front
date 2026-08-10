import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { CalendarRange } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, reportsApi } from '../../lib/api';
import { mockExportContents, saveFileWithPicker, suggestedNameFromPath } from '../../lib/saveFile';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';

interface FundRow {
  fund: number;
  unitsEE: string;
  unitsVEE: string;
  unitsER: string;
  unitPrice: string;
  fundsEE: string;
  fundsVEE: string;
  fundsER: string;
}

function emptyRows(): FundRow[] {
  return Array.from({ length: 10 }, (_, i) => ({
    fund: i + 1,
    unitsEE: '',
    unitsVEE: '',
    unitsER: '',
    unitPrice: '',
    fundsEE: '',
    fundsVEE: '',
    fundsER: '',
  }));
}

function zeroRows(): FundRow[] {
  return Array.from({ length: 10 }, (_, i) => ({
    fund: i + 1,
    unitsEE: '0',
    unitsVEE: '0',
    unitsER: '0',
    unitPrice: '0',
    fundsEE: '0',
    fundsVEE: '0',
    fundsER: '0',
  }));
}

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const th: CSSProperties = {
  padding: '6px 8px',
  fontSize: 11,
  fontWeight: 700,
  textAlign: 'center',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid var(--kaf-border)',
  color: 'var(--kaf-muted)',
  background: 'var(--kaf-bg)',
};

const td: CSSProperties = {
  padding: '4px 6px',
  borderBottom: '1px solid var(--kaf-border)',
  verticalAlign: 'middle',
};

const cellInput: CSSProperties = {
  width: '100%',
  minWidth: 64,
  padding: '4px 6px',
  fontSize: 12,
  textAlign: 'right',
  fontFamily: "'JetBrains Mono', monospace",
};

export default function MovementSummaryBetweenDatesReport() {
  const today = dateHelpers.todayIso();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [rows, setRows] = useState<FundRow[]>(emptyRows);
  const [resultsFor, setResultsFor] = useState('');
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const busy = loading || extracting;

  const totals = useMemo(() => {
    let unitsEE = 0, unitsVEE = 0, unitsER = 0;
    let fundsEE = 0, fundsVEE = 0, fundsER = 0;
    for (const r of rows) {
      unitsEE += num(r.unitsEE);
      unitsVEE += num(r.unitsVEE);
      unitsER += num(r.unitsER);
      fundsEE += num(r.fundsEE);
      fundsVEE += num(r.fundsVEE);
      fundsER += num(r.fundsER);
    }
    return {
      unitsEE, unitsVEE, unitsER, unitsTotal: unitsEE + unitsVEE + unitsER,
      fundsEE, fundsVEE, fundsER, fundsTotal: fundsEE + fundsVEE + fundsER,
    };
  }, [rows]);

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
    setStatus('Calculating…');
    try {
      await new Promise((r) => setTimeout(r, 400));
      setRows(zeroRows());
      setResultsFor(
        `${dateHelpers.formatDisplay(startDate)} – ${dateHelpers.formatDisplay(endDate)}`,
      );
      setSuccess('Mock movement summary calculated.');
      setStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
      setStatus(null);
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

    setExtracting(true);
    try {
      const res = await reportsApi.extract('movement-summary-between-dates', 'data', {
        startDate, endDate, path: path || undefined,
      });
      const saved = await saveFileWithPicker({
        suggestedName: suggestedNameFromPath(path, 'detailed-movements.txt'),
        contents: mockExportContents('Detailed Movements Between Dates', { startDate, endDate }),
      });
      if (saved === 'cancelled') return;
      setSuccess(res.message.replace('data', 'detailed movements'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extract failed');
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
          subtitle="Show fund movement summary for a date range."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 1100 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
              {loading
                ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Calculating…</>
                : 'Show Balance'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--kaf-muted)', whiteSpace: 'nowrap' }}>
              Results are extracted for:
            </span>
            <input
              className="kaf-input"
              readOnly
              value={resultsFor}
              style={{ maxWidth: 280 }}
            />
            {status && (
              <span style={{ fontSize: 12, color: 'var(--kaf-muted)', fontStyle: 'italic' }}>{status}</span>
            )}
          </div>

          <ReportFeedback error={error} success={success} />

          <div style={{ overflowX: 'auto', border: '1px solid var(--kaf-border)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
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
                  <th style={th}>Total Units</th>
                  <th style={th}>Employee Fund</th>
                  <th style={th}>VEE Fund</th>
                  <th style={th}>Employer Fund</th>
                  <th style={th}>Total Funds</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const unitsTotal = num(r.unitsEE) + num(r.unitsVEE) + num(r.unitsER);
                  const fundsTotal = num(r.fundsEE) + num(r.fundsVEE) + num(r.fundsER);
                  return (
                    <tr key={r.fund}>
                      <td style={{ ...td, fontSize: 12.5, fontWeight: 600, color: 'var(--kaf-text)', whiteSpace: 'nowrap' }}>
                        Fund {r.fund}
                      </td>
                      <td style={td}><input className="kaf-input" style={cellInput} value={r.unitsEE} readOnly /></td>
                      <td style={td}><input className="kaf-input" style={cellInput} value={r.unitsVEE} readOnly /></td>
                      <td style={td}><input className="kaf-input" style={cellInput} value={r.unitsER} readOnly /></td>
                      <td style={td}>
                        <input className="kaf-input" style={cellInput} value={String(unitsTotal)} readOnly />
                      </td>
                      <td style={td}><input className="kaf-input" style={cellInput} value={r.unitPrice} readOnly /></td>
                      <td style={td}><input className="kaf-input" style={cellInput} value={r.fundsEE} readOnly /></td>
                      <td style={td}><input className="kaf-input" style={cellInput} value={r.fundsVEE} readOnly /></td>
                      <td style={td}><input className="kaf-input" style={cellInput} value={r.fundsER} readOnly /></td>
                      <td style={td}>
                        <input className="kaf-input" style={cellInput} value={String(fundsTotal)} readOnly />
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td style={{ ...td, fontWeight: 700, fontSize: 12.5 }}>Total</td>
                  <td style={td}><input className="kaf-input" style={cellInput} value={String(totals.unitsEE)} readOnly /></td>
                  <td style={td}><input className="kaf-input" style={cellInput} value={String(totals.unitsVEE)} readOnly /></td>
                  <td style={td}><input className="kaf-input" style={cellInput} value={String(totals.unitsER)} readOnly /></td>
                  <td style={td}><input className="kaf-input" style={cellInput} value={String(totals.unitsTotal)} readOnly /></td>
                  <td style={td} />
                  <td style={td}><input className="kaf-input" style={cellInput} value={String(totals.fundsEE)} readOnly /></td>
                  <td style={td}><input className="kaf-input" style={cellInput} value={String(totals.fundsVEE)} readOnly /></td>
                  <td style={td}><input className="kaf-input" style={cellInput} value={String(totals.fundsER)} readOnly /></td>
                  <td style={td}><input className="kaf-input" style={cellInput} value={String(totals.fundsTotal)} readOnly /></td>
                </tr>
              </tbody>
            </table>
          </div>

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
            style={{ width: '100%' }}
          >
            {extracting
              ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Extracting…</>
              : 'Extract Detailed Movements'}
          </button>
        </div>
      </div>
    </div>
  );
}

