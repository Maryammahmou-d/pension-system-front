import ExcelJS from 'exceljs';
import type { TerrorismRecordDto, ProsecutionRecordDto, AmlListDto, FlaggedRecordDto } from '../types';
import { amlApi } from './api';

type ListType = 'TERRORISM' | 'PROSECUTION';

/* ── Column definitions ──────────────────────────────────── */
interface ColDef<T> {
  header: string;
  key: keyof T & string;
  width: number;
  rtl?: boolean;
}

const TERRORISM_COLS: ColDef<TerrorismRecordDto>[] = [
  { header: 'الاسم', key: 'name', width: 38, rtl: true },
  { header: 'ترتيب الملفات', key: 'fileOrder', width: 14 },
  { header: 'رقم البطاقة', key: 'idNumber', width: 18 },
  { header: 'نوع الإثبات', key: 'idType', width: 14 },
  { header: 'الكود الموحد', key: 'unifiedCode', width: 16 },
  { header: 'مالك الكيان', key: 'entityOwner', width: 28, rtl: true },
  { header: 'العنوان', key: 'address', width: 36, rtl: true },
  { header: 'نوع النشاط', key: 'activityType', width: 22, rtl: true },
  { header: 'قرار الإدراج', key: 'terrorismListingDecision', width: 18 },
  { header: 'سنة القرار', key: 'decisionYear', width: 12 },
  { header: 'رقم القضية', key: 'caseNumber', width: 14 },
  { header: 'سنة القضية', key: 'caseYear', width: 12 },
  { header: 'كتاب المستشار', key: 'counselorLetter', width: 18 },
  { header: 'تاريخ الكتاب', key: 'letterDate', width: 16 },
  { header: 'تاريخ ورود القرار', key: 'decisionReceivedDate', width: 18 },
  { header: 'رفع التحفظ', key: 'seizureLifted', width: 14 },
];

const PROSECUTION_COLS: ColDef<ProsecutionRecordDto>[] = [
  { header: 'الاسم', key: 'name', width: 38, rtl: true },
  { header: 'ترتيب الملفات', key: 'fileOrder', width: 14 },
  { header: 'رقم البطاقة', key: 'idNumber', width: 18 },
  { header: 'نوع الإثبات', key: 'idType', width: 14 },
  { header: 'الكود الموحد', key: 'unifiedCode', width: 16 },
  { header: 'نوع الشخص', key: 'personType', width: 14 },
  { header: 'رقم أمر المنع', key: 'prohibitionOrderNumber', width: 18 },
  { header: 'سنة المنع', key: 'prohibitionYear', width: 12 },
  { header: 'رقم القضية', key: 'caseNumber', width: 14 },
  { header: 'سنة القضية', key: 'caseYear', width: 12 },
  { header: 'حالة المنع', key: 'prohibitionStatus', width: 14 },
  { header: 'رقم كتاب المستشار', key: 'counselorLetterNumber', width: 18 },
  { header: 'تاريخ الكتاب', key: 'counselorLetterDate', width: 16 },
  { header: 'تاريخ ورود الإيميل', key: 'emailReceivedDate', width: 18 },
  { header: 'ملحوظات', key: 'notes', width: 34, rtl: true },
];

/* ── Style constants (KAF purple) ─────────────────────────── */
const HEADER_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF6B027D' },
};
const HEADER_FONT = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11, name: 'Calibri' };
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD8C2E0' } },
  bottom: { style: 'thin', color: { argb: 'FFD8C2E0' } },
  left: { style: 'thin', color: { argb: 'FFD8C2E0' } },
  right: { style: 'thin', color: { argb: 'FFD8C2E0' } },
};
const ZEBRA_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFAF6FD' },
};

/* ── Save helper ─────────────────────────────────────────── */
function saveBlob(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── Fetch all records (loop pages) ──────────────────────── */
async function fetchAllRecords(
  listId: number,
): Promise<(TerrorismRecordDto | ProsecutionRecordDto)[]> {
  const pageSize = 500;
  const all: (TerrorismRecordDto | ProsecutionRecordDto)[] = [];
  let page = 0;
  while (true) {
    const res = await amlApi.getRecords(listId, page, pageSize);
    all.push(...res.records);
    if (page >= res.totalPages - 1 || res.records.length === 0) break;
    page++;
  }
  return all;
}

/* ── Build records worksheet ─────────────────────────────── */
function buildRecordsSheet<T extends TerrorismRecordDto | ProsecutionRecordDto>(
  ws: ExcelJS.Worksheet,
  cols: ColDef<T>[],
  records: T[],
) {
  ws.views = [{ rightToLeft: true, state: 'frozen', ySplit: 1 }];
  ws.columns = cols.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  // Style header row
  const header = ws.getRow(1);
  header.height = 34;
  header.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = THIN_BORDER;
  });

  // Data rows
  records.forEach((record, idx) => {
    const values: Record<string, unknown> = {};
    cols.forEach((c) => {
      const raw = (record as unknown as Record<string, unknown>)[c.key];
      values[c.key] = raw == null ? '' : String(raw);
    });
    const row = ws.addRow(values);
    row.height = 18;
    const isZebra = idx % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const col = cols[colNumber - 1];
      cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF1A0B24' } };
      cell.alignment = {
        horizontal: col?.rtl ? 'right' : 'left',
        vertical: 'middle',
        readingOrder: col?.rtl ? 'rtl' : 'ltr',
      };
      cell.border = THIN_BORDER;
      if (isZebra) cell.fill = ZEBRA_FILL;
    });
  });
}

/* ── Main: export list to styled xlsx ────────────────────── */
export async function exportListToExcel(
  list: AmlListDto,
  listType: ListType,
): Promise<void> {
  const records = await fetchAllRecords(list.id);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'KAF AML System';
  wb.created = new Date();

  const sheetName = listType === 'TERRORISM'
    ? 'قوائم الإرهابيين'
    : 'امر النائب العام';
  const ws = wb.addWorksheet(sheetName, {
    views: [{ rightToLeft: true }],
  });

  if (listType === 'TERRORISM') {
    buildRecordsSheet(ws, TERRORISM_COLS, records as TerrorismRecordDto[]);
  } else {
    buildRecordsSheet(ws, PROSECUTION_COLS, records as ProsecutionRecordDto[]);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const today = new Date().toISOString().slice(0, 10);
  const prefix = listType === 'TERRORISM' ? 'terrorism' : 'prosecution';
  saveBlob(buffer as ArrayBuffer, `${prefix}_list_v${list.version}_${today}.xlsx`);
}

/* ── Audit log export ────────────────────────────────────── */
export async function exportAuditLogsToExcel(
  logs: Array<{
    id: number;
    actionType: string;
    targetEntity?: string | null;
    details?: string | null;
    timestamp: string;
  }>,
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'KAF AML System';
  wb.created = new Date();

  const ws = wb.addWorksheet('Audit Log');
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Action', key: 'action', width: 20 },
    { header: 'Target', key: 'target', width: 24 },
    { header: 'Details', key: 'details', width: 70 },
    { header: 'Timestamp', key: 'timestamp', width: 22 },
  ];

  const header = ws.getRow(1);
  header.height = 30;
  header.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = THIN_BORDER;
  });

  logs.forEach((log, i) => {
    const row = ws.addRow({
      id: log.id,
      action: log.actionType,
      target: log.targetEntity ?? '',
      details: log.details ?? '',
      timestamp: new Date(log.timestamp).toLocaleString(),
    });
    const isZebra = i % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF1A0B24' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = THIN_BORDER;
      if (isZebra) cell.fill = ZEBRA_FILL;
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const today = new Date().toISOString().slice(0, 10);
  saveBlob(buffer as ArrayBuffer, `audit_log_${today}.xlsx`);
}

/* ── Flagged records export ──────────────────────────────── */
export async function exportFlaggedRecordsToExcel(
  flags: FlaggedRecordDto[],
  filters?: { sourceType?: string; matchClass?: string },
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'KAF AML System';
  wb.created = new Date();

  const ws = wb.addWorksheet('Flagged Records');
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'List Type', key: 'listType', width: 14 },
    { header: 'List Version', key: 'listVersion', width: 12 },
    { header: 'Screened Name', key: 'personName', width: 32 },
    { header: 'Screened ID', key: 'personIdNumber', width: 22 },
    { header: 'Matched Name', key: 'matchedName', width: 32 },
    { header: 'Matched Record ID', key: 'matchedRecordId', width: 16 },
    { header: 'Source', key: 'source', width: 22 },
    { header: 'Policy Number', key: 'policyNumber', width: 18 },
    { header: 'Match Class', key: 'matchClass', width: 12 },
    { header: 'Match Score', key: 'matchScore', width: 12 },
    { header: 'Match Type', key: 'matchType', width: 14 },
    { header: 'Checked By', key: 'createdByUsername', width: 18 },
    { header: 'Flagged At', key: 'createdAt', width: 22 },
  ];

  const header = ws.getRow(1);
  header.height = 30;
  header.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = THIN_BORDER;
  });

  const sourceLabel = (s?: string, policy?: string | null) => {
    if (s === 'POLICY_SCREENING') return policy ? `Policy Screening (${policy})` : 'Policy Screening';
    if (s === 'INDIVIDUAL_CHECK' || s === 'MANUAL_CHECK') return policy ? `Individual Check (${policy})` : 'Individual Check';
    return s ?? '';
  };

  flags.forEach((f, i) => {
    const row = ws.addRow({
      id: f.id,
      listType: f.listType,
      listVersion: f.listVersion ?? '',
      personName: f.personName ?? '',
      personIdNumber: f.personIdNumber ?? '',
      matchedName: f.matchedName ?? '',
      matchedRecordId: f.matchedRecordId,
      source: sourceLabel(f.sourceType, f.policyNumber),
      policyNumber: f.policyNumber ?? '',
      matchClass: f.matchClass ?? '',
      matchScore: f.matchScore ?? '',
      matchType: f.matchType ?? '',
      createdByUsername: f.createdByUsername ?? '',
      createdAt: new Date(f.createdAt).toLocaleString(),
    });
    const isZebra = i % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF1A0B24' } };
      const colKey = ws.getColumn(cell.col).key;
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        readingOrder: colKey === 'matchedName' ? 'rtl' : 'ltr',
      };
      cell.border = THIN_BORDER;
      if (isZebra) cell.fill = ZEBRA_FILL;
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const today = new Date().toISOString().slice(0, 10);
  const parts = ['flagged_records'];
  if (filters?.sourceType) parts.push(filters.sourceType.toLowerCase());
  if (filters?.matchClass) parts.push(`class-${filters.matchClass.toLowerCase()}`);
  parts.push(today);
  saveBlob(buffer as ArrayBuffer, `${parts.join('_')}.xlsx`);
}
