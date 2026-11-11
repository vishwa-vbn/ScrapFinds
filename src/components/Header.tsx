import { Link, useLocation } from 'react-router-dom';
import { site } from '../config/site';
import { RecycleIcon } from './Icons';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-b border-gray-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand: Logo & Name */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold text-lg sm:text-xl tracking-tight text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-green-500 rounded-xl p-1 -ml-1 transition-transform active:scale-95 min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <RecycleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="truncate font-extrabold tracking-tight">{site.name}</span>
        </Link>

        {/* Right: Custom Designed Language Dropdown Menu */}
        {!isAdmin && <LanguageSwitcher />}
      </div>
    </header>
  );
}
