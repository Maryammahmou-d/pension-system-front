import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Trash2, Pencil, X, Check, ShieldAlert, ShieldCheck, Search, UserCog,
  Eye, EyeOff,
} from 'lucide-react';
import axios from 'axios';
import { usersApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import PageHeader from '../../components/PageHeader';
import type { CreateUserRequest, PermissionKey, UpdateUserRequest, UserDto, UserSecurityRole } from '../../types';
import { USER_SECURITY_ROLES } from '../../types';

const PERMISSIONS: { key: PermissionKey; label: string; hint: string }[] = [
  { key: 'permViewDashboard', label: 'View dashboard', hint: 'Access to home overview' },
  { key: 'permCreateInvoice', label: 'Create invoice', hint: 'Operations — create company invoices' },
  { key: 'permSettleInvoice', label: 'Settle invoice', hint: 'CRM / Investment — settle unpaid invoices' },
  { key: 'permCancelInvoice', label: 'Cancel invoice', hint: 'Tech — cancel unsettled invoices' },
  { key: 'permAddTopUp', label: 'Add top up', hint: 'Operations — single employee top-up' },
  { key: 'permBulkTopUp', label: 'Bulk top up', hint: 'Operations — Excel bulk top-up' },
  { key: 'permManageUsers', label: 'Manage users', hint: 'Administer application users' },
];

type DialogMode = { type: 'closed' } | { type: 'create' } | { type: 'edit'; user: UserDto };

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<DialogMode>({ type: 'closed' });
  const [confirmDelete, setConfirmDelete] = useState<UserDto | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await usersApi.list();
      setUsers(list);
      setError(null);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      u.username.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || (u.fullName ?? '').toLowerCase().includes(q));
  }, [search, users]);

  const handleDelete = async (u: UserDto) => {
    try {
      await usersApi.remove(u.id);
      setConfirmDelete(null);
      await refresh();
    } catch (err) {
      setError(extractError(err));
    }
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <PageHeader
        icon={UserCog}
        title="User Management"
        subtitle="Create, edit, and remove application users."
        actions={
          <>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--kaf-muted)',
              }} />
              <input
                placeholder="Search users…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '9px 12px 9px 32px', borderRadius: 10,
                  border: '1px solid var(--kaf-border-2)',
                  background: 'var(--kaf-surface-2)',
                  color: 'var(--kaf-text)', fontSize: 13, outline: 'none',
                  minWidth: 220,
                }}
              />
            </div>
            <button onClick={() => setDialog({ type: 'create' })} style={primaryBtn}>
              <UserPlus size={15} /> Add user
            </button>
          </>
        }
      />

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 16,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.30)',
          color: '#dc2626', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={cardStyle}>
        {loading ? (
          <EmptyBlock>Loading users…</EmptyBlock>
        ) : filtered.length === 0 ? (
          <EmptyBlock>No users match.</EmptyBlock>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <Th>User</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Last login</Th>
                  <Th>Created by</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} style={{ borderTop: '1px solid var(--kaf-border)' }}>
                    <Td>
                      <div style={{ fontWeight: 600, color: 'var(--kaf-text)' }}>
                        {u.fullName || u.username}
                      </div>
                      <div style={{
                        fontSize: 11.5, color: 'var(--kaf-muted)',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}>
                        @{u.username}
                      </div>
                    </Td>
                    <Td>{u.email}</Td>
                    <Td>
                      {u.isSuperuser ? (
                        <Badge color="#a855f7" bg="rgba(168,85,247,0.12)">
                          <ShieldCheck size={11} /> Superuser
                        </Badge>
                      ) : (
                        <Badge color="var(--kaf-muted)" bg="rgba(120,120,140,0.12)">
                          User
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      {u.isActive
                        ? <Badge color="#10b981" bg="rgba(16,185,129,0.10)">Active</Badge>
                        : <Badge color="#ef4444" bg="rgba(239,68,68,0.10)">Disabled</Badge>}
                      {u.mustChangePassword && (
                        <span style={{ marginLeft: 6 }}>
                          <Badge color="#d97706" bg="rgba(245,158,11,0.10)">
                            <ShieldAlert size={11} /> Reset pending
                          </Badge>
                        </span>
                      )}
                    </Td>
                    <Td>{formatDate(u.lastLoginAt)}</Td>
                    <Td>
                      <span style={{ color: 'var(--kaf-muted)' }}>
                        {u.createdBy ?? '—'}
                      </span>
                    </Td>
                    <Td align="right">
                      <button
                        onClick={() => setDialog({ type: 'edit', user: u })}
                        style={iconBtn} title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(u)}
                        disabled={u.id === currentUser?.id}
                        title={u.id === currentUser?.id ? 'You cannot delete yourself' : 'Delete'}
                        style={{
                          ...iconBtn, color: '#ef4444',
                          opacity: u.id === currentUser?.id ? 0.4 : 1
                        }}>
                        <Trash2 size={14} />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit dialog */}
      <AnimatePresence>
        {dialog.type !== 'closed' && (
          <UserDialog
            mode={dialog}
            onClose={() => setDialog({ type: 'closed' })}
            onSaved={async () => { setDialog({ type: 'closed' }); await refresh(); }}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <Modal onClose={() => setConfirmDelete(null)} maxWidth={420}>
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--kaf-text)' }}>
              Delete user?
            </h3>
            <p style={{ marginTop: 8, color: 'var(--kaf-muted)', fontSize: 13 }}>
              This will permanently remove <b>{confirmDelete.username}</b>. Their audit history
              remains, but the username is freed for reuse.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={() => setConfirmDelete(null)} style={ghostBtn}>Cancel</button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{ ...primaryBtn, background: '#ef4444', boxShadow: 'none' }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Dialog ──────────────────────────────────────────────────────────────

function UserDialog({
  mode, onClose, onSaved,
}: {
  mode: { type: 'create' } | { type: 'edit'; user: UserDto };
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = mode.type === 'edit';
  const initial = mode.type === 'edit' ? mode.user : null;

  const [username, setUsername] = useState(initial?.username ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [userSecurity, setUserSecurity] = useState<UserSecurityRole>(
    initial?.userSecurity ?? 'Operations',
  );
  const [isSuperuser, setIsSuperuser] = useState(initial?.isSuperuser ?? false);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [resetPassword, setResetPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [perms, setPerms] = useState<Record<PermissionKey, boolean>>(() => {
    const obj = {} as Record<PermissionKey, boolean>;
    PERMISSIONS.forEach((p) => { obj[p.key] = Boolean(initial?.[p.key]); });
    return obj;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRequired = editing && resetPassword;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!editing) {
      if (!fullName.trim() || !username.trim() || !userSecurity) {
        setError('Full Name, Login ID, and User Security are required.');
        return;
      }
      setSubmitting(true);
      try {
        const payload: CreateUserRequest = {
          username: username.trim(),
          fullName: fullName.trim(),
          userSecurity,
        };
        await usersApi.create(payload);
        onSaved();
      } catch (err) {
        setError(extractError(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (passwordRequired) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: UpdateUserRequest = {
        email, fullName, isSuperuser, isActive, userSecurity,
        resetPassword: resetPassword || undefined,
        newPassword: resetPassword ? password : undefined,
        ...perms,
      };
      await usersApi.update(initial!.id, payload);
      onSaved();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!editing) {
    return (
      <Modal onClose={onClose} maxWidth={420}>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 17, color: 'var(--kaf-text)' }}>
              Add New User
            </h3>
            <button type="button" onClick={onClose} style={iconBtn} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Full Name *">
              <input
                value={fullName ?? ''}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting}
                className="kaf-input"
                required
                autoFocus
              />
            </Field>
            <Field label="Login ID *">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                className="kaf-input"
                required
                autoComplete="off"
              />
            </Field>
            <Field label="User Security *">
              <select
                className="kaf-input kaf-select"
                value={userSecurity}
                onChange={(e) => setUserSecurity(e.target.value as UserSecurityRole)}
                disabled={submitting}
                required
              >
                {USER_SECURITY_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </Field>
          </div>

          <p style={{
            marginTop: 14, marginBottom: 0, fontSize: 12, lineHeight: 1.5,
            color: 'var(--kaf-muted)',
          }}>
            Initial password is <b style={{ color: 'var(--kaf-text)' }}>Password</b>.
            The user must change it on first login.
          </p>

          {error && (
            <div style={{
              marginTop: 14, padding: '10px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.30)',
              color: '#dc2626', fontSize: 12.5,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" onClick={onClose} style={ghostBtn} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" style={primaryBtn} disabled={submitting}>
              <Check size={14} /> {submitting ? 'Saving…' : 'Add New User'}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} maxWidth={620}>
      <form onSubmit={onSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: 'var(--kaf-text)' }}>
            Edit {initial!.username}
          </h3>
          <button type="button" onClick={onClose} style={iconBtn} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Username">
            <input
              value={username}
              disabled
              className="kaf-input"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="kaf-input" required
            />
          </Field>
          <Field label="Full name">
            <input
              value={fullName ?? ''}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
              className="kaf-input"
            />
          </Field>
          <Field label="User Security">
            <select
              className="kaf-input kaf-select"
              value={userSecurity}
              onChange={(e) => setUserSecurity(e.target.value as UserSecurityRole)}
              disabled={submitting}
            >
              {USER_SECURITY_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', height: 38 }}>
              <Toggle
                checked={isActive}
                onChange={setIsActive}
                disabled={submitting}
                label={isActive ? 'Active' : 'Disabled'}
              />
            </div>
          </Field>
        </div>

        <div style={{
          marginTop: 14, padding: '12px 14px', borderRadius: 10,
          background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.20)'
        }}>
          <Toggle
            checked={isSuperuser}
            onChange={setIsSuperuser}
            disabled={submitting}
            label="Superuser — bypasses all permission checks and can manage users"
          />
        </div>

        {!isSuperuser && (
          <div style={{ marginTop: 18 }}>
            <h4 style={{
              margin: '0 0 10px', fontSize: 12.5, color: 'var(--kaf-text)', opacity: 0.55,
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              Permissions
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PERMISSIONS.map((p) => (
                <label key={p.key} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--kaf-border-2)',
                  background: 'var(--kaf-surface-2)', cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={perms[p.key]}
                    onChange={(e) => setPerms({ ...perms, [p.key]: e.target.checked })}
                    disabled={submitting}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ color: 'var(--kaf-text)', fontSize: 12.5, fontWeight: 600 }}>
                      {p.label}
                    </div>
                    <div style={{ color: 'var(--kaf-muted-2)', fontSize: 11 }}>{p.hint}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{
          marginTop: 14, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.20)'
        }}>
          <Toggle
            checked={resetPassword}
            onChange={(v) => {
              setResetPassword(v);
              if (!v) { setPassword(''); setConfirmPassword(''); }
            }}
            disabled={submitting}
            label="Reset password — set a new password for this user"
          />
        </div>

        {passwordRequired && (
          <div style={{ marginTop: 14 }}>
            <h4 style={{
              margin: '0 0 10px', fontSize: 12.5, color: 'var(--kaf-text)', opacity: 0.55,
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              New password
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="New password">
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    className="kaf-input"
                    style={{ paddingRight: 40 }}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    required={passwordRequired}
                    minLength={8}
                  />
                  <button
                    type="button" tabIndex={-1}
                    onClick={() => setShowPassword((s) => !s)}
                    style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', color: 'var(--kaf-muted)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      padding: 6, borderRadius: 6,
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  className="kaf-input"
                  autoComplete="new-password"
                  placeholder="Re-enter the password"
                  required={passwordRequired}
                  minLength={8}
                />
              </Field>
            </div>
            <p style={{ marginTop: 8, color: 'var(--kaf-muted-2)', fontSize: 11.5 }}>
              They will be required to change this password on next login.
            </p>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 14, padding: '10px 12px', borderRadius: 8,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.30)',
            color: '#dc2626', fontSize: 12.5,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" onClick={onClose} style={ghostBtn} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" style={primaryBtn} disabled={submitting}>
            <Check size={14} /> {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block', marginBottom: 5, fontSize: 11, fontWeight: 600,
        color: 'var(--kaf-text)', opacity: 0.55,
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  checked, onChange, disabled, label,
}: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
    }}>
      <span style={{
        position: 'relative', width: 36, height: 20,
        borderRadius: 12, background: checked ? 'var(--kaf-purple)' : 'var(--kaf-surface-3, #2a2540)',
        transition: 'background .15s ease', flexShrink: 0,
      }}>
        <input
          type="checkbox" checked={checked} disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'inherit' }}
        />
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left .15s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </span>
      <span style={{ fontSize: 12.5, color: 'var(--kaf-text)' }}>{label}</span>
    </label>
  );
}

function Modal({ onClose, children, maxWidth = 520 }: {
  onClose: () => void; children: React.ReactNode; maxWidth?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, backdropFilter: 'blur(2px)',
      }}>
      <motion.div
        initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }} transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
          background: 'var(--kaf-surface-1)',
          border: '1px solid var(--kaf-border)',
          borderRadius: 14, padding: 22,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th style={{
      textAlign: align ?? 'left', padding: '12px 14px',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.4px',
      textTransform: 'uppercase', color: 'var(--kaf-muted)',
      borderBottom: '1px solid var(--kaf-border)', whiteSpace: 'nowrap',
    }}>{children}</th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td style={{
      padding: '12px 14px', textAlign: align ?? 'left',
      verticalAlign: 'middle', color: 'var(--kaf-text)'
    }}>
      {children}
    </td>
  );
}

function Badge({ color, bg, children }: {
  color: string; bg: string; children: React.ReactNode;
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 12,
      background: bg, color, fontSize: 11, fontWeight: 600,
    }}>{children}</span>
  );
}

function EmptyBlock({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '50px 16px', textAlign: 'center',
      color: 'var(--kaf-muted)', fontSize: 13,
    }}>{children}</div>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return <span style={{ color: 'var(--kaf-muted)' }}>—</span>;
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: string } | undefined)?.error
      ?? err.message;
  }
  return err instanceof Error ? err.message : 'Unexpected error';
}

// ── Inline styles ───────────────────────────────────────────────────────
const cardStyle: CSSProperties = {
  background: 'var(--kaf-surface)',
  border: '1px solid var(--kaf-border)',
  borderRadius: 12, overflow: 'hidden',
};

const primaryBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 14px', borderRadius: 10, border: 'none',
  background: 'linear-gradient(135deg, var(--kaf-purple) 0%, var(--kaf-purple-deep) 100%)',
  color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  boxShadow: '0 6px 20px rgba(147,51,234,0.30)',
};

const ghostBtn: CSSProperties = {
  padding: '9px 14px', borderRadius: 10,
  background: 'transparent',
  border: '1px solid var(--kaf-border-2)',
  color: 'var(--kaf-text)', fontSize: 12.5, cursor: 'pointer',
};

const iconBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 8,
  background: 'transparent', border: '1px solid var(--kaf-border-2)',
  color: 'var(--kaf-muted)', cursor: 'pointer',
  marginLeft: 4,
};

