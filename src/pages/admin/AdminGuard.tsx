import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from './useAdminAuth';

export function AdminGuard() {
  const { user, isAllowed, loading } = useAdminAuth();

  useEffect(() => {
    // Add noindex meta tag for admin pages
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');

    return () => {
      if (meta) {
        meta.setAttribute('content', 'index, follow');
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!user || !isAllowed) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
