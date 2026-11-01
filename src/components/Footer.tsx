import { site } from '../config/site';
import { telHref, waHref } from '../lib/links';
import { RecycleIcon, PhoneCallIcon, WhatsAppIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-gray-200/80 dark:border-slate-800 mt-20 pt-12 pb-28 sm:pb-12 text-sm text-[var(--muted)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-8">
        {/* About */}
        <div className="space-y-2.5 max-w-md">
          <div className="flex items-center gap-2.5 font-bold text-base text-[var(--fg)]">
            <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 flex items-center justify-center">
              <RecycleIcon className="w-4 h-4" />
            </div>
            <span>{site.name}</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-[var(--muted)]">
            {site.tagline}
          </p>
        </div>

        {/* Direct Contact */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--fg)]">
            {t.directContact}
          </h4>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 text-xs sm:text-sm">
            <a
              href={telHref()}
              className="font-semibold text-[var(--fg)] hover:text-green-600 transition-colors flex items-center gap-2.5 p-2 px-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800"
            >
              <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 flex items-center justify-center shrink-0">
                <PhoneCallIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block leading-none">{site.phoneDisplay}</span>
                <span className="text-[10px] text-[var(--muted)] font-normal">Primary</span>
              </div>
            </a>
            <a
              href={telHref(site.altPhoneE164)}
              className="font-semibold text-[var(--fg)] hover:text-green-600 transition-colors flex items-center gap-2.5 p-2 px-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800"
            >
              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 text-[var(--fg)] flex items-center justify-center shrink-0">
                <PhoneCallIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="block leading-none">{site.altPhoneDisplay}</span>
                <span className="text-[10px] text-[var(--muted)] font-normal">Alternative</span>
              </div>
            </a>
            <a
              href={waHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition-colors flex items-center gap-2.5 p-2 px-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <WhatsAppIcon className="w-3.5 h-3.5" />
              </div>
              <span>{t.whatsappUs}</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 pt-6 border-t border-gray-200/80 dark:border-slate-800 text-center text-xs text-[var(--muted)]">
        <p>© {currentYear} {site.name}. {t.footerNote}</p>
      </div>
    </footer>
  );
}
