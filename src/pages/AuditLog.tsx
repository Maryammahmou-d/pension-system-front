import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, AlertCircle, RefreshCw, Download, Archive,
  AlertTriangle, Shield, Flag, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { amlApi } from '../lib/api';
import { exportAuditLogsToExcel, exportListToExcel, exportFlaggedRecordsToExcel } from '../lib/excelExport';
import PageHeader from '../components/PageHeader';
import UserGuide from '../components/UserGuide';
import { auditLogGuide } from '../components/guides/guideContent';
import type { AuditLog, AmlListDto, FlaggedRecordDto } from '../types';

type ViewMode = 'events' | 'archives' | 'flags';
type FlagSourceFilter = '' | 'POLICY_SCREENING' | 'INDIVIDUAL_CHECK';
type FlagClassFilter = '' | 'A' | 'D';
const FLAG_PAGE_SIZE = 25;

const ACTION_TYPES = ['', 'AML_CHECK', 'LIST_UPLOAD', 'OVERRIDE'] as const;

const actionMeta: Record<string, { color: string; bg: string; border: string; label: string }> = {
  AML_CHECK: { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', label: 'AML Check' },
  AML_BATCH_CHECK: { color: '#c084fc', bg: 'rgba(147,51,234,0.12)', border: 'rgba(147,51,234,0.25)', label: 'Batch Check' },
  LIST_UPLOAD: { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', label: 'List Upload' },
  OVERRIDE: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', label: 'Override' },
};

export default function AuditLogPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialView: ViewMode = location.hash === '#flags' ? 'flags'
    : location.hash === '#archives' ? 'archives' : 'events';
  const [view, setView] = useState<ViewMode>(initialView);

  useEffect(() => {
    const next = location.hash === '#flags' ? 'flags'
      : location.hash === '#archives' ? 'archives' : 'events';
    setView(next);
  }, [location.hash]);

  const switchView = (v: ViewMode) => {
    setView(v);
    navigate(v === 'events' ? '/audit' : `/audit#${v}`, { replace: true });
  };
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [archives, setArchives] = useState<AmlListDto[]>([]);
  const [archivesLoading, setArchivesLoading] = useState(false);
  const [exportingId, setExportingId] = useState<number | null>(null);

  const [flags, setFlags] = useState<FlaggedRecordDto[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [flagsTotal, setFlagsTotal] = useState(0);
  const [flagsTotalPages, setFlagsTotalPages] = useState(0);
  const [flagsPage, setFlagsPage] = useState(0);
  const [flagsSource, setFlagsSource] = useState<FlagSourceFilter>('');
  const [flagsClass, setFlagsClass] = useState<FlagClassFilter>('');

  const load = (f: string) => {
    setLoading(true); setError('');
    amlApi.getAuditLogs(f || undefined)
      .then(setLogs)
      .catch(() => setError('Failed to load audit logs.'))
      .finally(() => setLoading(false));
  };

  const loadArchives = () => {
    setArchivesLoading(true);
    amlApi.getLists()
      .then((all) => setArchives(all.filter((l) => !l.isActive)))
      .catch(() => { })
      .finally(() => setArchivesLoading(false));
  };

  const loadFlags = () => {
    setFlagsLoading(true);
    amlApi.getAllFlags(flagsPage, FLAG_PAGE_SIZE, flagsSource || undefined, flagsClass || undefined)
      .then((res) => {
        setFlags(res.flags);
        setFlagsTotal(res.totalElements);
        setFlagsTotalPages(res.totalPages);
      })
      .catch(() => { })
      .finally(() => setFlagsLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);
  useEffect(() => { if (view === 'archives') loadArchives(); }, [view]);
  useEffect(() => { if (view === 'flags') loadFlags(); }, [view, flagsPage, flagsSource, flagsClass]);

  const handleExportLog = () => exportAuditLogsToExcel(
    logs.map((l) => ({
      id: l.id,
      actionType: l.actionType,
      targetEntity: l.sourceSystem ?? '',
      details: l.description ?? '',
      timestamp: l.createdAt,
    })),
  );

  const [flagsExporting, setFlagsExporting] = useState(false);
  const handleExportFlags = async () => {
    setFlagsExporting(true);
    try {
      // Fetch every matching flag for the current filters in pages of 200.
      const all: FlaggedRecordDto[] = [];
      let p = 0;
      while (true) {
        const res = await amlApi.getAllFlags(
          p, 200, flagsSource || undefined, flagsClass || undefined,
        );
        all.push(...res.flags);
        if (p >= res.totalPages - 1 || res.flags.length === 0) break;
        p += 1;
      }
      await exportFlaggedRecordsToExcel(all, {
        sourceType: flagsSource || undefined,
        matchClass: flagsClass || undefined,
      });
    } catch (err) {
      console.error('Flagged records export failed', err);
    } finally {
      setFlagsExporting(false);
    }
  };

  const handleExportArchive = async (list: AmlListDto) => {
    setExportingId(list.id);
    try {
      await exportListToExcel(list, list.listType);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="kaf-page" style={{ maxWidth: 1040 }}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <PageHeader
          icon={ClipboardList}
          title={<>Audit &amp; Archives</>}
          subtitle="History of AML checks, uploads, overrides — and access to archived list versions."
          actions={
            <>
              <UserGuide pageTitle="Audit & Archives" sections={auditLogGuide} />
              {view === 'events' && logs.length > 0 && (
                <button onClick={handleExportLog} className="kaf-btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>
                  <Download size={13} /> Export
                </button>
              )}
              {view === 'flags' && flagsTotal > 0 && (
                <button
                  onClick={handleExportFlags}
                  disabled={flagsExporting}
                  className="kaf-btn-ghost"
                  style={{ padding: '8px 14px', fontSize: 12, opacity: flagsExporting ? 0.6 : 1 }}
                  title={`Export ${flagsTotal.toLocaleString()} flagged record${flagsTotal === 1 ? '' : 's'} matching the current filters`}
                >
                  {flagsExporting
                    ? <span className="kaf-spinner" style={{ width: 12, height: 12 }} />
                    : <Download size={13} />}
                  {flagsExporting ? 'Exporting…' : `Export (${flagsTotal.toLocaleString()})`}
                </button>
              )}
              <button
                onClick={() => (view === 'events' ? load(filter) : view === 'flags' ? loadFlags() : loadArchives())}
                className="kaf-btn-ghost"
                style={{ padding: '8px 14px', fontSize: 12 }}
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </>
          }
        />
      </motion.div>

      {/* View tabs */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04, duration: 0.2 }}
        style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid var(--kaf-border)' }}
      >
        {([
          { key: 'events', label: 'Audit Events', icon: ClipboardList },
          { key: 'flags', label: 'Flagged Records', icon: Flag },
          { key: 'archives', label: 'Archived Lists', icon: Archive },
        ] as const).map(({ key, label, icon: Icon }) => {
          const isActive = view === key;
          return (
            <button
              key={key}
              onClick={() => switchView(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${isActive ? 'var(--kaf-purple)' : 'transparent'}`,
                marginBottom: -1,
                color: isActive ? 'var(--kaf-purple-light)' : 'var(--kaf-muted)',
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: 600,
                transition: 'all .15s',
              }}
            >
              <Icon size={13} /> {label}
            </button>
          );
        })}
      </motion.div>

      {view === 'events' && (<>
        {/* Filter chips */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.24 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}
        >
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--kaf-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Filter:
          </span>
          {ACTION_TYPES.map((a) => {
            const meta = a ? actionMeta[a] : null;
            const isActive = filter === a;
            return (
              <button
                key={a}
                onClick={() => setFilter(a)}
                style={{
                  padding: '4px 14px',
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1.5px solid ${isActive
                    ? (meta?.border ?? 'var(--kaf-purple)')
                    : 'var(--kaf-border)'}`,
                  background: isActive
                    ? (meta?.bg ?? 'var(--kaf-purple-bg)')
                    : 'var(--kaf-surface-1)',
                  color: isActive
                    ? (meta?.color ?? 'var(--kaf-purple-light)')
                    : 'var(--kaf-muted)',
                  transition: 'all .15s',
                }}
              >
                {a ? (meta?.label ?? a) : 'All'}
              </button>
            );
          })}
          {!loading && (
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--kaf-muted-2)', fontFamily: 'monospace' }}>
              {logs.length} entr{logs.length === 1 ? 'y' : 'ies'}
            </span>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.25 }}
          className="kaf-card"
          style={{ overflow: 'hidden' }}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160, gap: 10, color: 'var(--kaf-muted)' }}
              >
                <div className="kaf-spinner" /> Loading audit logs…
              </motion.div>
            ) : error ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="kaf-callout error" style={{ margin: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertCircle size={14} /> {error}
                </div>
              </motion.div>
            ) : logs.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '56px 32px' }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'var(--kaf-purple-bg)', border: '1px solid var(--kaf-purple-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <ClipboardList size={22} color="var(--kaf-purple-light)" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--kaf-dark)', marginBottom: 4 }}>No entries found</p>
                <p style={{ fontSize: 12, color: 'var(--kaf-muted)' }}>
                  {filter ? `No "${filter}" events recorded yet.` : 'No audit events recorded yet.'}
                </p>
              </motion.div>
            ) : (
              <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <table className="kaf-table">
                  <thead>
                    <tr>
                      <th style={{ width: 56 }}>ID</th>
                      <th style={{ width: 160 }}>Action</th>
                      <th style={{ width: 130 }}>User</th>
                      <th style={{ width: 140 }}>Source</th>
                      <th>Details</th>
                      <th style={{ width: 170 }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => {
                      const meta = actionMeta[log.actionType];
                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.018, duration: 0.2 }}
                        >
                          <td>
                            <span className="kaf-mono" style={{ fontSize: 10.5, color: 'var(--kaf-muted-2)' }}>
                              {log.id}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                              fontSize: 10.5, fontWeight: 700,
                              background: meta?.bg ?? 'var(--kaf-surface-2)',
                              color: meta?.color ?? 'var(--kaf-muted)',
                              border: `1px solid ${meta?.border ?? 'var(--kaf-border)'}`,
                              letterSpacing: '.3px',
                            }}>
                              {meta?.label ?? log.actionType}
                            </span>
                          </td>
                          <td>
                            {log.createdByUsername
                              ? <span className="kaf-mono" style={{ fontSize: 11.5, color: 'var(--kaf-text)' }}>@{log.createdByUsername}</span>
                              : <span style={{ fontSize: 11.5, color: 'var(--kaf-muted-2)' }}>—</span>}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--kaf-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.sourceSystem || '—'}
                          </td>
                          <td style={{ color: 'var(--kaf-muted)', fontSize: 12 }}>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}>
                              {log.description || '—'}
                            </span>
                          </td>
                          <td>
                            <span className="kaf-mono" style={{ fontSize: 10.5, color: 'var(--kaf-muted-2)' }}>
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </>)}

      {/* ── Flagged Records view ──────────────────────────────── */}
      {view === 'flags' && (
        <FlaggedRecordsView
          flags={flags}
          loading={flagsLoading}
          total={flagsTotal}
          totalPages={flagsTotalPages}
          page={flagsPage}
          source={flagsSource}
          matchClass={flagsClass}
          onPage={setFlagsPage}
          onSource={(s) => { setFlagsSource(s); setFlagsPage(0); }}
          onClass={(c) => { setFlagsClass(c); setFlagsPage(0); }}
        />
      )}

      {/* ── Archived Lists view ─────────────────────────────────── */}
      {view === 'archives' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="kaf-card"
          style={{ overflow: 'hidden' }}
        >
          {archivesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160, gap: 10, color: 'var(--kaf-muted)' }}>
              <div className="kaf-spinner" /> Loading archived lists…
            </div>
          ) : archives.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 32px' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'var(--kaf-purple-bg)', border: '1px solid var(--kaf-purple-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <Archive size={22} color="var(--kaf-purple-light)" />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--kaf-dark)', marginBottom: 4 }}>No archived lists</p>
              <p style={{ fontSize: 12, color: 'var(--kaf-muted)' }}>
                Archived lists appear here when a REPLACE upload supersedes the previous active list.
              </p>
            </div>
          ) : (
            <table className="kaf-table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>ID</th>
                  <th style={{ width: 140 }}>Type</th>
                  <th style={{ width: 80 }}>Version</th>
                  <th>File Name</th>
                  <th style={{ width: 110 }}>Records</th>
                  <th style={{ width: 170 }}>Archived At</th>
                  <th style={{ width: 130 }}>Uploaded By</th>
                  <th style={{ width: 110 }}></th>
                </tr>
              </thead>
              <tbody>
                {archives
                  .slice()
                  .sort((a, b) => b.id - a.id)
                  .map((l, i) => (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02, duration: 0.2 }}
                    >
                      <td>
                        <span className="kaf-mono" style={{ fontSize: 10.5, color: 'var(--kaf-muted-2)' }}>{l.id}</span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20,
                          fontSize: 10.5, fontWeight: 700, letterSpacing: '.3px',
                          background: l.listType === 'TERRORISM'
                            ? 'rgba(245,158,11,0.12)' : 'var(--kaf-purple-bg)',
                          color: l.listType === 'TERRORISM'
                            ? '#fbbf24' : 'var(--kaf-purple-light)',
                          border: `1px solid ${l.listType === 'TERRORISM'
                            ? 'rgba(245,158,11,0.25)' : 'var(--kaf-purple-border)'}`,
                        }}>
                          {l.listType === 'TERRORISM'
                            ? <AlertTriangle size={10} />
                            : <Shield size={10} />}
                          {l.listType === 'TERRORISM' ? 'Terrorism' : 'Prosecution'}
                        </span>
                      </td>
                      <td><span className="kaf-code-inline">v{l.version}</span></td>
                      <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--kaf-text)' }}
                        title={l.fileName}>
                        {l.fileName}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--kaf-text)', fontSize: 12 }}>
                        {l.recordCount?.toLocaleString() ?? '—'}
                      </td>
                      <td>
                        <span className="kaf-mono" style={{ fontSize: 10.5, color: 'var(--kaf-muted-2)' }}>
                          {new Date(l.uploadedAt).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        {l.uploadedByUsername
                          ? <span className="kaf-mono" style={{ fontSize: 11.5, color: 'var(--kaf-text)' }}>@{l.uploadedByUsername}</span>
                          : <span style={{ fontSize: 11.5, color: 'var(--kaf-muted-2)' }}>—</span>}
                      </td>
                      <td>
                        <button
                          onClick={() => handleExportArchive(l)}
                          disabled={exportingId === l.id}
                          className="kaf-btn-ghost"
                          style={{ padding: '5px 12px', fontSize: 11 }}
                        >
                          {exportingId === l.id
                            ? <span className="kaf-spinner" style={{ width: 11, height: 11 }} />
                            : <Download size={11} />}
                          {exportingId === l.id ? '…' : 'Export'}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────────────────────
function FlaggedRecordsView({
  flags, loading, total, totalPages, page, source, matchClass, onPage, onSource, onClass,
}: {
  flags: FlaggedRecordDto[];
  loading: boolean;
  total: number;
  totalPages: number;
  page: number;
  source: FlagSourceFilter;
  matchClass: FlagClassFilter;
  onPage: (p: number) => void;
  onSource: (s: FlagSourceFilter) => void;
  onClass: (c: FlagClassFilter) => void;
}) {
  const SOURCE_FILTERS: { key: FlagSourceFilter; label: string }[] = [
    { key: '', label: 'All Sources' },
    { key: 'POLICY_SCREENING', label: 'Policy Screening' },
    { key: 'INDIVIDUAL_CHECK', label: 'Individual Check' },
  ];
  const CLASS_FILTERS: { key: FlagClassFilter; label: string }[] = [
    { key: '', label: 'All Classes' },
    { key: 'A', label: 'Class A (High)' },
    { key: 'D', label: 'Class D (Review)' },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.24 }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}
      >
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--kaf-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Source:
        </span>
        {SOURCE_FILTERS.map((f) => {
          const isActive = source === f.key;
          return (
            <button
              key={f.key || 'all'}
              onClick={() => onSource(f.key)}
              style={{
                padding: '4px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${isActive ? 'var(--kaf-purple)' : 'var(--kaf-border)'}`,
                background: isActive ? 'var(--kaf-purple-bg)' : 'var(--kaf-surface-1)',
                color: isActive ? 'var(--kaf-purple-light)' : 'var(--kaf-muted)',
                transition: 'all .15s',
              }}
            >
              {f.label}
            </button>
          );
        })}
        {!loading && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--kaf-muted-2)', fontFamily: 'monospace' }}>
            {total.toLocaleString()} flag{total === 1 ? '' : 's'}
          </span>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.09, duration: 0.24 }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}
      >
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--kaf-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Class:
        </span>
        {CLASS_FILTERS.map((f) => {
          const isActive = matchClass === f.key;
          return (
            <button
              key={f.key || 'all'}
              onClick={() => onClass(f.key)}
              style={{
                padding: '4px 14px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${isActive ? 'var(--kaf-purple)' : 'var(--kaf-border)'}`,
                background: isActive ? 'var(--kaf-purple-bg)' : 'var(--kaf-surface-1)',
                color: isActive ? 'var(--kaf-purple-light)' : 'var(--kaf-muted)',
                transition: 'all .15s',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.25 }}
        className="kaf-card"
        style={{ overflow: 'hidden' }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160, gap: 10, color: 'var(--kaf-muted)' }}>
            <div className="kaf-spinner" /> Loading flagged records…
          </div>
        ) : flags.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 32px' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--kaf-purple-bg)', border: '1px solid var(--kaf-purple-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <Flag size={22} color="var(--kaf-purple-light)" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--kaf-dark)', marginBottom: 4 }}>No flagged records</p>
            <p style={{ fontSize: 12, color: 'var(--kaf-muted)' }}>
              No screening hits recorded for the selected source.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="kaf-table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>ID</th>
                  <th style={{ width: 110 }}>List</th>
                  <th>Screened Person</th>
                  <th>Matched On</th>
                  <th style={{ width: 140 }}>Policy / Source</th>
                  <th style={{ width: 100 }}>Match</th>
                  <th style={{ width: 130 }}>Checked By</th>
                  <th style={{ width: 170 }}>Flagged At</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((f, i) => (
                  <motion.tr
                    key={f.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.015, duration: 0.18 }}
                  >
                    <td>
                      <span className="kaf-mono" style={{ fontSize: 10.5, color: 'var(--kaf-muted-2)' }}>{f.id}</span>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'row', gap: 5, alignItems: 'center', flexWrap: 'nowrap' }}>
                        <span className={`kaf-badge ${f.listType === 'TERRORISM' ? 'badge-terrorism' : 'badge-prosecution'}`} style={{ fontSize: 9, flexShrink: 0 }}>
                          {f.listType === 'TERRORISM' ? 'Terrorism' : 'Prosecution'}
                        </span>
                        {f.listVersion != null && (
                          <span className="kaf-code-inline" style={{ fontSize: 9, flexShrink: 0 }}>v{f.listVersion}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                        <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--kaf-dark)' }}>
                          {f.personName || <span style={{ color: 'var(--kaf-muted-2)', fontWeight: 400 }}>(no name)</span>}
                        </span>
                        {f.personIdNumber && (
                          <span className="kaf-mono" style={{ fontSize: 11, color: 'var(--kaf-text)' }}>
                            {f.personIdNumber}
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <div dir="ltr" style={{ textAlign: 'left' }}>
                        <span style={{ fontSize: 12, color: 'var(--kaf-text)' }}>
                          {f.matchedName || '—'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, color: 'var(--kaf-muted)' }}>
                        {f.sourceType === 'POLICY_SCREENING' ? (
                          <span style={{ color: 'var(--kaf-purple-light)' }}>{f.policyNumber || 'Policy Screening'}</span>
                        ) : (f.sourceType === 'INDIVIDUAL_CHECK' || f.sourceType === 'MANUAL_CHECK') ? (
                          f.policyNumber
                            ? <span style={{ color: 'var(--kaf-purple-light)' }}>{f.policyNumber}</span>
                            : 'Individual Check'
                        ) : (
                          f.sourceType
                        )}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className="kaf-badge" style={{
                          fontSize: 9,
                          background: f.matchClass === 'A' ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.10)',
                          color: f.matchClass === 'A' ? '#dc2626' : '#d97706',
                          border: f.matchClass === 'A' ? '1px solid rgba(239,68,68,0.30)' : '1px solid rgba(245,158,11,0.30)',
                          alignSelf: 'flex-start',
                        }}>
                          {f.matchClass} · {f.matchScore ?? '—'}
                        </span>
                        {f.matchType && (
                          <span style={{ fontSize: 9.5, color: 'var(--kaf-muted-2)' }}>{f.matchType.replace(/_/g, ' ')}</span>
                        )}
                      </span>
                    </td>
                    <td>
                      {f.createdByUsername
                        ? <span className="kaf-mono" style={{ fontSize: 11.5, color: 'var(--kaf-text)' }}>@{f.createdByUsername}</span>
                        : <span style={{ fontSize: 11.5, color: 'var(--kaf-muted-2)' }}>—</span>}
                    </td>
                    <td>
                      <span className="kaf-mono" style={{ fontSize: 10.5, color: 'var(--kaf-muted-2)' }}>
                        {new Date(f.createdAt).toLocaleString()}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px', borderTop: '1px solid var(--kaf-border)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--kaf-muted)' }}>
              Page {page + 1} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => onPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="kaf-btn-ghost"
                style={{ padding: '5px 10px', fontSize: 11, opacity: page === 0 ? 0.5 : 1 }}
              >
                <ChevronLeft size={12} /> Prev
              </button>
              <button
                onClick={() => onPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="kaf-btn-ghost"
                style={{ padding: '5px 10px', fontSize: 11, opacity: page >= totalPages - 1 ? 0.5 : 1 }}
              >
                Next <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
