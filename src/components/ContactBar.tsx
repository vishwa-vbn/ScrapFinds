import { site } from '../config/site';
import { telHref, waHref } from '../lib/links';
import { PhoneCallIcon, WhatsAppIcon, RecycleIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';

export function ContactBar() {
  const { t } = useLanguage();

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2.5 font-bold text-base sm:text-lg text-[var(--fg)]">
            <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-950/70 text-green-700 dark:text-green-300 flex items-center justify-center shrink-0">
              <RecycleIcon className="w-4 h-4" />
            </div>
            <span>{site.name} {t.directContact}</span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
            {site.tagline}. Call or WhatsApp us directly to collect items or sell scrap.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2 lg:pt-0">
          <a
            href={telHref()}
            className="min-h-[46px] px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-center inline-flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            title={`Call Primary: ${site.phoneDisplay}`}
          >
            <PhoneCallIcon className="w-4 h-4" />
            <span>{t.callUs}: {site.phoneDisplay}</span>
          </a>
          <a
            href={telHref(site.altPhoneE164)}
            className="min-h-[46px] px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[var(--fg)] font-semibold rounded-xl text-center inline-flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 transition-all active:scale-[0.98]"
            title={`Call Alternative: ${site.altPhoneDisplay}`}
          >
            <PhoneCallIcon className="w-4 h-4 text-green-600" />
            <span>Alt: {site.altPhoneDisplay}</span>
          </a>
          <a
            href={waHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[46px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-center inline-flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>{t.whatsapp}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
