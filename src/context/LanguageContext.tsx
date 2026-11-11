import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { translations, type Language, type Translations } from '../config/translations';
import type { Item } from '../types/item';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  getCategoryLabel: (categoryId: string) => string;
  getConditionLabel: (condition: string) => string;
  getStatusLabel: (status: string) => string;
  getScrapItems: () => string[];
  getItemTitle: (item: Item) => string;
  getItemDescription: (item: Item) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('sh:app_lang');
      if (saved === 'kn' || saved === 'hi' || saved === 'en') {
        return saved;
      }
    } catch {
      /* ignore */
    }
    return 'en';
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('sh:app_lang', newLang);
      document.documentElement.lang = newLang;
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      /* ignore */
    }
  }, [lang]);

  const t = useMemo(() => translations[lang] || translations.en, [lang]);

  const getCategoryLabel = useCallback(
    (categoryId: string): string => {
      switch (categoryId) {
        case 'audio':
          return t.catAudio;
        case 'phones':
          return t.catPhones;
        case 'bicycles':
          return t.catBicycles;
        case 'electronics':
          return t.catElectronics;
        case 'appliances':
          return t.catAppliances;
        case 'tools':
          return t.catTools;
        default:
          return categoryId;
      }
    },
    [t]
  );

  const getConditionLabel = useCallback(
    (condition: string): string => {
      switch (condition) {
        case 'like_new':
          return t.conditionLikeNew;
        case 'good':
          return t.conditionGood;
        case 'fair':
          return t.conditionFair;
        case 'needs_repair':
          return t.conditionNeedsRepair;
        default:
          return condition;
      }
    },
    [t]
  );

  const getStatusLabel = useCallback(
    (status: string): string => {
      switch (status) {
        case 'available':
          return t.statusAvailable;
        case 'reserved':
          return t.statusReserved;
        case 'sold':
          return t.statusSold;
        default:
          return status;
      }
    },
    [t]
  );

  const getScrapItems = useCallback((): string[] => {
    return [
      t.scrapNewspaper,
      t.scrapCardboard,
      t.scrapIron,
      t.scrapCopper,
      t.scrapAluminium,
      t.scrapPlastic,
      t.scrapEwaste,
    ];
  }, [t]);

  // Localized Item Title helper
  const getItemTitle = useCallback(
    (item: Item): string => {
      if (!item) return '';
      if (lang === 'kn' && item.translations?.kn?.title) {
        return item.translations.kn.title;
      }
      if (lang === 'hi' && item.translations?.hi?.title) {
        return item.translations.hi.title;
      }
      return item.title;
    },
    [lang]
  );

  // Localized Item Description helper
  const getItemDescription = useCallback(
    (item: Item): string => {
      if (!item) return '';
      if (lang === 'kn' && item.translations?.kn?.description) {
        return item.translations.kn.description;
      }
      if (lang === 'hi' && item.translations?.hi?.description) {
        return item.translations.hi.description;
      }
      return item.description;
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      getCategoryLabel,
      getConditionLabel,
      getStatusLabel,
      getScrapItems,
      getItemTitle,
      getItemDescription,
    }),
    [lang, setLang, t, getCategoryLabel, getConditionLabel, getStatusLabel, getScrapItems, getItemTitle, getItemDescription]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: 'en',
      setLang: () => {},
      t: translations.en,
      getCategoryLabel: (id: string) => id,
      getConditionLabel: (c: string) => c,
      getStatusLabel: (s: string) => s,
      getScrapItems: () => [
        translations.en.scrapNewspaper,
        translations.en.scrapCardboard,
        translations.en.scrapIron,
        translations.en.scrapCopper,
        translations.en.scrapAluminium,
        translations.en.scrapPlastic,
        translations.en.scrapEwaste,
      ],
      getItemTitle: (item: Item) => item?.title || '',
      getItemDescription: (item: Item) => item?.description || '',
    };
  }
  return ctx;
}
