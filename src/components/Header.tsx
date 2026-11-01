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
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-gray-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-3 font-bold text-lg sm:text-xl tracking-tight text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-green-500 rounded-xl p-1 -ml-1 transition-transform active:scale-95 shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-sm">
            <RecycleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="truncate font-extrabold">{site.name}</span>
        </Link>

        {/* Language Switcher & Nav links + Call button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isAdmin && <LanguageSwitcher />}

          <nav aria-label={t.mainNav} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold">
            <Link
              to="/items"
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all whitespace-nowrap ${
                location.pathname === '/items'
                  ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300'
                  : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.seeAll}
            </Link>
          </nav>

          <CallButton variant="icon" />
        </div>
      </div>
    </header>
  );
}
