import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, X } from 'lucide-react';
import { extractApiError } from '../../lib/httpClient';
import { useAuth } from '../../lib/auth';

export default function ChangePassword() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forced = !!user?.mustChangePassword;

  useEffect(() => {
    if (!forced) return;
    // Prevent the browser back button from leaving the forced change-password screen.
    const guard = () => {
      navigate('/change-password', { replace: true });
    };
    window.addEventListener('popstate', guard);
    return () => window.removeEventListener('popstate', guard);
  }, [forced, navigate]);

  useEffect(() => {
    if (user && !user.mustChangePassword && location.pathname === '/change-password') {
      navigate('/', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currentPassword) {
      setError('Current password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
    } catch (err) {
      setError(extractApiError(err, 'Failed to change password.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!forced) navigate('/', { replace: true });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--kaf-bg, #f3f4f6)',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        background: '#fff',
        border: '1px solid var(--kaf-border, #d1d5db)',
        borderRadius: 10,
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>
        {/* Title bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--kaf-surface, #f9f5fb)',
          borderBottom: '1px solid var(--kaf-border, #d1d5db)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <KeyRound size={18} color="var(--kaf-purple, #6b0f7a)" />
            <h1 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--kaf-purple, #6b0f7a)',
            }}>
              Change Password
            </h1>
          </div>
          {!forced && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--kaf-muted, #6b7280)',
                padding: 4,
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={onSubmit} style={{ padding: '28px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '18px 16px', alignItems: 'center' }}>
            <Label required>Login ID</Label>
            <input
              value={user?.username ?? ''}
              disabled
              className="kaf-input"
              style={{ background: '#f3f4f6' }}
            />

            <Label required>Current Password</Label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={submitting}
              className="kaf-input"
              required
            />

            <Label required>New Password</Label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={submitting}
              className="kaf-input"
              minLength={8}
              required
            />
          </div>

          <p style={{
            margin: '20px 0 0',
            fontSize: 12.5,
            color: 'var(--kaf-purple, #6b0f7a)',
          }}>
            If this is your first login, your current password is "Password".
          </p>

          {error && (
            <div style={{
              marginTop: 16,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.30)',
              color: '#dc2626',
              fontSize: 12.5,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '9px 18px',
                borderRadius: 6,
                border: 'none',
                background: 'var(--kaf-purple, #6b0f7a)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{
      fontSize: 13,
      color: 'var(--kaf-text, #111827)',
      fontWeight: 500,
    }}>
      {children}
      {required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
    </label>
  );
}
