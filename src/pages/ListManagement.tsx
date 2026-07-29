import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, AlertCircle, Search, Plus, Pencil, X,
  ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Shield,
  FilePlus, GitMerge, Trash2, Save, Download, Filter, Flag,
} from 'lucide-react';
import { amlApi } from '../lib/api';
import { exportListToExcel } from '../lib/excelExport';
import PageHeader from '../components/PageHeader';
import UserGuide from '../components/UserGuide';
import { listManagementGuide } from '../components/guides/guideContent';
import type {
  AmlListDto, TerrorismRecordDto, ProsecutionRecordDto, FlaggedRecordDto,
  UploadAnalysisResult,
} from '../types';

type AnyRecord = TerrorismRecordDto | ProsecutionRecordDto;
type ActiveTab = 'TERRORISM' | 'PROSECUTION';

const PAGE_SIZE = 50;

/* ── Upload Modal ────────────────────────────────────────────── */
function UploadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  type Stage = 'select' | 'analyzing' | 'preview' | 'committing';
  const [stage, setStage] = useState<Stage>('select');
  const [mode, setMode] = useState<'REPLACE' | 'MERGE'>('REPLACE');
  const [keepFlags, setKeepFlags] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<UploadAnalysisResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.xlsx') && !f.name.toLowerCase().endsWith('.xls')) {
      setError('Only .xlsx / .xls files are accepted.'); return;
    }
    setError(''); setFile(f);
  };

  const analyze = async () => {
    if (!file) { setError('Select a file first.'); return; }
    setStage('analyzing'); setError('');
    try {
      const result = await amlApi.analyzeUpload(file);
      setAnalysis(result);
      setStage('preview');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Analysis failed.');
      setStage('select');
    }
  };

  const commit = async () => {
    if (!analysis) return;
    setStage('committing'); setError('');
    try {
      await amlApi.commitUpload({
        uploadToken: analysis.uploadToken,
        mode,
        keepFlaggedHistory: mode === 'REPLACE' ? keepFlags : false,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Upload failed.');
      setStage('preview');
    }
  };

  const hasAnyIdentical = analysis?.sheets.some((s) => s.identicalCount > 0) ?? false;
  const hasAnyFlaggedIdentical = analysis?.sheets.some((s) => s.flaggedIdenticalCount > 0) ?? false;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 8 }}
        transition={{ duration: 0.22 }}
        style={{
          background: 'var(--kaf-surface-2)',
          border: '1px solid var(--kaf-border-2)',
          borderRadius: 16,
          padding: '28px 32px',
          width: stage === 'preview' ? 640 : 500,
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--kaf-purple-bg)', border: '1px solid var(--kaf-purple-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UploadCloud size={14} color="var(--kaf-purple-light)" />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--kaf-dark)' }}>
              {stage === 'preview' ? 'Review Upload' : 'Upload AML List'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kaf-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* ───────── STAGE: select file + mode ───────── */}
        {(stage === 'select' || stage === 'analyzing') && (
          <>
            <p className="kaf-label" style={{ marginBottom: 8 }}>Upload Mode</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {(['REPLACE', 'MERGE'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  disabled={stage === 'analyzing'}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${mode === m ? 'var(--kaf-purple)' : 'var(--kaf-border-2)'}`,
                    background: mode === m ? 'var(--kaf-purple-bg)' : 'var(--kaf-surface-1)',
                    cursor: stage === 'analyzing' ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all .15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {m === 'REPLACE'
                      ? <Trash2 size={13} color={mode === m ? 'var(--kaf-purple-light)' : 'var(--kaf-muted)'} />
                      : <GitMerge size={13} color={mode === m ? 'var(--kaf-purple-light)' : 'var(--kaf-muted)'} />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: mode === m ? 'var(--kaf-purple-light)' : 'var(--kaf-text)' }}>
                      {m === 'REPLACE' ? 'Replace' : 'Merge'}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--kaf-muted)', lineHeight: 1.45 }}>
                    {m === 'REPLACE'
                      ? 'Archive current list and create a new version from the file.'
                      : 'Append only the new rows to the current list. Duplicates skipped.'}
                  </p>
                </button>
              ))}
            </div>

            <div
              className={`kaf-drop-zone ${dragOver ? 'drag-over' : ''}`}
              style={{ padding: '28px 20px', textAlign: 'center', marginBottom: 16, opacity: stage === 'analyzing' ? 0.6 : 1 }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); if (stage !== 'analyzing') { const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); } }}
              onClick={() => stage !== 'analyzing' && fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ''; }} />
              <FilePlus size={28} color={file ? 'var(--kaf-purple)' : 'var(--kaf-muted)'} style={{ margin: '0 auto 8px', display: 'block' }} />
              {file ? (
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--kaf-purple-light)' }}>{file.name}</p>
              ) : (
                <>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--kaf-text)', marginBottom: 3 }}>
                    Drop file or <span style={{ color: 'var(--kaf-purple-light)', textDecoration: 'underline' }}>browse</span>
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--kaf-muted)' }}>.xlsx · .xls</p>
                </>
              )}
            </div>

            {error && (
              <div className="kaf-callout error" style={{ marginBottom: 14, fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                <AlertCircle size={13} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} className="kaf-btn-ghost" style={{ fontSize: 13, padding: '8px 18px' }}>Cancel</button>
              <button onClick={analyze} className="kaf-btn" disabled={stage === 'analyzing' || !file} style={{ padding: '8px 22px' }}>
                {stage === 'analyzing'
                  ? <><span className="kaf-spinner" style={{ width: 13, height: 13 }} /> Analyzing…</>
                  : <><Shield size={14} /> Analyze</>}
              </button>
            </div>
          </>
        )}

        {/* ───────── STAGE: preview ───────── */}
        {stage !== 'select' && stage !== 'analyzing' && analysis && (
          <>
            <div style={{
              padding: '10px 12px', marginBottom: 14,
              background: 'var(--kaf-surface-1)', border: '1px solid var(--kaf-border-2)',
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <FilePlus size={14} color="var(--kaf-purple-light)" />
              <span style={{ fontSize: 12, color: 'var(--kaf-text)', fontWeight: 600 }}>{analysis.fileName}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--kaf-muted)' }}>
                {analysis.sheets.length} sheet{analysis.sheets.length === 1 ? '' : 's'} detected
              </span>
            </div>

            {analysis.sheets.map((s) => (
              <div key={s.listType} style={{
                padding: 14, marginBottom: 12,
                background: 'var(--kaf-surface-1)', border: '1px solid var(--kaf-border-2)',
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Shield size={14} color="var(--kaf-purple-light)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--kaf-text)' }}>
                    {s.listType === 'TERRORISM' ? 'Terrorism' : 'Prosecution'}
                  </span>
                  {s.currentActiveVersion != null && (
                    <span className="kaf-badge" style={{ fontSize: 10 }}>
                      current: v{s.currentActiveVersion}
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  <StatBox label="New rows" value={s.newRecordCount} />
                  <StatBox label="Identical" value={s.identicalCount} tone={s.identicalCount > 0 ? 'info' : 'default'} />
                  <StatBox label="Flagged identical" value={s.flaggedIdenticalCount} tone={s.flaggedIdenticalCount > 0 ? 'warn' : 'default'} />
                  <StatBox
                    label={mode === 'MERGE' ? 'Will append' : 'Genuinely new'}
                    value={s.newUniqueCount}
                    tone={s.newUniqueCount > 0 ? 'ok' : 'default'}
                  />
                </div>
              </div>
            ))}

            {/* Contextual explanation + choice */}
            {mode === 'MERGE' ? (
              <div className="kaf-callout" style={{ marginBottom: 14, fontSize: 12, display: 'flex', gap: 8 }}>
                <GitMerge size={14} color="var(--kaf-purple-light)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong style={{ color: 'var(--kaf-text)' }}>Merge mode</strong>
                  <p style={{ color: 'var(--kaf-muted)', marginTop: 3 }}>
                    Only new unique rows will be appended to the current active list.
                    {hasAnyIdentical
                      ? ` ${analysis.sheets.reduce((a, s) => a + s.identicalCount, 0)} identical record(s) will be skipped.`
                      : ' No duplicates detected.'}
                    {' '}No new list version will be created.
                  </p>
                </div>
              </div>
            ) : (
              <div className="kaf-callout" style={{ marginBottom: 14, fontSize: 12, display: 'flex', gap: 8 }}>
                <Trash2 size={14} color="var(--kaf-purple-light)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong style={{ color: 'var(--kaf-text)' }}>Replace mode</strong>
                  <p style={{ color: 'var(--kaf-muted)', marginTop: 3 }}>
                    The current active list will be archived and a new version created from this file.
                  </p>
                </div>
              </div>
            )}

            {/* Keep-flagged choice (REPLACE only, and only if there's something to preserve) */}
            {mode === 'REPLACE' && hasAnyFlaggedIdentical && (
              <div style={{
                padding: 12, marginBottom: 14,
                background: 'var(--kaf-purple-bg)', border: '1px solid var(--kaf-purple-border)',
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'start', marginBottom: 8 }}>
                  <Flag size={14} color="var(--kaf-purple-light)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--kaf-text)', marginBottom: 3 }}>
                      Keep flagged history on identical records?
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--kaf-muted)', lineHeight: 1.5 }}>
                      {analysis.sheets.reduce((a, s) => a + s.flaggedIdenticalCount, 0)} record(s) are identical to the
                      current list and carry flag history. Choose <strong>Yes</strong> to migrate their flags onto the new
                      version so they remain flagged. <strong>No</strong> leaves flags only on the archived list.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['Yes', 'No'] as const).map((label) => {
                    const active = (label === 'Yes') === keepFlags;
                    return (
                      <button
                        key={label}
                        onClick={() => setKeepFlags(label === 'Yes')}
                        className={active ? 'kaf-btn' : 'kaf-btn-ghost'}
                        style={{ padding: '8px 14px', fontSize: 12, justifyContent: 'center' }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className="kaf-callout error" style={{ marginBottom: 14, fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                <AlertCircle size={13} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setStage('select'); setAnalysis(null); }}
                className="kaf-btn-ghost"
                style={{ fontSize: 13, padding: '8px 18px' }}
                disabled={stage === 'committing'}
              >
                Back
              </button>
              <button onClick={commit} className="kaf-btn" disabled={stage === 'committing'} style={{ padding: '8px 22px' }}>
                {stage === 'committing'
                  ? <><span className="kaf-spinner" style={{ width: 13, height: 13 }} /> Applying…</>
                  : <><UploadCloud size={14} /> Confirm & Apply</>}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function StatBox({ label, value, tone = 'default' }: {
  label: string; value: number;
  tone?: 'default' | 'ok' | 'info' | 'warn';
}) {
  const color =
    tone === 'ok' ? 'var(--kaf-ok)' :
      tone === 'info' ? 'var(--kaf-purple-light)' :
        tone === 'warn' ? 'var(--kaf-warn, #f59e0b)' :
          'var(--kaf-text)';
  return (
    <div style={{
      padding: '8px 10px',
      background: 'var(--kaf-surface-2)',
      border: '1px solid var(--kaf-border-2)',
      borderRadius: 8,
    }}>
      <p style={{ fontSize: 10, color: 'var(--kaf-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</p>
      <p style={{ fontSize: 17, fontWeight: 700, color }}>{value.toLocaleString()}</p>
    </div>
  );
}

/* ── Record Edit / Add Modal ─────────────────────────────────── */
function RecordModal({
  listType,
  record,
  listId,
  onClose,
  onSaved,
}: {
  listType: ActiveTab;
  record: AnyRecord | null;
  listId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !record?.id;
  const [form, setForm] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (record) Object.entries(record).forEach(([k, v]) => { base[k] = String(v ?? ''); });
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Arabic values match what the backend reads from the Excel sheets and stores in DB
  const ID_TYPE_OPTIONS = [
    { value: 'رقم قومي', label: 'National ID (رقم قومي)' },
    { value: 'جواز سفر', label: 'Passport (جواز سفر)' },
    { value: 'سجل تجاري', label: 'CR No. (سجل تجاري)' },
  ];
  const PERSON_TYPE_OPTIONS = [
    { value: 'فرد', label: 'Individual (فرد)' },
    { value: 'شركة', label: 'Company (شركة)' },
  ];
  const YES_NO_OPTIONS = [
    { value: 'نعم', label: 'Yes (نعم)' },
    { value: 'لا', label: 'No (لا)' },
  ];

  type FieldDef<T> = {
    key: keyof T;
    label: string;
    dir?: 'rtl';
    options?: { value: string; label: string }[];
  };

  const terrorismFields: FieldDef<TerrorismRecordDto>[] = [
    { key: 'name', label: 'Name (الاسم)', dir: 'rtl' },
    { key: 'idNumber', label: 'ID Number' },
    { key: 'idType', label: 'ID Type', options: ID_TYPE_OPTIONS },
    { key: 'unifiedCode', label: 'Unified Code' },
    { key: 'entityOwner', label: 'Entity Owner', dir: 'rtl' },
    { key: 'address', label: 'Address', dir: 'rtl' },
    { key: 'activityType', label: 'Activity Type', dir: 'rtl' },
    { key: 'terrorismListingDecision', label: 'Listing Decision' },
    { key: 'decisionYear', label: 'Decision Year' },
    { key: 'caseNumber', label: 'Case Number' },
    { key: 'caseYear', label: 'Case Year' },
    { key: 'counselorLetter', label: 'Counselor Letter' },
    { key: 'letterDate', label: 'Letter Date' },
    { key: 'decisionReceivedDate', label: 'Decision Received Date' },
    { key: 'seizureLifted', label: 'Seizure Lifted', options: YES_NO_OPTIONS },
  ];

  const prosecutionFields: FieldDef<ProsecutionRecordDto>[] = [
    { key: 'name', label: 'Name (الاسم)', dir: 'rtl' },
    { key: 'idNumber', label: 'ID Number (رقم البطاقة)' },
    { key: 'idType', label: 'ID Type', options: ID_TYPE_OPTIONS },
    { key: 'unifiedCode', label: 'Unified Code' },
    { key: 'personType', label: 'Person Type', options: PERSON_TYPE_OPTIONS },
    { key: 'prohibitionOrderNumber', label: 'Prohibition Order No.' },
    { key: 'prohibitionYear', label: 'Prohibition Year' },
    { key: 'caseNumber', label: 'Case Number' },
    { key: 'caseYear', label: 'Case Year' },
    { key: 'prohibitionStatus', label: 'Prohibition Status' },
    { key: 'counselorLetterNumber', label: 'Counselor Letter No.' },
    { key: 'counselorLetterDate', label: 'Counselor Letter Date' },
    { key: 'emailReceivedDate', label: 'Email Received Date' },
    { key: 'notes', label: 'Notes', dir: 'rtl' },
  ];

  const fields = listType === 'TERRORISM' ? terrorismFields : prosecutionFields;

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const dto = { ...form };
      if (listType === 'TERRORISM') {
        if (isNew) await amlApi.createTerrorismRecord(listId, dto as TerrorismRecordDto);
        else await amlApi.updateTerrorismRecord(record!.id!, dto as TerrorismRecordDto);
      } else {
        if (isNew) await amlApi.createProsecutionRecord(listId, dto as ProsecutionRecordDto);
        else await amlApi.updateProsecutionRecord(record!.id!, dto as ProsecutionRecordDto);
      }
      onSaved(); onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 8 }}
        transition={{ duration: 0.22 }}
        style={{
          background: 'var(--kaf-surface-2)',
          border: '1px solid var(--kaf-border-2)',
          borderRadius: 16,
          padding: '24px 28px',
          width: 560,
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--kaf-dark)' }}>
            {isNew ? 'Add New Record' : 'Edit Record'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kaf-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          {fields.map(({ key, label, dir, options }) => (
            <div key={String(key)} style={{ gridColumn: ['address', 'notes', 'activityType', 'entityOwner'].includes(String(key)) ? 'span 2' : 'span 1' }}>
              <label className="kaf-label">{label}</label>
              {options ? (
                <select
                  className="kaf-input kaf-select"
                  value={form[String(key)] ?? ''}
                  onChange={set(String(key))}
                  style={{
                    fontSize: 13,
                    cursor: 'pointer',
                    color: form[String(key)] ? 'var(--kaf-text)' : 'var(--kaf-muted)',
                  }}
                >
                  <option value="" disabled hidden>Select {label.replace(/\s*\(.*?\)\s*/g, '')}…</option>
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ color: 'var(--kaf-text)', background: 'var(--kaf-surface-2)' }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="kaf-input"
                  dir={dir}
                  value={form[String(key)] ?? ''}
                  onChange={set(String(key))}
                  style={{ fontSize: 13 }}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="kaf-callout error" style={{ marginBottom: 14, fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="kaf-btn-ghost" style={{ fontSize: 13, padding: '8px 18px' }}>Cancel</button>
          <button onClick={handleSave} className="kaf-btn" disabled={saving} style={{ padding: '8px 22px' }}>
            {saving ? <span className="kaf-spinner" style={{ width: 13, height: 13 }} /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export default function ListManagement() {
  const [lists, setLists] = useState<AmlListDto[]>([]);
  const [, setLoadingLists] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('TERRORISM');
  const [selectedListId, setSelectedListId] = useState<number | null>(null);

  const [records, setRecords] = useState<AnyRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [recordFlags, setRecordFlags] = useState<Record<number, FlaggedRecordDto>>({});
  const [flagFilter, setFlagFilter] = useState<'all' | 'flagged' | 'clear'>('all');

  const [showUpload, setShowUpload] = useState(false);
  const [editRecord, setEditRecord] = useState<AnyRecord | null | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!selectedList) return;
    setExporting(true);
    try {
      await exportListToExcel(selectedList, activeTab);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const fetchLists = useCallback(() => {
    setLoadingLists(true);
    amlApi.getLists()
      .then((data) => {
        setLists(data);
        const active = data.find((l) => l.listType === activeTab && l.isActive);
        if (active && selectedListId === null) setSelectedListId(active.id);
      })
      .catch(() => { })
      .finally(() => setLoadingLists(false));
  }, [activeTab, selectedListId]);

  const fetchRecords = useCallback(() => {
    if (selectedListId === null) return;
    setLoadingRecords(true);
    const flagged = flagFilter === 'all' ? undefined : flagFilter === 'flagged';
    amlApi.getRecords(selectedListId, page, PAGE_SIZE, search || undefined, flagged)
      .then((res) => {
        setRecords(res.records);
        setTotalElements(res.totalElements);
        setTotalPages(res.totalPages);
        // Load flags for visible records
        const ids = res.records.map((r) => r.id!).filter(Boolean);
        if (ids.length > 0) {
          amlApi.getFlagsByRecordIds(ids)
            .then(setRecordFlags)
            .catch(() => { });
        } else {
          setRecordFlags({});
        }
      })
      .catch(() => { })
      .finally(() => setLoadingRecords(false));
  }, [selectedListId, page, search, flagFilter]);

  useEffect(() => { fetchLists(); }, [activeTab]);
  useEffect(() => { fetchRecords(); }, [selectedListId, page, search, flagFilter]);

  /* When switching tabs, reset selection and search */
  const switchTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setPage(0);
    setSearch('');
    setSearchInput('');
    setFlagFilter('all');
    const active = lists.find((l) => l.listType === tab && l.isActive);
    setSelectedListId(active?.id ?? null);
  };

  /* When switching version */
  const switchVersion = (listId: number) => {
    setSelectedListId(listId);
    setPage(0);
    setSearch('');
    setSearchInput('');
    setFlagFilter('all');
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };

  const tabVersions = lists.filter((l) => l.listType === activeTab)
    .sort((a, b) => b.version - a.version);
  const selectedList = lists.find((l) => l.id === selectedListId);

  const isTerrorism = activeTab === 'TERRORISM';
  const terrorismCols = ['Name', 'ID Number', 'Listing Decision', 'Decision Year', 'Counselor Letter', 'Flagged'];
  const prosecutionCols = ['Name', 'ID Number', 'Type', 'Order No.', 'Year', 'Status', 'Flagged'];

  const renderCell = (r: AnyRecord, col: string) => {
    if (col === 'Flagged') {
      const flag = recordFlags[r.id!];
      if (!flag) return <span className="kaf-badge badge-clear" style={{ fontSize: 9 }}>Clear</span>;
      const sourceLabel = flag.policyNumber
        ? `Policy: ${flag.policyNumber}`
        : flag.sourceType === 'POLICY_SCREENING'
          ? 'Policy Screening'
          : flag.sourceType === 'INDIVIDUAL_CHECK' || flag.sourceType === 'MANUAL_CHECK'
            ? 'Individual Check'
            : flag.sourceType.replace(/_/g, ' ');
      return (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="kaf-badge badge-flagged" style={{ fontSize: 9 }}>Flagged</span>
          <span style={{ fontSize: 10, color: 'var(--kaf-muted)', fontWeight: 500 }}>
            {sourceLabel}
          </span>
        </span>
      );
    }
    if (isTerrorism) {
      const t = r as TerrorismRecordDto;
      switch (col) {
        case 'Name': return <span style={{ direction: 'rtl', display: 'block', textAlign: 'right', fontWeight: 600 }}>{t.name || '—'}</span>;
        case 'ID Number': return <span className="kaf-code-inline">{t.idNumber || '—'}</span>;
        case 'Listing Decision': return <span style={{ color: 'var(--kaf-muted)', fontSize: 12 }}>{t.terrorismListingDecision || '—'}</span>;
        case 'Decision Year': return <span style={{ color: 'var(--kaf-muted)', fontSize: 12 }}>{t.decisionYear || '—'}</span>;
        case 'Counselor Letter': return <span className="kaf-code-inline">{t.counselorLetter || '—'}</span>;
      }
    } else {
      const p = r as ProsecutionRecordDto;
      switch (col) {
        case 'Name': return <span style={{ direction: 'rtl', display: 'block', textAlign: 'right', fontWeight: 600 }}>{p.name || '—'}</span>;
        case 'ID Number': return <span className="kaf-code-inline">{p.idNumber || '—'}</span>;
        case 'Type': return <span style={{ color: 'var(--kaf-muted)', fontSize: 12 }}>{p.personType || '—'}</span>;
        case 'Order No.': return <span className="kaf-code-inline">{p.prohibitionOrderNumber || '—'}</span>;
        case 'Year': return <span style={{ color: 'var(--kaf-muted)', fontSize: 12 }}>{p.prohibitionYear || '—'}</span>;
        case 'Status': return p.prohibitionStatus
          ? <span className="kaf-badge badge-flagged" style={{ fontSize: 9 }}>{p.prohibitionStatus}</span>
          : <span className="kaf-badge badge-inactive" style={{ fontSize: 9 }}>—</span>;
      }
    }
    return '—';
  };

  const cols = isTerrorism ? terrorismCols : prosecutionCols;

  return (
    <div className="kaf-page">
      {/* Modals */}
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onSuccess={() => { fetchLists(); }}
          />
        )}
        {editRecord !== undefined && selectedListId !== null && (
          <RecordModal
            listType={activeTab}
            record={editRecord}
            listId={selectedListId}
            onClose={() => setEditRecord(undefined)}
            onSaved={() => { fetchRecords(); }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <PageHeader
          icon={UploadCloud}
          title="List Management"
          subtitle="View, search, edit records and manage AML list versions."
          actions={
            <>
              <UserGuide pageTitle="List Management" sections={listManagementGuide} />
              <button onClick={() => setShowUpload(true)} className="kaf-btn" style={{ flexShrink: 0 }}>
                <UploadCloud size={15} /> Upload List
              </button>
            </>
          }
        />
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.25 }}
        style={{ display: 'flex', gap: 4, marginBottom: 18 }}
      >
        {(['TERRORISM', 'PROSECUTION'] as const).map((tab) => {
          const active = lists.find((l) => l.listType === tab && l.isActive);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 18px',
                borderRadius: 8,
                border: `1.5px solid ${isActive ? 'var(--kaf-purple)' : 'var(--kaf-border)'}`,
                background: isActive ? 'var(--kaf-purple-bg)' : 'var(--kaf-surface-1)',
                color: isActive ? 'var(--kaf-purple-light)' : 'var(--kaf-muted)',
                cursor: 'pointer', fontWeight: 600, fontSize: 13,
                transition: 'all .18s',
              }}
            >
              {tab === 'TERRORISM'
                ? <AlertTriangle size={13} color={isActive ? 'var(--kaf-warning)' : 'var(--kaf-muted)'} />
                : <Shield size={13} color={isActive ? 'var(--kaf-purple-light)' : 'var(--kaf-muted)'} />}
              {tab === 'TERRORISM' ? 'Terrorism' : 'Prosecution'}
              {active && (
                <span style={{
                  fontSize: 9.5, fontWeight: 700,
                  background: isActive ? 'var(--kaf-purple)' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#fff' : 'var(--kaf-muted)',
                  padding: '1px 6px', borderRadius: 10,
                }}>
                  v{active.version}
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Version picker + selected list info */}
      {tabVersions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="kaf-card"
          style={{ padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
        >
          <span style={{ fontSize: 11, color: 'var(--kaf-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.8px' }}>
            Version:
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tabVersions.map((l) => (
              <button
                key={l.id}
                onClick={() => switchVersion(l.id)}
                style={{
                  padding: '3px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${selectedListId === l.id ? 'var(--kaf-purple)' : 'var(--kaf-border)'}`,
                  background: selectedListId === l.id ? 'var(--kaf-purple-bg)' : 'var(--kaf-surface-2)',
                  color: selectedListId === l.id ? 'var(--kaf-purple-light)' : 'var(--kaf-muted)',
                  transition: 'all .15s',
                }}
              >
                v{l.version}
                {l.isActive && <span style={{ marginLeft: 4, color: 'var(--kaf-success)', fontWeight: 700 }}>●</span>}
              </button>
            ))}
          </div>
          {selectedList && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: 'var(--kaf-muted)' }}>
                {selectedList.recordCount?.toLocaleString() ?? '?'} records
              </span>
              {selectedList.isActive
                ? <span className="kaf-badge badge-active">Active</span>
                : <span className="kaf-badge badge-inactive">Archived</span>}
            </div>
          )}
        </motion.div>
      )}

      {/* Filters + Search + Add row */}
      {selectedListId !== null && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.22 }}
          style={{ marginBottom: 14 }}
        >
          {/* Flag filter chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--kaf-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.7px' }}>
              <Filter size={12} /> Filter
            </span>
            {([
              { key: 'all' as const, label: 'All Records' },
              { key: 'flagged' as const, label: 'Flagged Only' },
              { key: 'clear' as const, label: 'Clear Only' },
            ]).map((f) => {
              const active = flagFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFlagFilter(f.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${active ? 'var(--kaf-purple)' : 'var(--kaf-border)'}`,
                    background: active ? 'var(--kaf-purple-bg)' : 'var(--kaf-surface-2)',
                    color: active ? 'var(--kaf-purple-light)' : 'var(--kaf-muted)',
                    transition: 'all .15s',
                  }}
                >
                  {f.key === 'flagged' && <Flag size={11} />}
                  {f.label}
                  {active && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 8,
                      background: 'var(--kaf-purple)',
                      color: '#fff',
                    }}>{totalElements}</span>
                  )}
                </button>
              );
            })}
            {flagFilter !== 'all' && (
              <button onClick={() => setFlagFilter('all')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--kaf-muted)', cursor: 'pointer', fontSize: 11 }}>
                <X size={12} /> Reset
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <form onSubmit={submitSearch} style={{ display: 'flex', gap: 0, flex: 1, maxWidth: 420 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} color="var(--kaf-muted-2)"
                  style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  className="kaf-input"
                  placeholder="Search by name, ID, unified code…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ paddingLeft: 34, borderRadius: '8px 0 0 8px', borderRight: 'none', fontSize: 13 }}
                />
              </div>
              <button type="submit" className="kaf-btn"
                style={{ padding: '9px 16px', borderRadius: '0 8px 8px 0', fontSize: 13 }}>
                <Search size={13} /> Search
              </button>
            </form>
            {search && (
              <button onClick={() => { setSearch(''); setSearchInput(''); setPage(0); }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--kaf-muted)', cursor: 'pointer', fontSize: 12 }}>
                <X size={13} /> Clear
              </button>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={() => fetchRecords()} className="kaf-btn-ghost" style={{ padding: '8px 12px', fontSize: 12 }}
                title="Refresh">
                <RefreshCw size={13} />
              </button>
              <button
                onClick={handleExport}
                className="kaf-btn-ghost"
                disabled={exporting || !selectedList}
                style={{ padding: '8px 14px', fontSize: 12 }}
                title="Export current list to styled Excel"
              >
                {exporting
                  ? <span className="kaf-spinner" style={{ width: 12, height: 12 }} />
                  : <Download size={13} />}
                {exporting ? 'Exporting…' : 'Export'}
              </button>
              <button onClick={() => setEditRecord(null)} className="kaf-btn" style={{ padding: '8px 16px', fontSize: 12 }}>
                <Plus size={13} /> Add Row
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Records table */}
      {selectedListId === null ? (
        <div className="kaf-card" style={{ padding: '48px', textAlign: 'center' }}>
          <UploadCloud size={36} color="var(--kaf-muted-2)" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: 'var(--kaf-muted)', fontSize: 13 }}>
            No {activeTab.toLowerCase()} list uploaded yet.
          </p>
          <button onClick={() => setShowUpload(true)} className="kaf-btn" style={{ marginTop: 14, fontSize: 12, padding: '8px 20px' }}>
            <UploadCloud size={13} /> Upload List
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.25 }}
          className="kaf-card"
          style={{ overflow: 'hidden' }}
        >
          {loadingRecords ? (
            <div style={{ padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--kaf-muted)' }}>
              <div className="kaf-spinner" /> Loading records…
            </div>
          ) : records.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--kaf-muted)' }}>
              {search ? `No results for "${search}"`
                : flagFilter === 'flagged' ? 'No flagged records found.'
                  : flagFilter === 'clear' ? 'No clear records found.'
                    : 'No records in this list.'}
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="kaf-table">
                  <thead>
                    <tr>
                      {cols.map((c) => <th key={c}>{c}</th>)}
                      <th style={{ width: 48 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id}>
                        {cols.map((c) => (
                          <td key={c} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {renderCell(r, c)}
                          </td>
                        ))}
                        <td>
                          <button
                            onClick={() => setEditRecord(r)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--kaf-muted)', padding: 5, borderRadius: 6,
                              transition: 'all .15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--kaf-purple-bg)'; e.currentTarget.style.color = 'var(--kaf-purple-light)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--kaf-muted)'; }}
                          >
                            <Pencil size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 18px',
                  borderTop: '1px solid var(--kaf-border)',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--kaf-muted)' }}>
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements.toLocaleString()} records
                  </span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="kaf-btn-ghost"
                      style={{ padding: '5px 10px', fontSize: 12 }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--kaf-muted)', minWidth: 80, textAlign: 'center' }}>
                      Page {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="kaf-btn-ghost"
                      style={{ padding: '5px 10px', fontSize: 12 }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
