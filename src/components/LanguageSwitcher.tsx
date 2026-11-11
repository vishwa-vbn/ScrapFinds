import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../config/translations';
import { ChevronDownIcon, GlobeIcon, CheckIcon } from './Icons';

interface LanguageSwitcherProps {
  className?: string;
}

const LANGUAGES: Array<{
  code: Language;
  label: string;
  nativeName: string;
}> = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिंदी' },
];

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLang(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Custom Designed Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select Language"
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800/80 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200/90 dark:border-slate-700/80 text-xs sm:text-sm font-semibold text-[var(--fg)] transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <GlobeIcon className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
        <span className="font-bold">{currentLang.nativeName}</span>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Custom Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Available Languages"
          className="absolute right-0 top-full mt-2 w-48 sm:w-52 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1.5 border-b border-gray-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Choose Language
          </div>

          <div className="pt-1 space-y-0.5">
            {LANGUAGES.map(l => {
              const isSelected = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(l.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-bold'
                      : 'text-[var(--fg)] hover:bg-gray-50 dark:hover:bg-slate-800/60 font-medium'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-semibold leading-tight">
                      {l.nativeName}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] leading-tight pt-0.5">
                      {l.label}
                    </span>
                  </div>

                  {isSelected && (
                    <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
