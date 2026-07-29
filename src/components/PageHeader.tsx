import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Optional right-side actions (buttons, etc.) */
  actions?: ReactNode;
}

/**
 * Standard page header used across the app: a gradient purple square holding a Lucide icon,
 * followed by the page title + subtitle, with an optional actions slot on the right.
 */
export default function PageHeader({ icon: Icon, title, subtitle, actions }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 24,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--kaf-purple) 0%, var(--kaf-purple-deep) 100%)',
          boxShadow: '0 8px 22px rgba(147,51,234,0.30)',
          flexShrink: 0,
        }}>
          <Icon size={20} color="#fff" />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1 className="kaf-page-title" style={{ margin: 0 }}>
            {title}
          </h1>
          {subtitle && (
            <p className="kaf-page-sub" style={{ marginTop: 4 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
