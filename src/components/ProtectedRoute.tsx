import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { canAccess } from '../lib/access';
import type { PageKey } from '../lib/access';

interface Props {
  children: ReactNode;
  /**
   * Page being guarded. The current user must be allowed it by the access
   * matrix in `access.ts` (Admins bypass); otherwise they're sent to `/`.
   * Omit for routes any signed-in user may open (e.g. change-password).
   */
  page?: PageKey;
}

export default function ProtectedRoute({ children, page }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (page && !canAccess(user, page)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
