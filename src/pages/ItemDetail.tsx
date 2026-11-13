import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRepo } from '../lib/repo';
import type { Item } from '../types/item';
import { Gallery } from '../components/Gallery';
import { Skeleton } from '../components/Skeleton';
import { CallButton } from '../components/CallButton';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { ErrorState } from '../components/ErrorState';
import { shareItem } from '../lib/links';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import { ArrowLeftIcon, CategoryIcon, ClipboardIcon, InfoIcon, ShareIcon, SparklesIcon } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';
import { PullToRefresh } from '../components/PullToRefresh';

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { t, getCategoryLabel, getConditionLabel, getStatusLabel, getItemTitle, getItemDescription } = useLanguage();

  const displayTitle = item ? getItemTitle(item) : undefined;
  const displayDescription = item ? getItemDescription(item) : undefined;

  useDocumentMeta(displayTitle, displayDescription);

  const loadItem = useCallback(
    async (forceRefresh = false) => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const repo = await getRepo();
        const found = await repo.get(id, { forceRefresh });
        if (!found) {
          setError(t.notFoundDesc);
        } else {
          setItem(found);
        }
      } catch (err) {
        setError((err as Error).message || t.errorDesc);
      } finally {
        setLoading(false);
      }
    },
    [id, t.notFoundDesc, t.errorDesc]
  );

  useEffect(() => {
    // Record view for InstallBanner
    try {
      sessionStorage.setItem('sh:viewed_item', 'true');
    } catch {
      /* ignore */
    }

    loadItem(false);
  }, [loadItem]);

  const handleShare = async () => {
    if (!item) return;
    const ok = await shareItem(item.title, window.location.href);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-4 pb-32">
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="py-16">
        <ErrorState
          title={error ? t.notFound : t.error}
          description={error || t.notFoundDesc}
        />
        <div className="text-center pt-4">
          <Link
            to="/items"
            className="text-sm font-bold text-green-600 dark:text-green-400 hover:underline inline-flex items-center gap-1.5"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>{t.seeAll}</span>
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <PullToRefresh onRefresh={() => loadItem(true)} isRefreshing={loading}>
      <div className="max-w-2xl mx-auto space-y-6 pt-1 pb-40">
      {/* Back button */}
      <Link
        to="/items"
        className="inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--fg)] transition-colors py-1.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 -ml-3"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span>{t.backToAll}</span>
      </Link>

      {/* Swipe Gallery */}
      <Gallery images={item.images} title={displayTitle || item.title} />

      {/* Title & Posted Date */}
      <div className="space-y-2 pt-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--fg)] tracking-tight leading-tight">
          {displayTitle || item.title}
        </h1>
        <p className="text-xs text-[var(--muted)]">
          {t.postedOn} {formattedDate}
        </p>
      </div>

      {/* Clear Labeled Overview for Elders & All Shoppers */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
          <ClipboardIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
          <span>{t.itemTypeLabel} & {t.conditionLabel}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 1. Item Type / Category */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400 block">
              {t.itemTypeLabel}
            </span>
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-[var(--fg)]">
              <CategoryIcon categoryId={item.category} className="w-4 h-4 text-green-600 shrink-0" />
              <span>{getCategoryLabel(item.category)}</span>
            </div>
          </div>

          {/* 2. Condition */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              {t.conditionLabel}
            </span>
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-[var(--fg)]">
              <SparklesIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{getConditionLabel(item.condition)}</span>
            </div>
          </div>

          {/* 3. Availability Status */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              {t.statusLabel}
            </span>
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-[var(--fg)]">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  item.status === 'available'
                    ? 'bg-green-500 animate-pulse'
                    : item.status === 'reserved'
                    ? 'bg-amber-500'
                    : 'bg-gray-400'
                }`}
              />
              <span>{getStatusLabel(item.status)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-6 space-y-2.5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          {t.descriptionLabel}
        </h3>
        <p className="text-sm sm:text-base text-[var(--fg)] leading-relaxed whitespace-pre-wrap">
          {displayDescription || t.noDescription}
        </p>
      </div>

      {/* Disclaimer */}
      <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-900/40 p-4 sm:p-5 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start gap-3 shadow-2xs">
        <InfoIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">{t.disclaimer}</p>
      </div>

      {/* Sticky Bottom Bar on Item Detail */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 py-3.5 px-4 sm:px-6 shadow-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2.5 sm:gap-3.5">
          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            aria-label={t.share}
            className="min-h-[46px] min-w-[46px] px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-[var(--fg)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <ShareIcon className="w-4 h-4" />
            <span className="hidden sm:inline">
              {copied ? t.copied : t.share}
            </span>
          </button>

          {/* WhatsApp */}
          <WhatsAppButton
            title={item.title}
            url={typeof window !== 'undefined' ? window.location.href : ''}
            variant="secondary"
            label={t.whatsapp}
            className="flex-1"
          />

          {/* Call to Collect */}
          <CallButton variant="primary" label={t.callToCollect} className="flex-1" />
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}
