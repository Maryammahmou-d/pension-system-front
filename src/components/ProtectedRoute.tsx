import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { PermissionKey } from '../types';

interface Props {
  children: ReactNode;
  /**
   * If provided, the current user must have this permission (or be a superuser).
   * Otherwise they're redirected to the dashboard.
   */
  permission?: PermissionKey;
  /** Restrict to superusers only — used for the user management page. */
  superuserOnly?: boolean;
}

export default function ProtectedRoute({ children, permission, superuserOnly }: Props) {
  const { user, loading, has } = useAuth();
  const location = useLocation();

  // Wait for the initial /me check before deciding.
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', color: 'var(--kaf-muted)',
        fontFamily: 'var(--font-sans)', fontSize: 14,
      }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Force the user through the change-password flow until they comply.
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (superuserOnly && !user.isSuperuser) {
    return <Navigate to="/" replace />;
  }

  if (permission && !has(permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
