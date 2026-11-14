import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--text-mute)' }}>
        <div className="animate-pulse text-sm tracking-[0.2em] uppercase">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}
