import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';

export default function ChangePassword() {
  const { user, changePassword, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forced = !!user?.mustChangePassword;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      navigate('/', { replace: true });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? err.message)
        : 'Failed to change password';
      setError(typeof msg === 'string' ? msg : 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--kaf-bg)', padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'relative',
          width: '100%', maxWidth: 460,
          background: 'var(--kaf-surface)',
          border: '1px solid var(--kaf-border)',
          borderRadius: 16, padding: '30px 28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Theme toggle — top right */}
        <button
          type="button"
          onClick={toggle}
          aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 32, height: 32, borderRadius: 8,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            border: '1px solid var(--kaf-border-2)',
            color: 'var(--kaf-muted)',
            cursor: 'pointer',
            transition: 'color .15s ease, border-color .15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--kaf-purple)';
            e.currentTarget.style.borderColor = 'var(--kaf-purple-border)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--kaf-muted)';
            e.currentTarget.style.borderColor = 'var(--kaf-border-2)';
          }}
        >
          {isLight ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <motion.img
            src="https://cdn.prod.website-files.com/66cda1fb23a068f9c28860b2/66dc1d41973146c2ff7c3881_LOGO.avif"
            alt="KAF"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={isLight ? { scale: 1.08 } : { scale: 1.08, filter: 'brightness(1.15)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              width: 34, height: 'auto', display: 'block',
              margin: '0 auto 14px',
              filter: isLight
                ? 'brightness(0) saturate(100%) invert(12%) sepia(97%) saturate(3984%) hue-rotate(291deg) brightness(80%) contrast(113%)'
                : 'brightness(0) invert(1)',
              opacity: isLight ? 1 : 0.92,
            }}
          />
          <h1 style={{ fontSize: 19, fontWeight: 700, color: 'var(--kaf-text)', margin: 0 }}>
            {forced ? 'Set a new password' : 'Change password'}
          </h1>
          <p style={{ marginTop: 8, color: 'var(--kaf-muted)', fontSize: 12.5, lineHeight: 1.5 }}>
            {forced
              ? 'Your account was created with a temporary password. Please choose a new one to continue.'
              : <>Signed in as <span style={{ color: 'var(--kaf-text)', fontWeight: 600 }}>{user?.username ?? ''}</span></>}
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label={forced ? 'Temporary password' : 'Current password'}>
            <input
              type="password" autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="kaf-input" disabled={submitting} required
            />
          </Field>

          <Field label="New password">
            <input
              type="password" autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="kaf-input" disabled={submitting} required
              minLength={8}
            />
          </Field>

          <Field label="Confirm new password">
            <input
              type="password" autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="kaf-input" disabled={submitting} required
              minLength={8}
            />
          </Field>

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.30)',
              color: '#dc2626', fontSize: 12.5,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 4, padding: '11px 14px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, var(--kaf-purple) 0%, var(--kaf-purple-deep) 100%)',
              color: '#fff', fontSize: 13.5, fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              boxShadow: '0 6px 20px rgba(147,51,234,0.30)',
            }}
          >
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </form>

        <button
          onClick={() => { logout(); navigate('/login', { replace: true }); }}
          style={{
            marginTop: 18, width: '100%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 8,
            background: 'transparent',
            border: '1px solid var(--kaf-border-2)',
            color: 'var(--kaf-muted)',
            fontSize: 12, cursor: 'pointer',
          }}
        >
          <LogOut size={13} /> Sign out
        </button>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block', marginBottom: 6,
        fontSize: 11.5, fontWeight: 600, color: 'var(--kaf-muted)',
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>{label}</label>
      {children}
    </div>
  );
}

