import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import PageHeader from '../../components/PageHeader';
import { topUpsApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { companiesApi } from '../../lib/companiesApi';
import { extractApiError } from '../../lib/httpClient';
import { requestSaveLocation, suggestedNameFromPath, writeSaveLocation } from '../../lib/saveFile';
import { buildBulkTopUpWorkbook } from '../../lib/topUpPdf';
import type { BulkTopUpResult, BulkTopUpRow, Company } from '../../types';

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'object' && 'text' in value && typeof value.text === 'string') {
    return value.text.trim();
  }
  if (typeof value === 'object' && 'result' in value) {
    return cellText(value.result as ExcelJS.CellValue);
  }
  return String(value).trim();
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_');
}

function excelSerialToIso(n: number): string {
  // Excel serial date → JS date (UTC-ish); Access exports often use real dates or serials
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const ms = epoch.getTime() + n * 86400000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateCell(raw: string): string {
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const asNum = Number(raw);
  if (!Number.isNaN(asNum) && asNum > 20000 && asNum < 80000) {
    return excelSerialToIso(asNum);
  }
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return raw;
}

function employeeNumberText(value: ExcelJS.CellValue): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  const text = cellText(value);
  if (/^\d+\.0+$/.test(text)) return text.slice(0, text.indexOf('.'));
  return text;
}

async function parseTopUpWorkbook(file: File): Promise<BulkTopUpRow[]> {
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error('Workbook has no sheets.');

  const headerMap = new Map<string, number>();
  const headerRow = sheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    headerMap.set(normalizeHeader(cellText(cell.value)), col);
  });

  const colEmployee =
    headerMap.get('employee_number')
    ?? headerMap.get('employeenumber')
    ?? headerMap.get('employee');
  const colDate =
    headerMap.get('unit_price_date')
    ?? headerMap.get('unitpricedate')
    ?? headerMap.get('top_up_date')
    ?? headerMap.get('date');
  const colEE = headerMap.get('ee');
  const colER = headerMap.get('er');
  const colVEE = headerMap.get('vee');

  if (colEmployee == null || colDate == null) {
    throw new Error(
      'Excel must include columns: Employee_Number, EE, ER, VEE, Unit_Price_Date',
    );
  }

  const rows: BulkTopUpRow[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const employeeNumber = employeeNumberText(row.getCell(colEmployee).value);
    if (!employeeNumber) return;
    const ee = colEE != null ? Number(cellText(row.getCell(colEE).value) || 0) : 0;
    const er = colER != null ? Number(cellText(row.getCell(colER).value) || 0) : 0;
    const vee = colVEE != null ? Number(cellText(row.getCell(colVEE).value) || 0) : 0;
    const unitPriceDate = parseDateCell(cellText(row.getCell(colDate).value));
    rows.push({
      employeeNumber,
      ee: Number.isFinite(ee) ? ee : 0,
      er: Number.isFinite(er) ? er : 0,
      vee: Number.isFinite(vee) ? vee : 0,
      unitPriceDate,
    });
  });

  if (rows.length === 0) throw new Error('No data rows found in the Excel file.');
  return rows;
}

async function buildBulkTopUpTemplate(): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('TopUp');
  sheet.columns = [
    { header: 'Employee_Number', key: 'employeeNumber', width: 20 },
    { header: 'EE', key: 'ee', width: 14 },
    { header: 'ER', key: 'er', width: 14 },
    { header: 'VEE', key: 'vee', width: 14 },
    { header: 'Unit_Price_Date', key: 'unitPriceDate', width: 18 },
  ];
  const header = sheet.getRow(1);
  header.font = { bold: true };
  sheet.getColumn(2).numFmt = '#,##0.00';
  sheet.getColumn(3).numFmt = '#,##0.00';
  sheet.getColumn(4).numFmt = '#,##0.00';
  sheet.getColumn(5).numFmt = 'yyyy-mm-dd';
  const sample = sheet.addRow({
    employeeNumber: 'SAMPLE001',
    ee: 1000,
    er: 500,
    vee: 0,
    unitPriceDate: new Date(Date.UTC(2026, 7, 18)),
  });
  sample.font = { italic: true, color: { argb: 'FF666666' } };
  sample.getCell(1).note = 'Example only. Delete this row and enter a real Employee_Number (the value shown in Add Top Up, not 1 or SAMPLE001).';
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export default function BulkTopUp() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companyNumber, setCompanyNumber] = useState('');
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkTopUpResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCompaniesLoading(true);
    companiesApi
      .getLatest()
      .then((list) => {
        if (!cancelled) setCompanies(list);
      })
      .catch((err) => {
        if (!cancelled) setError(extractApiError(err, 'Failed to load companies.'));
      })
      .finally(() => {
        if (!cancelled) setCompaniesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUploadClick = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!companyNumber) {
      setError('All fields are required.');
      return;
    }
    fileRef.current?.click();
  };

  const onFileSelected = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setResult(null);
    const location = await requestSaveLocation({
      suggestedName: suggestedNameFromPath(path, `TopUp_${companyNumber}.xlsx`),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    if (location.mode === 'cancelled') {
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setLoading(true);
    try {
      const parsed = await parseTopUpWorkbook(file);
      const res = await topUpsApi.bulk({
        companyNumber,
        rows: parsed,
        path: path || undefined,
        userName: user?.username,
      });
      const rows = res.rows.length > 0
        ? res.rows
        : parsed.map((row) => ({
            employeeNumber: row.employeeNumber,
            ok: false,
            message: 'Employee not found. Use the Employee_Number from Add Top Up.',
            total: row.ee + row.er + row.vee,
          }));
      const posted = res.posted ?? res.rows.map((row) => row.report).filter((row): row is NonNullable<typeof row> => Boolean(row));
      if (posted.length > 0) {
        const workbook = await buildBulkTopUpWorkbook(companyNumber, posted);
        await writeSaveLocation(location, workbook);
      }
      setResult({
        ...res,
        processed: rows.length,
        succeeded: posted.length,
        failed: rows.length - posted.length,
        rows,
        posted,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk top-up failed');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const downloadTemplate = async () => {
    setError(null);
    try {
      const location = await requestSaveLocation({
        suggestedName: suggestedNameFromPath(path, 'TopUp_Employees_Template.xlsx'),
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      if (location.mode === 'cancelled') return;
      await writeSaveLocation(location, await buildBulkTopUpTemplate());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download template.');
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={Upload}
          title="Top Up Employees in Bulk"
          subtitle="Upload an Excel list to top up multiple employees for a company."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 560 }}>
        <form onSubmit={handleUploadClick}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Company Number" required>
              <select
                className="kaf-input kaf-select"
                value={companyNumber}
                onChange={(e) => setCompanyNumber(e.target.value)}
                disabled={loading || companiesLoading}
              >
                <option value="">{companiesLoading ? 'Loading companies…' : 'Select company…'}</option>
                {companies.map((c) => (
                  <option key={c.companyNumber} value={c.companyNumber}>
                    {c.companyNumber} — {c.companyName}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Path">
              <input
                className="kaf-input"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="Optional — choose location in the save dialog"
                disabled={loading}
              />
            </Field>

            <p style={{ margin: 0, fontSize: 12, color: 'var(--kaf-muted)', lineHeight: 1.5 }}>
              Excel columns: <code>Employee_Number</code>, <code>EE</code>, <code>ER</code>,{' '}
              <code>VEE</code>, <code>Unit_Price_Date</code>
            </p>

            {error && (
              <div className="kaf-callout error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => void onFileSelected(e.target.files?.[0] ?? null)}
            />

            <button type="button" className="kaf-btn-ghost" onClick={() => void downloadTemplate()} disabled={loading} style={{ width: '100%' }}>
              <Download size={14} /> Download Excel Template
            </button>

            <button type="submit" className="kaf-btn" disabled={loading} style={{ width: '100%' }}>
              {loading
                ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Processing…</>
                : <><Upload size={14} /> Upload List of Employees to Top Up</>}
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ marginTop: 16, maxWidth: 720 }}
          >
            <div
              className={`kaf-callout ${result.succeeded > 0 && result.failed === 0 ? 'ok' : 'error'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}
            >
              <CheckCircle2 size={16} />
              {result.succeeded > 0
                ? `Processed ${result.processed}: ${result.succeeded} succeeded, ${result.failed} failed. Top-Up Transactions Completed Successfully. Data exported to Excel.`
                : `No top-ups were posted. ${result.rows[0]?.message ?? 'Check Employee_Number and amounts.'}`}
            </div>
            <div className="kaf-card" style={{ overflow: 'hidden' }}>
              <table className="kaf-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Status</th>
                    <th>Message</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r) => (
                    <tr key={`${r.employeeNumber}-${r.message}`}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.employeeNumber}</td>
                      <td>{r.ok ? 'OK' : 'Failed'}</td>
                      <td>{r.message}</td>
                      <td>{r.total != null ? r.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
