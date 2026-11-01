import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from './useAdminAuth';
import { strings } from '../../config/strings';
import { site } from '../../config/site';
import { LockIcon } from '../../components/Icons';

export function Login() {
  const { user, isAllowed, loading, errorMessage, signIn } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Add noindex
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');
  }, []);

  useEffect(() => {
    if (user && isAllowed) {
      navigate('/admin/items', { replace: true });
    }
  }, [user, isAllowed, navigate]);

  return (
    <div className="max-w-md mx-auto pt-16 pb-24 px-4 text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-lg">
        <LockIcon className="w-8 h-8 text-white" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--fg)] tracking-tight">
          {site.name} {strings.adminTitle}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)]">
          Owner Portal • Authorized access only for <span className="font-semibold text-green-600 dark:text-green-400">vishwabnaik12@gmail.com</span>
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs sm:text-sm text-red-700 dark:text-red-300 font-medium">
          {errorMessage}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-gray-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <button
          type="button"
          onClick={signIn}
          disabled={loading}
          className="w-full min-h-[50px] px-6 py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 cursor-pointer active:scale-[0.98]"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12.24 10.285V13.4h6.887C18.2 16.33 15.645 18.4 12.24 18.4c-3.535 0-6.4-2.865-6.4-6.4s2.865-6.4 6.4-6.4c1.782 0 3.39.735 4.545 1.92l2.39-2.39C17.65 3.54 15.11 2.4 12.24 2.4 6.915 2.4 2.6 6.715 2.6 12.04c0 5.325 4.315 9.64 9.64 9.64 5.565 0 9.27-3.915 9.27-9.44 0-.63-.06-1.25-.17-1.955H12.24z" />
          </svg>
          <span>{loading ? 'Connecting with Google…' : 'Sign in with Google'}</span>
        </button>

        <p className="text-[11px] text-[var(--muted)] pt-2 leading-relaxed">
          Google authentication enforces that only your pre-approved owner account can view or modify inventory, photos, and site information.
        </p>
      </div>
    </div>
  );
}
export default Login;
