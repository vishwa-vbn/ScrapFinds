import { Link, useLocation } from 'react-router-dom';
import { telHref, waHref } from '../lib/links';
import { HomeIcon, PackageIcon, PhoneCallIcon, WhatsAppIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';

export function MobileBottomNav() {
  const location = useLocation();
  const { t } = useLanguage();

  // Hide on item detail (has its own sticky action bar) or admin pages
  if (location.pathname.startsWith('/item/') || location.pathname.startsWith('/admin')) {
    return null;
  }

  const isHome = location.pathname === '/';
  const isItems = location.pathname.startsWith('/items');

  return (
    <nav
      aria-label="Mobile Navigation"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200/90 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-transform duration-200"
    >
      <div className="grid grid-cols-4 h-16 items-center px-2">
        {/* Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all ${
            isHome
              ? 'text-green-600 dark:text-green-400 font-bold'
              : 'text-[var(--muted)] hover:text-[var(--fg)] font-medium'
          }`}
        >
          <div
            className={`p-1 rounded-lg transition-transform ${
              isHome ? 'scale-110 bg-green-50 dark:bg-green-950/60' : ''
            }`}
          >
            <HomeIcon className="w-5 h-5" />
          </div>
          <span className="text-[11px] leading-none">{t.home}</span>
        </Link>

        {/* Browse Items */}
        <Link
          to="/items"
          className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all ${
            isItems
              ? 'text-green-600 dark:text-green-400 font-bold'
              : 'text-[var(--muted)] hover:text-[var(--fg)] font-medium'
          }`}
        >
          <div
            className={`p-1 rounded-lg transition-transform ${
              isItems ? 'scale-110 bg-green-50 dark:bg-green-950/60' : ''
            }`}
          >
            <PackageIcon className="w-5 h-5" />
          </div>
          <span className="text-[11px] leading-none">{t.browse}</span>
        </Link>

        {/* Quick Call */}
        <a
          href={telHref()}
          className="flex flex-col items-center justify-center gap-1 py-1 text-green-700 dark:text-green-400 font-bold active:scale-95 transition-transform"
          aria-label={t.callUs}
        >
          <div className="w-10 h-10 -mt-2 rounded-full bg-gradient-to-tr from-green-600 to-emerald-500 text-white flex items-center justify-center shadow-md">
            <PhoneCallIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-[11px] leading-none">{t.callUs}</span>
        </a>

        {/* WhatsApp */}
        <a
          href={waHref()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 py-1 text-[var(--muted)] hover:text-emerald-600 dark:hover:text-emerald-400 font-medium active:scale-95 transition-transform"
          aria-label={t.whatsappUs}
        >
          <div className="p-1 rounded-lg">
            <WhatsAppIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-[11px] leading-none">{t.whatsappUs}</span>
        </a>
      </div>
    </nav>
  );
}
