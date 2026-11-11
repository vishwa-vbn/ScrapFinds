import { Link, useLocation } from 'react-router-dom';
import { site } from '../config/site';
import { CallButton } from './CallButton';
import { RecycleIcon } from './Icons';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

export function Header() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-b border-gray-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 font-bold text-base sm:text-xl tracking-tight text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-green-500 rounded-xl p-1 -ml-1 transition-transform active:scale-95 min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <RecycleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="truncate font-extrabold tracking-tight">{site.name}</span>
        </Link>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Desktop/Tablet Navigation Links */}
          <nav aria-label={t.mainNav} className="hidden sm:flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-xl transition-all ${
                location.pathname === '/'
                  ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300'
                  : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.home}
            </Link>
            <Link
              to="/items"
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                location.pathname.startsWith('/items')
                  ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300'
                  : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.seeAll}
            </Link>
          </nav>

          {/* Language Switcher (responsive: compact on mobile, segmented pills on desktop) */}
          {!isAdmin && <LanguageSwitcher />}

          {/* Quick Call Button */}
          <CallButton variant="icon" className="shrink-0" />
        </div>
      </div>
    </header>
  );
}
