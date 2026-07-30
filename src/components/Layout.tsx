import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Sun, Moon, LogOut, ShieldCheck, UserCog,
  UserPlus,
  Upload,
  Pencil,
  UserX,
  Users,
  PlusCircle,
  Building2,
  Building,
  FilePlus2, BadgeCheck, FileX2, Wallet,
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import type { PermissionKey } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  permission?: PermissionKey;
  superuserOnly?: boolean;
}
interface NavSection { title: string; items: NavItem[] }

const ALL_SECTIONS: NavSection[] = [
  {
    title: 'Invoicing & Top up Operations',
    items: [
      { to: '/billing/create-invoice', label: 'Create Invoice', icon: FilePlus2, permission: 'permCreateInvoice' },
      { to: '/billing/settle-invoice', label: 'Settle Invoice', icon: BadgeCheck, permission: 'permSettleInvoice' },
      { to: '/billing/cancel-invoice', label: 'Cancel Invoice', icon: FileX2, permission: 'permCancelInvoice' },
      { to: '/top-ups/add', label: 'Add Top Up', icon: Wallet, permission: 'permAddTopUp' },
      { to: '/top-ups/bulk', label: 'Bulk Top Up', icon: Upload, permission: 'permBulkTopUp' },
    ],
  },
  {
    title: 'System Management',
    items: [
      { to: '/users', label: 'User Management', icon: UserCog, superuserOnly: true },
      { to: '/employees/add', label: 'Add Employee', icon: UserPlus, superuserOnly: true },
      { to: '/employees/import', label: 'Import Employees', icon: Upload, superuserOnly: true },
      { to: '/employees/edit', label: 'Edit Existing Employee', icon: Pencil, superuserOnly: true },
      { to: '/employees/terminate', label: 'Terminate Employee', icon: UserX, superuserOnly: true },
      { to: '/employees/terminate-bulk', label: 'Terminate Employees in Bulk', icon: Users, superuserOnly: true },
      { to: '/contributions/add', label: 'Add New Contributions', icon: PlusCircle, superuserOnly: true },
      { to: '/contributions/edit', label: 'Edit Existing Contributions', icon: Pencil, superuserOnly: true },
      { to: '/companies/add', label: 'Add New Company', icon: Building2, superuserOnly: true },
      { to: '/companies/edit', label: 'Edit Existing Company', icon: Pencil, superuserOnly: true },
      { to: '/companies/terminate', label: 'Terminate Company', icon: Building, superuserOnly: true },
    ],
  },
];

export default function Layout() {
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, has } = useAuth();
  const isLight = theme === 'light';

  // Filter nav items by current user's permissions / superuser flag.
  const sections: NavSection[] = ALL_SECTIONS
    .map((s) => ({
      ...s,
      items: s.items.filter((it) => {
        if (it.superuserOnly) return user?.isSuperuser ?? false;
        if (it.permission) return has(it.permission);
        return true;
      }),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--kaf-bg)' }}>

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        style={{
          width: 256,
          flexShrink: 0,
          background: isLight
            ? 'linear-gradient(180deg, #ede4f7 0%, #ffffff 100%)'
            : 'linear-gradient(180deg, #0a0717 0%, var(--kaf-sidebar) 100%)',
          borderRight: isLight ? '1px solid rgba(107,2,125,0.12)' : '1px solid rgba(147,51,234,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Subtle glow at the top */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 180,
          background: 'radial-gradient(ellipse at 50% -20%, rgba(147,51,234,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{
          padding: '28px 20px 22px',
          borderBottom: isLight ? '1px solid rgba(107,2,125,0.12)' : '1px solid rgba(147,51,234,0.14)',
          textAlign: 'center',
          position: 'relative',
        }}>
          <a
            href="https://www.kaf.com.eg/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block' }}
          >
            <motion.img
              whileHover={isLight ? { scale: 1.08 } : { scale: 1.08, filter: 'brightness(1.15)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              src="https://cdn.prod.website-files.com/66cda1fb23a068f9c28860b2/66dc1d41973146c2ff7c3881_LOGO.avif"
              alt="KAF"
              style={{
                width: 42,
                filter: isLight
                  ? 'brightness(0) saturate(100%) invert(12%) sepia(97%) saturate(3984%) hue-rotate(291deg) brightness(80%) contrast(113%)'
                  : 'brightness(0) invert(1)',
                opacity: isLight ? 1 : 0.9,
              }}
            />
          </a>
          <p style={{
            color: isLight ? 'rgba(107,2,125,0.55)' : 'rgba(192,132,252,0.55)',
            fontSize: 9.5,
            textTransform: 'uppercase',
            letterSpacing: '2.8px',
            marginTop: 10,
            fontWeight: 700,
          }}>
            Rubix Pension
          </p>
        </div>

        {/* Nav */}
        <nav style={{ padding: '6px 12px', flex: 1 }}>
          {sections.map(({ title, items }, si) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + si * 0.06, duration: 0.3 }}
            >
              <p style={{
                color: isLight ? 'rgba(107,2,125,0.50)' : 'rgba(147,51,234,0.45)',
                fontSize: 9.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1.8px',
                padding: '18px 10px 6px',
              }}>
                {title}
              </p>
              {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    isActive ? 'kaf-nav-item kaf-nav-item--active' : 'kaf-nav-item'
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        background: isActive
                          ? 'linear-gradient(135deg, var(--kaf-purple) 0%, var(--kaf-purple-deep) 100%)'
                          : isLight ? 'rgba(107,2,125,0.08)' : 'rgba(147,51,234,0.14)',
                        borderRadius: 6,
                        flexShrink: 0,
                        transition: 'all .2s',
                        boxShadow: isActive ? '0 2px 8px rgba(147,51,234,0.35)' : 'none',
                      }}>
                        <Icon size={13} color={isActive ? '#fff' : isLight ? 'rgba(107,2,125,0.55)' : 'var(--kaf-muted)'} />
                      </span>
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </motion.div>
          ))}
        </nav>

        {/* User pill (logout + theme toggle) */}
        {user && (
          <div style={{
            margin: '10px 12px 0', padding: '10px 10px 10px 12px',
            borderRadius: 12,
            background: isLight ? 'rgba(107,2,125,0.05)' : 'rgba(147,51,234,0.08)',
            border: '1px solid var(--kaf-border-2)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--kaf-purple) 0%, var(--kaf-purple-deep) 100%)',
              color: '#fff', fontWeight: 700, fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {(user.fullName || user.username).slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: 'var(--kaf-text)', fontSize: 12, fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {user.fullName || user.username}
                {user.isSuperuser && (
                  <ShieldCheck size={11} style={{ color: 'var(--kaf-purple)', flexShrink: 0 }} />
                )}
              </div>
              <div style={{
                color: 'var(--kaf-muted-2)', fontSize: 10.5,
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                @{user.username}
              </div>
            </div>

            {/* Theme toggle (icon-only) */}
            <button
              onClick={toggle}
              title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-label="Toggle theme"
              style={iconActionBtn}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--kaf-purple)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--kaf-muted)'; }}
            >
              {isLight ? <Moon size={13} /> : <Sun size={13} />}
            </button>

            {/* Sign out */}
            <button
              onClick={() => { logout(); navigate('/login', { replace: true }); }}
              title="Sign out"
              aria-label="Sign out"
              style={iconActionBtn}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--kaf-muted)'; }}
            >
              <LogOut size={13} />
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '10px 18px 14px',
          marginTop: 10,
          borderTop: '1px solid var(--kaf-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--kaf-success)',
            boxShadow: '0 0 6px rgba(16,185,129,0.6)',
            flexShrink: 0,
          }} />
          <p style={{
            color: 'var(--kaf-muted-2)',
            fontSize: 10.5,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '.4px',
          }}>
            api · localhost:8081
          </p>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--kaf-bg)',
        position: 'relative',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ minHeight: '100%' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

const iconActionBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--kaf-border-2)',
  color: 'var(--kaf-muted)',
  cursor: 'pointer',
  width: 28, height: 28, borderRadius: 8,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
  transition: 'color .15s ease, border-color .15s ease',
};
