import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Shield, AlertTriangle, Users, ExternalLink, Flag, AlertOctagon, Database, LayoutDashboard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { amlApi } from '../lib/api';
import PageHeader from '../components/PageHeader';
import UserGuide from '../components/UserGuide';
import { dashboardGuide } from '../components/guides/guideContent';
import type { AmlListDto, FlaggedRecordDto } from '../types';

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};

function StatCard({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      className="kaf-card"
      style={{ padding: '16px 16px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `linear-gradient(135deg, ${accent}33 0%, ${accent}16 100%)`,
        border: `1px solid ${accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 10px ${accent}22`,
      }}>
        <Icon size={16} color={accent} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 10, color: 'var(--kaf-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', lineHeight: 1.25 }} title={label}>
          {label}
        </p>
        <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--kaf-dark)', letterSpacing: '-.4px', lineHeight: 1.1, marginTop: 2 }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: 10.5, color: 'var(--kaf-muted-2)', marginTop: 2, lineHeight: 1.3 }} title={sub}>{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<AmlListDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [recentFlags, setRecentFlags] = useState<FlaggedRecordDto[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [classACount, setClassACount] = useState<number | null>(null);
  const [classDCount, setClassDCount] = useState<number | null>(null);

  useEffect(() => {
    amlApi.getLists()
      .then(setLists)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setFlagsLoading(true);
    amlApi.getRecentFlags(5)
      .then(setRecentFlags)
      .catch(() => { })
      .finally(() => setFlagsLoading(false));
  }, []);

  const activeT = lists.find((l) => l.listType === 'TERRORISM' && l.isActive);
  const activeP = lists.find((l) => l.listType === 'PROSECUTION' && l.isActive);

  useEffect(() => {
    if (!activeT && !activeP) return;
    const sumFor = (cls: 'A' | 'D') => {
      const calls: Promise<number>[] = [];
      if (activeT) calls.push(amlApi.getFlagCount('TERRORISM', activeT.version, cls));
      if (activeP) calls.push(amlApi.getFlagCount('PROSECUTION', activeP.version, cls));
      return Promise.all(calls).then((c) => c.reduce((a, b) => a + b, 0));
    };
    sumFor('A').then(setClassACount).catch(() => setClassACount(null));
    sumFor('D').then(setClassDCount).catch(() => setClassDCount(null));
  }, [activeT?.version, activeP?.version]);
  const totalRecords = lists
    .filter((l) => l.isActive)
    .reduce((sum, l) => sum + (l.recordCount ?? 0), 0);

  return (
    <div className="kaf-page">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          subtitle={<>KAF Anti-Money Laundering &amp; Terrorism Screening</>}
          actions={<UserGuide pageTitle="Dashboard" sections={dashboardGuide} />}
        />
      </motion.div>

      {/* Stat strip */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="kaf-card" style={{ padding: '16px', height: 72 }}>
              <div className="kaf-skeleton" style={{ height: 11, width: '55%', marginBottom: 9 }} />
              <div className="kaf-skeleton" style={{ height: 22, width: '38%' }} />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}
        >
          <StatCard
            icon={Users}
            label="Screening Records"
            value={totalRecords.toLocaleString()}
            sub="Across all active lists"
            accent="#10b981"
          />
          <StatCard
            icon={AlertOctagon}
            label="Class A Flags"
            value={classACount != null ? classACount.toLocaleString() : '—'}
            sub="High-confidence matches"
            accent="#ef4444"
          />
          <StatCard
            icon={Flag}
            label="Class D Flags"
            value={classDCount != null ? classDCount.toLocaleString() : '—'}
            sub="Fuzzy / review matches"
            accent="#f59e0b"
          />
          <StatCard
            icon={AlertTriangle}
            label="Terrorism List"
            value={activeT ? `v${activeT.version}` : '—'}
            sub={activeT ? `${activeT.recordCount?.toLocaleString()} records` : 'Not loaded'}
            accent="#f59e0b"
          />
          <StatCard
            icon={Shield}
            label="Prosecution List"
            value={activeP ? `v${activeP.version}` : '—'}
            sub={activeP ? `${activeP.recordCount?.toLocaleString()} records` : 'Not loaded'}
            accent="#9333ea"
          />
        </motion.div>
      )}

      {/* Recent Flags (moved above list versions) */}
      {!flagsLoading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p className="kaf-section-head" style={{ margin: 0 }}>Recent Flags</p>
            <button
              onClick={() => navigate('/audit#flags')}
              className="kaf-btn-ghost"
              style={{ padding: '6px 14px', fontSize: 11.5 }}
            >
              <ExternalLink size={12} /> View all
            </button>
          </div>

          {recentFlags.length === 0 ? (
            <div className="kaf-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--kaf-muted)', fontSize: 13 }}>
              No screening flags yet.
            </div>
          ) : (
            <div className="kaf-card" style={{ overflow: 'hidden', padding: 0 }}>
              <table className="kaf-table">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>List</th>
                    <th>Screened Person</th>
                    <th>Matched On</th>
                    <th style={{ width: 140 }}>Policy / Source</th>
                    <th style={{ width: 100 }}>Score</th>
                    <th style={{ width: 130 }}>Checked By</th>
                    <th style={{ width: 170 }}>Flagged At</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFlags.map((f, i) => (
                    <motion.tr
                      key={f.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + i * 0.04, duration: 0.22 }}
                    >
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
                        <span className="kaf-badge" style={{
                          fontSize: 9,
                          background: f.matchClass === 'A' ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.10)',
                          color: f.matchClass === 'A' ? '#dc2626' : '#d97706',
                          border: f.matchClass === 'A' ? '1px solid rgba(239,68,68,0.30)' : '1px solid rgba(245,158,11,0.30)',
                        }}>
                          {f.matchClass} · {f.matchScore ?? '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 11.5, color: 'var(--kaf-text)' }}>
                          {f.createdByUsername
                            ? <span className="kaf-mono">@{f.createdByUsername}</span>
                            : <span style={{ color: 'var(--kaf-muted-2)' }}>—</span>}
                        </span>
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
        </motion.div>
      )}

      {/* All list versions table (single source of truth) */}
      {!loading && lists.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.25 }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <p className="kaf-section-head" style={{ margin: 0 }}>Latest List Versions</p>
            <button
              onClick={() => navigate('/lists')}
              className="kaf-btn-ghost"
              style={{ padding: '6px 14px', fontSize: 11.5 }}
            >
              <ExternalLink size={12} /> Manage
            </button>
          </div>
          <div className="kaf-card" style={{ overflow: 'hidden', padding: 0 }}>
            <table className="kaf-table">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Type</th>
                  <th style={{ width: 90 }}>Version</th>
                  <th>File</th>
                  <th style={{ width: 120 }}>Records</th>
                  <th style={{ width: 170 }}>Uploaded</th>
                  <th style={{ width: 130 }}>Uploaded By</th>
                  <th style={{ width: 110 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lists.slice().sort((a, b) => b.id - a.id).slice(0, 4).map((l, i) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.03, duration: 0.22 }}
                  >
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
                    <td style={{
                      maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontSize: 12, color: 'var(--kaf-text)',
                    }} title={l.fileName}>
                      {l.fileName}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--kaf-text)' }}>
                      {l.recordCount?.toLocaleString() ?? '—'}
                    </td>
                    <td>
                      <span className="kaf-mono" style={{ fontSize: 10.5, color: 'var(--kaf-muted-2)' }}>
                        {new Date(l.uploadedAt).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 11.5 }}>
                        {l.uploadedByUsername
                          ? <span className="kaf-mono" style={{ color: 'var(--kaf-text)' }}>@{l.uploadedByUsername}</span>
                          : <span style={{ color: 'var(--kaf-muted-2)' }}>—</span>}
                      </span>
                    </td>
                    <td>
                      {l.isActive
                        ? <span className="kaf-badge badge-active">Active</span>
                        : <span className="kaf-badge badge-inactive">Archived</span>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && lists.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="kaf-card"
          style={{ padding: '64px 32px', textAlign: 'center' }}
        >
          <div style={{
            width: 58, height: 58, borderRadius: '50%',
            background: 'var(--kaf-purple-bg)', border: '1px solid var(--kaf-purple-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Database size={24} color="var(--kaf-purple-light)" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--kaf-dark)', marginBottom: 4 }}>
            No lists uploaded
          </p>
          <p style={{ fontSize: 12.5, color: 'var(--kaf-muted)', marginBottom: 16 }}>
            Upload a terrorism or prosecution list to begin screening.
          </p>
          <button onClick={() => navigate('/lists')} className="kaf-btn" style={{ padding: '9px 20px', fontSize: 12.5 }}>
            Go to List Management
          </button>
        </motion.div>
      )}
    </div>
  );
}
