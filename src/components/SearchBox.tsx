import { useLanguage } from '../context/LanguageContext';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  className = '',
}: SearchBoxProps) {
  const { t } = useLanguage();
  const actualPlaceholder = placeholder || t.search;

  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--muted)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={actualPlaceholder}
        aria-label={actualPlaceholder}
        className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] rounded-xl text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted)] hover:text-[var(--fg)] focus:outline-none"
        >
          <span className="text-base font-bold">×</span>
        </button>
      )}
    </div>
  );
}
