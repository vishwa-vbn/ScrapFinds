import { site } from '../config/site';
import { RecycleIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-gray-200/80 dark:border-slate-800 mt-20 pt-12 pb-28 sm:pb-12 text-sm text-[var(--muted)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
        {/* About */}
        <div className="space-y-2.5 max-w-md">
          <div className="flex items-center justify-center gap-2.5 font-bold text-base text-[var(--fg)]">
            <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 flex items-center justify-center">
              <RecycleIcon className="w-4 h-4" />
            </div>
            <span>{site.name}</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-[var(--muted)]">
            {site.tagline}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 pt-6 border-t border-gray-200/80 dark:border-slate-800 text-center text-xs text-[var(--muted)]">
        <p>© {currentYear} {site.name}. {t.footerNote}</p>
      </div>
    </footer>
  );
}
