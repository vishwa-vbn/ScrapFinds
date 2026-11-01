import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../config/translations';
import { ChevronDownIcon } from './Icons';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'pills' | 'select';
}

const LANGUAGES: Array<{ code: Language; label: string; nativeName: string }> = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिंदी' },
];

export function LanguageSwitcher({ className = '', variant = 'pills' }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();

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

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`inline-flex items-center p-1 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 shadow-2xs ${className}`}
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
}

