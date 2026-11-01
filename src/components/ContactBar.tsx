import { site } from '../config/site';
import { mapsHref, telHref, waHref } from '../lib/links';
import { MapPinIcon, PhoneCallIcon, WhatsAppIcon, ExternalLinkIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';

export function ContactBar() {
  const { t } = useLanguage();

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-xl">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 flex items-center justify-center shrink-0 mt-0.5">
              <MapPinIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--fg)] leading-snug">
                {site.address}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] pt-1">
                <span className="font-semibold text-[var(--fg)]">{t.operatingHours}:</span> {site.hours}
              </p>
            </div>
          </div>

          <div className="pt-1 pl-12">
            <a
              href={mapsHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 hover:underline"
            >
              <span>Get Directions on Google Maps</span>
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2 lg:pt-0">
          <a
            href={telHref()}
            className="min-h-[46px] px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-center inline-flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            title={`Call Primary: ${site.phoneDisplay}`}
          >
            <PhoneCallIcon className="w-4 h-4" />
            <span>{t.callUs}</span>
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
