import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { site } from '../config/site';
import { getRepo } from '../lib/repo';
import type { Item } from '../types/item';
import { ItemCard } from '../components/ItemCard';
import { ItemGrid } from '../components/ItemGrid';
import { ItemCardSkeleton } from '../components/Skeleton';
import { CallButton } from '../components/CallButton';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { ContactBar } from '../components/ContactBar';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import { RecycleIcon, ArrowRightIcon, CheckIcon, PackageIcon, PhoneCallIcon } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';
import { PullToRefresh } from '../components/PullToRefresh';

export function Home() {
  const { t, getScrapItems } = useLanguage();
  useDocumentMeta(undefined, site.tagline);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeatured = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) setLoading(true);
      const repo = await getRepo();
      const res = await repo.list({ forceRefresh });
      setItems(res.items.slice(0, 6));
    } catch (err) {
      console.error('Failed to load items for home:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeatured(false);
  }, [loadFeatured]);

  const scrapList = getScrapItems();

  return (
    <PullToRefresh onRefresh={() => loadFeatured(true)} isRefreshing={loading}>
      <div className="space-y-16 sm:space-y-20 pb-16">
      {/* Hero Section */}
      <section className="text-center pt-6 sm:pt-10 pb-4 max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-green-200/80 dark:border-green-800 text-xs font-semibold shadow-2xs">
          <RecycleIcon className="w-3.5 h-3.5" />
          <span>{t.homeBadge}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[var(--fg)] tracking-tight leading-[1.15]">
          {t.homeTitle}
        </h1>

        <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed max-w-2xl mx-auto">
          {t.homeSubtitle}
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
          <CallButton variant="primary" label={t.callUs} className="shadow-sm text-base px-6 py-3" />
          <WhatsAppButton variant="secondary" label={t.whatsapp} className="text-base px-6 py-3" />
        </div>
      </section>

      {/* Available Now Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)] tracking-tight">
              {t.availableNow}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] pt-1">
              {t.availableSubtitle}
            </p>
          </div>
          <Link
            to="/items"
            className="text-sm font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>{t.seeAll}</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <ItemGrid>
            {Array.from({ length: 6 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </ItemGrid>
        ) : items.length > 0 ? (
          <ItemGrid>
            {items.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </ItemGrid>
        ) : (
          <div className="text-center py-12 text-[var(--muted)] text-sm bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8">
            <PackageIcon className="w-8 h-8 mx-auto mb-2 text-[var(--muted)] opacity-60" />
            <p>{t.noItemsDesc}</p>
          </div>
        )}

        <div className="text-center pt-4">
          <Link
            to="/items"
            className="inline-flex items-center justify-center min-h-[46px] px-8 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/80 text-[var(--fg)] font-bold text-sm transition-all shadow-xs gap-2"
          >
            <span>{t.seeAll}</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* How it Works */}
      <section className="space-y-8 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-xs">
        <div className="text-center max-w-lg mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)] tracking-tight">
            {t.howItWorks}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            {t.howItWorksSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 font-black text-lg flex items-center justify-center shadow-xs">
              1
            </div>
            <h3 className="font-bold text-base text-[var(--fg)]">{t.step1}</h3>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              {t.step1Desc}
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 font-black text-lg flex items-center justify-center shadow-xs">
              2
            </div>
            <h3 className="font-bold text-base text-[var(--fg)]">{t.step2}</h3>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              {t.step2Desc}
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 font-black text-lg flex items-center justify-center shadow-xs">
              3
            </div>
            <h3 className="font-bold text-base text-[var(--fg)]">{t.step3}</h3>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              {t.step3Desc}
            </p>
          </div>
        </div>
      </section>

      {/* We Collect Scrap Section */}
      <section className="bg-gradient-to-br from-green-50 via-emerald-50/60 to-green-100/40 dark:from-green-950/40 dark:via-emerald-950/20 dark:to-slate-900 rounded-3xl border border-green-200/80 dark:border-green-800/60 p-6 sm:p-10 space-y-6">
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-600/10 text-green-800 dark:text-green-300 text-xs font-bold">
            <RecycleIcon className="w-3.5 h-3.5" />
            <span>{t.sellToUsBadge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-green-950 dark:text-green-200 tracking-tight">
            {t.weCollectTitle}
          </h2>
          <p className="text-xs sm:text-sm text-green-900/80 dark:text-green-300/80 leading-relaxed">
            {t.weCollectSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {scrapList.map((item, i) => (
            <div
              key={i}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-3.5 border border-green-200/80 dark:border-green-800/40 text-xs sm:text-sm font-semibold text-[var(--fg)] flex items-center gap-3 shadow-2xs"
            >
              <div className="w-6 h-6 rounded-lg bg-green-100 dark:bg-green-950/70 text-green-700 dark:text-green-300 flex items-center justify-center shrink-0">
                <CheckIcon className="w-3.5 h-3.5" />
              </div>
              <span className="leading-snug">{item}</span>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <CallButton variant="primary" label={t.callToSell} className="shadow-sm" />
        </div>
      </section>

      {/* Contact & Map Card */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 flex items-center justify-center">
            <PhoneCallIcon className="w-4 h-4" />
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--fg)] tracking-tight">{t.contactUs}</h2>
        </div>
        <ContactBar />
      </section>
    </div>
    </PullToRefresh>
  );
}
