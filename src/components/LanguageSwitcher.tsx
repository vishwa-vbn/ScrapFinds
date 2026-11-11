import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../config/translations';
import { ChevronDownIcon, GlobeIcon } from './Icons';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'auto' | 'pills' | 'select' | 'compact';
}

const LANGUAGES: Array<{ code: Language; label: string; nativeName: string; short: string }> = [
  { code: 'en', label: 'English', nativeName: 'English', short: 'EN' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ', short: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिंदी', short: 'हिंदी' },
];

export function LanguageSwitcher({ className = '', variant = 'auto' }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();
  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  // Compact trigger with invisible native overlay select (ideal for mobile, zero layout overflow)
  const renderCompact = (extraClass = '') => (
    <div className={`relative inline-flex items-center ${extraClass}`}>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200/90 dark:border-slate-700/80 text-xs font-bold text-[var(--fg)] shadow-2xs pointer-events-none transition-colors">
        <GlobeIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
        <span className="truncate max-w-[50px]">{currentLang.short}</span>
        <ChevronDownIcon className="w-3 h-3 text-[var(--muted)] shrink-0 opacity-70" />
      </div>
      <select
        value={lang}
        onChange={e => setLang(e.target.value as Language)}
        aria-label="Select Language"
        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer text-base"
      >
        {LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>
            {l.nativeName} ({l.label})
          </option>
        ))}
      </select>
    </div>
  );

  // Segmented pills (ideal for desktop / wider screens)
  const renderPills = (extraClass = '') => (
    <div
      role="group"
      aria-label="Language selector"
      className={`inline-flex items-center p-1 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 shadow-2xs ${extraClass}`}
    >
      {LANGUAGES.map(l => {
        const isActive = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={isActive}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isActive
                ? 'bg-green-600 text-white shadow-xs scale-102'
                : 'text-[var(--muted)] hover:text-[var(--fg)] hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
            }`}
            title={l.label}
          >
            {l.nativeName}
          </button>
        );
      })}
    </div>
  );

  if (variant === 'compact') {
    return renderCompact(className);
  }

  if (variant === 'pills') {
    return renderPills(className);
  }

  if (variant === 'select') {
    return (
      <div className={`relative inline-block ${className}`}>
        <select
          value={lang}
          onChange={e => setLang(e.target.value as Language)}
          aria-label="Select Language"
          className="appearance-none bg-gray-100 dark:bg-slate-800 text-[var(--fg)] text-xs font-bold py-1.5 pl-3 pr-7 rounded-xl border border-gray-200 dark:border-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>
              {l.nativeName}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-60 text-[var(--fg)]" />
      </div>
    );
  }

  // Default 'auto': compact on mobile (<sm), segmented pills on sm and up
  return (
    <div className={`inline-flex items-center ${className}`}>
      {renderCompact('sm:hidden')}
      {renderPills('hidden sm:inline-flex')}
    </div>
  );
}
