import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import axios from 'axios';

export default function Login() {
  const { user, login } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isLight = theme === 'light';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already authenticated → bounce to where they were headed (or dashboard).
  useEffect(() => {
    if (user) {
      const target = user.mustChangePassword
        ? '/change-password'
        : (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
      navigate(target, { replace: true });
    }
  }, [user, navigate, location.state]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter your username/email and password');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const u = await login({ identifier: identifier.trim(), password });
      navigate(u.mustChangePassword ? '/change-password' : '/', { replace: true });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? err.message)
        : (err instanceof Error ? err.message : 'Login failed');
      setError(typeof msg === 'string' ? msg : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--kaf-bg)',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 20% 0%, rgba(147,51,234,0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(107,2,125,0.14) 0%, transparent 55%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          background: 'var(--kaf-surface)',
          border: '1px solid var(--kaf-border)',
          borderRadius: 16,
          padding: '32px 28px',
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

        {/* Header — KAF logo (theme-aware: brand-purple in light, white in dark) */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.img
            src="https://cdn.prod.website-files.com/66cda1fb23a068f9c28860b2/66dc1d41973146c2ff7c3881_LOGO.avif"
            alt="KAF"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={isLight ? { scale: 1.08 } : { scale: 1.08, filter: 'brightness(1.15)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              width: 36, height: 'auto', display: 'block',
              margin: '0 auto 16px',
              filter: isLight
                ? 'brightness(0) saturate(100%) invert(12%) sepia(97%) saturate(3984%) hue-rotate(291deg) brightness(80%) contrast(113%)'
                : 'brightness(0) invert(1)',
              opacity: isLight ? 1 : 0.92,
            }}
          />
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: 'var(--kaf-text)',
            letterSpacing: '-0.015em', margin: 0,
          }}>
            KAF Rubix Pension
          </h1>
          <p style={{
            marginTop: 8, color: 'var(--kaf-muted)', fontSize: 12.5,
            textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600,
          }}>
            Sign in to continue
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Username or email</label>
            <input
              type="text"
              autoFocus
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={submitting}
              className="kaf-input"
              placeholder="Enter your username or email"
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="kaf-input"
                style={{ paddingRight: 40 }}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', color: 'var(--kaf-muted)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: 6, borderRadius: 6,
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

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
              marginTop: 6,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 14px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, var(--kaf-purple) 0%, var(--kaf-purple-deep) 100%)',
              color: '#fff', fontSize: 13.5, fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              boxShadow: '0 6px 20px rgba(147,51,234,0.30)',
              transition: 'transform .12s ease, box-shadow .2s ease',
            }}
          >
            <LogIn size={15} />
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{
          marginTop: 22, paddingTop: 16,
          borderTop: '1px solid var(--kaf-border)',
          textAlign: 'center',
        }}>
          <p style={{
            color: 'var(--kaf-muted-2)', fontSize: 11, lineHeight: 1.6,
            margin: 0,
          }}>
            Demo logins: admin/admin · ops/ops · crm/crm · tech/tech
          </p>
        </div>
      </motion.div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 6,
  fontSize: 11.5, fontWeight: 600,
  color: 'var(--kaf-muted)',
  textTransform: 'uppercase', letterSpacing: '0.5px',
};

