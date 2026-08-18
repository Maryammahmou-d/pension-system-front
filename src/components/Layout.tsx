import { useEffect, useState } from 'react';
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
  ChevronDown,
  FileBarChart2,
  Zap,
  TrendingUp,
  CalendarClock,
  Scale,
  Banknote,
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { canAccess, PAGE_ROUTES } from '../lib/access';
import type { PageKey } from '../lib/access';

type IconType = typeof LayoutDashboard;

interface LinkedItem {
  kind: 'link';
  page: PageKey;
  to: string;
  label: string;
  icon: IconType;
  end?: boolean;
  labelLines?: string[];
}

interface PlaceholderAction {
  kind: 'placeholder';
  label: string;
  icon: IconType;
}

type NavItem = LinkedItem | PlaceholderAction;

/** Builds a nav entry whose path and role gate both come from `access.ts`. */
const link = (
  page: PageKey,
  label: string,
  icon: IconType,
  options?: { end?: boolean; labelLines?: string[] },
): LinkedItem => ({
  kind: 'link',
  page,
  to: PAGE_ROUTES[page],
  label,
  icon,
  ...options,
});

function NavItemLabel({ label, labelLines }: { label: string; labelLines?: string[] }) {
  const wrapStyle = {
    whiteSpace: 'normal' as const,
    lineHeight: 1.25,
    flex: 1,
    minWidth: 0,
  };

  if (labelLines?.length) {
    return (
      <span style={wrapStyle}>
        {labelLines.map((line) => (
          <span key={line} style={{ display: 'block' }}>{line}</span>
        ))}
      </span>
    );
  }

  return <span style={wrapStyle}>{label}</span>;
}

/** Access Actions order — linked pages + placeholders for not-yet-built screens. */
const ACTIONS_ITEMS: NavItem[] = [
  link('userManagement', 'User Management', UserCog),
  link('updateUnitPrice', 'Update Unit Price', TrendingUp),
  link('runMonthlyCharges', 'Run Monthly Charges', CalendarClock),
  link('hrBalanceDashboard', 'Run Balance Dashboard', LayoutDashboard),
  link('addCompany', 'Add New Company', Building2),
  link('editCompany', 'Edit Existing Company', Pencil),
  link('addContributions', 'Add New Contributions', PlusCircle),
  link('editContributions', 'Edit Existing Contributions', Pencil),
  link('addVestingRules', 'Add New Vesting Rules', Scale),
  link('editVestingRules', 'Edit Existing Vesting', Scale),
  link('addEmployee', 'Add New Employee', UserPlus),
  link('importEmployees', 'Import Employees', Upload),
  link('editEmployee', 'Edit Existing Employee', Pencil),
  link('createInvoice', 'Create Invoice', FilePlus2),
  link('settleInvoice', 'Settle Invoice', BadgeCheck),
  link('cancelInvoice', 'Cancel Invoice', FileX2),
  link('addTopUp', 'Add Top Up', Wallet),
  link('employeeFundsWithdrawal', 'Employee Funds Withdrawal', Banknote),
  link('terminateEmployee', 'Terminate Employee', UserX),
  link('terminateCompany', 'Terminate Company', Building),
  link('terminateEmployeesBulk', 'Terminate Employees in Bulk', Users),
  link('bulkTopUp', 'Top Up Employees in Bulk', Upload),
];

/** Access Reports order — implemented links + remaining placeholders. */
const REPORTS_ITEMS: NavItem[] = [
  link('viewUnitPrices', 'View Unit Prices', TrendingUp),
  link('unsettledInvoices', 'Unsettled Invoices', FileBarChart2),
  link('companyTransactions', 'Extract Company Transactions', FileBarChart2),
  link('employeeTransactions', 'Extract Employee Transactions', FileBarChart2),
  link('transactionsBetweenDates', 'Extract Transactions Between Dates', FileBarChart2),
  link('invoiceDetails', 'Extract Invoice Details', FileBarChart2),
  link('movementSummaryBetweenDates', 'Extract Movement Summary Between Dates', FileBarChart2),
  link('movementSummaryForDay', 'Extract Movement Summary for a day', FileBarChart2),
  link('companiesFunds', 'Extract Companies Funds', FileBarChart2),
  link('netCompanyFundsModifiedDate', 'Net Company Funds - Modified Date', FileBarChart2, {
    labelLines: ['Net Company Funds -', 'Modified Date'],
  }),
  link('netEmployeeFunds', 'Net Employee Funds', FileBarChart2),
  link('netFunds', 'Net Funds', FileBarChart2),
  link('netUnits', 'Net Units', FileBarChart2),
  link('estimateEmployeeTermination', 'Estimate Employee Termination', FileBarChart2),
  link('employeeExtractApp', 'Employee Extract for App', FileBarChart2),
  link('companyBalance', 'Generate Company Balance Reports', FileBarChart2),
  link('employeeBalance', 'Generate Employee Balance Report', FileBarChart2),
  link('employeeRecords', 'Extract Employee', FileBarChart2),
  link('aggregatedEmployeeBalance', 'Generate Aggregated Employee Balance Report', FileBarChart2),
];

export default function Layout() {
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isLight = theme === 'light';

  const visible = (it: NavItem) => it.kind === 'placeholder' || canAccess(user, it.page);

  const actionItems = ACTIONS_ITEMS.filter(visible);
  const reportItems = REPORTS_ITEMS.filter(visible);

  const isOnActionRoute = actionItems.some(
    (it) => it.kind === 'link' && (location.pathname === it.to || location.pathname.startsWith(it.to + '/')),
  );
  const isOnReportRoute = reportItems.some(
    (it) => it.kind === 'link' && (location.pathname === it.to || location.pathname.startsWith(it.to + '/')),
  );

  const [actionsOpen, setActionsOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(false);

  useEffect(() => {
    if (isOnActionRoute) setActionsOpen(true);
  }, [isOnActionRoute]);

  useEffect(() => {
    if (isOnReportRoute) setReportsOpen(true);
  }, [isOnReportRoute]);

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
        <nav style={{ padding: '10px 12px', flex: 1 }}>
          {actionItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <SectionToggle
                label="Actions"
                icon={Zap}
                open={actionsOpen}
                onToggle={() => setActionsOpen((v) => !v)}
                isLight={isLight}
              />
              <AnimatePresence initial={false}>
                {actionsOpen && (
                  <motion.div
                    key="actions-items"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden', paddingLeft: 4 }}
                  >
                    {actionItems.map((item) => {
                      if (item.kind === 'placeholder') {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.label}
                            className="kaf-nav-item"
                            title="Coming soon"
                            style={{
                              opacity: 0.45,
                              cursor: 'not-allowed',
                              pointerEvents: 'none',
                              userSelect: 'none',
                            }}
                            aria-disabled="true"
                          >
                            <span style={navIconWrap(false, isLight)}>
                              <Icon size={13} color={isLight ? 'rgba(107,2,125,0.4)' : 'var(--kaf-muted)'} />
                            </span>
                            <span style={{ whiteSpace: 'normal', lineHeight: 1.25, flex: 1, minWidth: 0 }}>
                              {item.label}
                            </span>
                          </div>
                        );
                      }

                      const { to, label, labelLines, icon: Icon, end } = item;
                      return (
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
                              <span style={navIconWrap(isActive, isLight)}>
                                <Icon size={13} color={isActive ? '#fff' : isLight ? 'rgba(107,2,125,0.55)' : 'var(--kaf-muted)'} />
                              </span>
                              <NavItemLabel label={label} labelLines={labelLines} />
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.16, duration: 0.3 }}
            style={{ marginTop: actionItems.length > 0 ? 6 : 0 }}
          >
            <SectionToggle
              label="Reports"
              icon={FileBarChart2}
              open={reportsOpen}
              onToggle={() => setReportsOpen((v) => !v)}
              isLight={isLight}
            />
            <AnimatePresence initial={false}>
              {reportsOpen && (
                <motion.div
                  key="reports-items"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden', paddingLeft: 4 }}
                >
                  {reportItems.map((item) => {
                    if (item.kind === 'placeholder') {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="kaf-nav-item"
                          title="Coming soon"
                          style={{
                            opacity: 0.45,
                            cursor: 'not-allowed',
                            pointerEvents: 'none',
                            userSelect: 'none',
                          }}
                          aria-disabled="true"
                        >
                          <span style={navIconWrap(false, isLight)}>
                            <Icon size={13} color={isLight ? 'rgba(107,2,125,0.4)' : 'var(--kaf-muted)'} />
                          </span>
                          <span style={{ whiteSpace: 'normal', lineHeight: 1.25, flex: 1, minWidth: 0 }}>
                            {item.label}
                          </span>
                        </div>
                      );
                    }

                    const { to, label, labelLines, icon: Icon } = item;
                    return (
                      <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                          isActive ? 'kaf-nav-item kaf-nav-item--active' : 'kaf-nav-item'
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span style={navIconWrap(isActive, isLight)}>
                              <Icon size={13} color={isActive ? '#fff' : isLight ? 'rgba(107,2,125,0.55)' : 'var(--kaf-muted)'} />
                            </span>
                            <NavItemLabel label={label} labelLines={labelLines} />
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
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

function SectionToggle({
  label,
  icon: Icon,
  open,
  onToggle,
  isLight,
}: {
  label: string;
  icon: typeof Zap;
  open: boolean;
  onToggle: () => void;
  isLight: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 10px',
        marginBottom: 2,
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        background: open
          ? (isLight ? 'rgba(107,2,125,0.10)' : 'rgba(147,51,234,0.16)')
          : 'transparent',
        color: isLight ? '#4a0160' : '#e9d5ff',
        fontSize: 12.5,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1.4px',
        transition: 'background .15s ease',
      }}
      onMouseEnter={(e) => {
        if (!open) {
          e.currentTarget.style.background = isLight
            ? 'rgba(107,2,125,0.06)'
            : 'rgba(147,51,234,0.10)';
        }
      }}
      onMouseLeave={(e) => {
        if (!open) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: 6,
        flexShrink: 0,
        background: open
          ? 'linear-gradient(135deg, var(--kaf-purple) 0%, var(--kaf-purple-deep) 100%)'
          : isLight ? 'rgba(107,2,125,0.08)' : 'rgba(147,51,234,0.14)',
        boxShadow: open ? '0 2px 8px rgba(147,51,234,0.35)' : 'none',
      }}>
        <Icon size={13} color={open ? '#fff' : isLight ? 'rgba(107,2,125,0.65)' : 'var(--kaf-muted)'} />
      </span>
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      <motion.span
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ display: 'inline-flex', color: isLight ? 'rgba(107,2,125,0.55)' : 'var(--kaf-muted)' }}
      >
        <ChevronDown size={14} />
      </motion.span>
    </button>
  );
}

function navIconWrap(isActive: boolean, isLight: boolean): React.CSSProperties {
  return {
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
  };
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

