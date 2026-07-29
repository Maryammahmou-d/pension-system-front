import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertCircle, AlertTriangle, CheckCircle2, RefreshCw, ChevronDown, ChevronUp,
  FileSpreadsheet, Upload, X,
} from 'lucide-react';
import { amlApi } from '../lib/api';
import type {
  AmlBatchCheckResponse, BatchJobStatusResponse, BatchJobSubmitResponse, FlaggedPerson,
} from '../types';
import Badge from '../components/Badge';
import MatchCard from '../components/MatchCard';
import PageHeader from '../components/PageHeader';
import UserGuide from '../components/UserGuide';
import { policyScreeningGuide } from '../components/guides/guideContent';
import { useTheme } from '../lib/theme';

/* ── Column mapping types ─────────────────────────────────── */
type MappingKey = 'name' | 'idNumber' | 'idType';
type ColumnMapping = Record<MappingKey, string>;
const MAPPING_FIELDS: { key: MappingKey; label: string; hint: string; required?: boolean }[] = [
  { key: 'name', label: 'Name column', hint: 'Column holding the full name', required: true },
  { key: 'idNumber', label: 'ID number column', hint: 'Column holding the identification number' },
  { key: 'idType', label: 'ID type column', hint: 'Optional — column describing the type (National / Passport / CR)' },
];

function autoDetectMapping(headers: string[]): ColumnMapping {
  const norm = (s: string) => s.toLowerCase().replace(/[\s_\-.]+/g, '');
  const find = (patterns: RegExp[]) =>
    headers.find((h) => patterns.some((p) => p.test(norm(h)))) || '';
  return {
    name: find([/^name$/, /fullname/, /الاسم/]),
    idNumber: find([/idnumber/, /^id$/, /nationalid/, /nid/, /passport/, /^cr$/, /رقمقومي/, /اثبات/, /رقمالهوية/]),
    idType: find([/idtype/, /typeofid/, /نوعاثبات/, /نوعالهوية/, /نوعالوثيقة/]),
  };
}

type Tab = 'standard' | 'queued';

/* ── Simple scrollable list (expandable rows need natural flow) ─── */
function FlaggedList({ persons }: { persons: FlaggedPerson[] }) {
  return (
    <div style={{ maxHeight: 560, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {persons.map((p) => (
        <PersonRow key={p.index} person={p} />
      ))}
    </div>
  );
}

function PersonRow({ person }: { person: FlaggedPerson }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--kaf-border)', borderRadius: 8, marginBottom: 6 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '10px 14px', background: open ? 'var(--kaf-purple-bg)' : 'var(--kaf-surface-1)',
          border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12,
          transition: 'background .18s var(--ease)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0, flex: 1 }}>
          <div style={{ marginTop: 1 }}>
            <Badge variant={person.status === 'FLAGGED' ? 'flagged' : 'clear'}>{person.status}</Badge>
          </div>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--kaf-dark)', wordBreak: 'break-word' }}>
              #{person.index} {person.name || '—'}
            </span>
            {person.nationalId && (
              <span className="kaf-code-inline" style={{ fontSize: 11, alignSelf: 'flex-start' }}>{person.nationalId}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginTop: 1 }}>
          {person.status === 'FLAGGED' && (
            <span style={{ fontSize: 11.5, color: 'var(--kaf-error)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {person.matches.length} match{person.matches.length !== 1 ? 'es' : ''}
            </span>
          )}
          {open
            ? <ChevronUp size={15} color="var(--kaf-muted)" />
            : <ChevronDown size={15} color="var(--kaf-muted)" />}
        </div>
      </button>
      {open && person.status === 'FLAGGED' && (
        <div style={{ padding: '10px 14px 14px', background: 'var(--kaf-surface-2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {person.matches.map((m, i) => <MatchCard key={m.recordId} match={m} index={i} />)}
        </div>
      )}
    </div>
  );
}

function BatchResultPanel({ result }: { result: AmlBatchCheckResponse }) {
  return (
    <div className="kaf-card" style={{ padding: '22px 26px', marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Badge variant={result.status === 'FLAGGED' ? 'flagged' : 'clear'}>{result.status}</Badge>
        <span style={{ fontSize: 13, color: 'var(--kaf-muted)' }}>
          <strong style={{ color: 'var(--kaf-dark)' }}>{result.totalScreened.toLocaleString()}</strong> screened ·{' '}
          <strong style={{ color: result.totalFlagged > 0 ? 'var(--kaf-error)' : 'var(--kaf-success)' }}>{result.totalFlagged}</strong> flagged ·{' '}
          <span className="kaf-mono">{result.processingTimeMs}ms</span>
        </span>
      </div>

      {result.nameValidationNote && (
        <div className="kaf-callout warn" style={{ marginBottom: 14, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} /> {result.nameValidationNote}
        </div>
      )}

      {result.crMatches && result.crMatches.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <p className="kaf-section-head">CR Matches</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.crMatches.map((m, i) => <MatchCard key={m.recordId} match={m} index={i} />)}
          </div>
        </div>
      )}

      <p className="kaf-section-head">
        Flagged Persons ({result.flaggedPersons.length})
      </p>
      {result.flaggedPersons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <CheckCircle2 size={38} color="var(--kaf-success)" style={{ margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13, color: 'var(--kaf-muted)' }}>No persons flagged</p>
        </div>
      ) : (
        <FlaggedList persons={result.flaggedPersons} />
      )}
    </div>
  );
}

export default function BatchCheck() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [tab, setTab] = useState<Tab>('standard');
  const [policyNumber, setPolicyNumber] = useState('');

  /* ── Excel upload state ─────────────────────────────────── */
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [sheetName, setSheetName] = useState('');
  const [mapping, setMapping] = useState<ColumnMapping>({ name: '', idNumber: '', idType: '' });
  const [peeking, setPeeking] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  /* ── Run state ──────────────────────────────────────────── */
  const [syncResult, setSyncResult] = useState<AmlBatchCheckResponse | null>(null);
  const [asyncJob, setAsyncJob] = useState<BatchJobStatusResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetImport = () => {
    setFile(null);
    setHeaders([]);
    setTotalRows(0);
    setSheetName('');
    setMapping({ name: '', idNumber: '', idType: '' });
    setImportError('');
    setSyncResult(null);
    setAsyncJob(null);
    setError('');
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = async (f: File) => {
    if (!/\.(xlsx|xls)$/i.test(f.name)) {
      setImportError('Only .xlsx / .xls files are accepted.');
      return;
    }
    setImportError(''); setPeeking(true);
    setFile(f); setHeaders([]); setTotalRows(0);
    try {
      const res = await amlApi.batchExcelPeek(f);
      setHeaders(res.headers);
      setTotalRows(res.totalRows);
      setSheetName(res.sheetName);
      setMapping(autoDetectMapping(res.headers));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setImportError(e?.response?.data?.message || e?.message || 'Failed to read the Excel file.');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setPeeking(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const runScreening = useCallback(async () => {
    if (!file) { setError('Upload an Excel file first.'); return; }
    if (!mapping.name) { setError('Pick the column that holds the full name.'); return; }

    setError(''); setSyncResult(null); setAsyncJob(null);
    if (pollRef.current) clearInterval(pollRef.current);

    setRunning(true);
    try {
      const resp = await amlApi.batchExcelRun(
        file,
        {
          nameColumn: mapping.name,
          idColumn: mapping.idNumber || undefined,
          idTypeColumn: mapping.idType || undefined,
        },
        policyNumber || undefined,
        tab,
      );
      if (tab === 'standard') {
        setSyncResult(resp as AmlBatchCheckResponse);
      } else {
        const submitted = resp as BatchJobSubmitResponse;
        setAsyncJob({ jobId: submitted.jobId, status: submitted.status as BatchJobStatusResponse['status'] });
        pollRef.current = setInterval(async () => {
          const status = await amlApi.batchStatus(submitted.jobId);
          setAsyncJob(status);
          if (status.status === 'COMPLETED' || status.status === 'FAILED') {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }, 2000);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e?.message || 'Screening failed.');
    } finally {
      setRunning(false);
    }
  }, [file, mapping, policyNumber, tab]);

  return (
    <div className="kaf-page">
      <div className="anim-fade-up">
        <PageHeader
          icon={Users}
          title="Policy Screening"
          subtitle="Screen every insured person on a policy in one go."
          actions={<UserGuide pageTitle="Policy Screening" sections={policyScreeningGuide} />}
        />
      </div>

      {/* Volume mode tabs */}
      <div className="anim-fade-up" style={{
        display: 'flex', gap: 4, marginBottom: 22,
        background: isLight ? '#ece4f0' : 'rgba(255,255,255,0.06)',
        border: isLight ? 'none' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: 4, width: 'fit-content',
      }}>
        {(['standard', 'queued'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSyncResult(null); setAsyncJob(null); setError(''); }}
            style={{
              padding: '8px 20px', borderRadius: 7, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all .2s var(--ease)',
              background: tab === t
                ? (isLight ? 'var(--kaf-white)' : 'rgba(147,51,234,0.18)')
                : 'transparent',
              color: tab === t ? 'var(--kaf-purple)' : 'var(--kaf-muted)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {t === 'standard' ? 'Standard  ·  up to 50,000 persons' : 'Large volume  ·  up to 600,000 persons'}
          </button>
        ))}
      </div>

      {/* ── Upload card ─────────────────────────────────────── */}
      <div className="kaf-card anim-fade-up" style={{ padding: '24px 28px', marginBottom: 20 }}>
        <p className="kaf-section-head" style={{ marginBottom: 16 }}>Upload policy spreadsheet</p>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--kaf-purple)' : 'rgba(107,2,125,0.3)'}`,
              background: dragOver ? 'rgba(107,2,125,0.05)' : 'transparent',
              borderRadius: 10, padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
              transition: 'all .18s var(--ease)',
            }}
          >
            <Upload size={26} color="var(--kaf-purple)" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--kaf-dark)', margin: 0 }}>
              {peeking ? 'Reading file…' : 'Drop your Excel file here, or click to browse'}
            </p>
            <p style={{ fontSize: 11.5, color: 'var(--kaf-muted)', margin: '5px 0 0' }}>
              .xlsx / .xls — the server reads the first sheet and pulls the column names for you.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: 'rgba(107,2,125,0.06)',
            border: '1px solid rgba(107,2,125,0.15)', borderRadius: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <FileSpreadsheet size={20} color="var(--kaf-purple)" />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--kaf-dark)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: 11.5, color: 'var(--kaf-muted)', margin: '2px 0 0' }}>
                  {peeking
                    ? 'Reading…'
                    : `${totalRows.toLocaleString()} rows · ${headers.length} columns · sheet “${sheetName}”`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetImport}
              disabled={running}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                background: 'transparent', border: '1px solid rgba(107,2,125,0.25)',
                color: 'var(--kaf-purple)', padding: '6px 12px', borderRadius: 6,
                cursor: running ? 'not-allowed' : 'pointer', opacity: running ? 0.5 : 1,
              }}
            >
              <X size={12} /> Remove
            </button>
          </div>
        )}

        {importError && (
          <div className="kaf-callout error" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
            <AlertCircle size={14} color="var(--kaf-error)" /> {importError}
          </div>
        )}
      </div>

      {/* ── Mapping + policy + run ──────────────────────────── */}
      <AnimatePresence initial={false}>
        {file && headers.length > 0 && (
          <motion.div
            key="run-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="kaf-card"
            style={{ padding: '24px 28px', marginBottom: 20 }}
          >
            <p className="kaf-section-head" style={{ marginBottom: 14 }}>Tell us which column is which</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              {MAPPING_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="kaf-label">
                    {f.label}{f.required && <span style={{ color: 'var(--kaf-error)' }}> *</span>}
                  </label>
                  <select
                    className="kaf-input"
                    value={mapping[f.key]}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                    disabled={running}
                  >
                    <option value="">— not mapped —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: 11, color: 'var(--kaf-muted)', margin: '3px 0 0' }}>{f.hint}</p>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label className="kaf-label">Policy number (optional)</label>
              <input
                className="kaf-input"
                placeholder="POL-2026-001234"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                disabled={running}
              />
            </div>

            {error && (
              <div className="kaf-callout error" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={14} color="var(--kaf-error)" /> {error}
              </div>
            )}

            <button className="kaf-btn" onClick={runScreening} disabled={running || !mapping.name}>
              {running ? <span className="kaf-spinner" style={{ width: 14, height: 14 }} /> : <Users size={15} />}
              {running
                ? (tab === 'standard' ? 'Screening…' : 'Queueing…')
                : (tab === 'standard' ? 'Run screening' : 'Queue screening job')}
            </button>
            <p style={{ fontSize: 11.5, color: 'var(--kaf-muted)', marginTop: 8 }}>
              The file is processed on the server — the browser stays responsive even with hundreds of thousands of rows.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync result */}
      {syncResult && <BatchResultPanel result={syncResult} />}

      {/* Async job status */}
      {asyncJob && (
        <div className="kaf-card anim-fade-up" style={{ padding: '22px 26px', marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--kaf-dark)' }}>Job Status</p>
            <Badge variant={
              asyncJob.status === 'COMPLETED' ? 'completed'
                : asyncJob.status === 'FAILED' ? 'failed'
                  : asyncJob.status === 'PROCESSING' ? 'processing'
                    : 'pending'
            }>{asyncJob.status}</Badge>
            {(asyncJob.status === 'PENDING' || asyncJob.status === 'PROCESSING') && (
              <RefreshCw size={13} color="var(--kaf-purple)" style={{ animation: 'spin .9s linear infinite' }} />
            )}
          </div>
          <code className="kaf-code-inline" style={{ fontSize: 11, display: 'inline-block', marginBottom: 14 }}>
            {asyncJob.jobId}
          </code>
          {asyncJob.totalPersons !== undefined && (
            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--kaf-text)', marginBottom: 14, flexWrap: 'wrap' }}>
              <span>Persons: <strong>{asyncJob.totalPersons?.toLocaleString()}</strong></span>
              <span>Flagged: <strong style={{ color: 'var(--kaf-error)' }}>{asyncJob.totalFlagged}</strong></span>
              <span>Matches: <strong>{asyncJob.totalMatches}</strong></span>
              {asyncJob.processingTimeMs !== undefined && (
                <span className="kaf-mono" style={{ fontSize: 12, color: 'var(--kaf-muted)' }}>
                  {asyncJob.processingTimeMs}ms
                </span>
              )}
            </div>
          )}
          {asyncJob.errorMessage && (
            <div className="kaf-callout error" style={{ fontSize: 12.5 }}>{asyncJob.errorMessage}</div>
          )}
          {asyncJob.result && <BatchResultPanel result={asyncJob.result} />}
        </div>
      )}
    </div>
  );
}
