import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getRepo } from '../lib/repo';
import type { Item } from '../types/item';
import { ItemCard } from '../components/ItemCard';
import { ItemGrid } from '../components/ItemGrid';
import { ItemCardSkeleton } from '../components/Skeleton';
import { CategoryChips } from '../components/CategoryChips';
import { SearchBox } from '../components/SearchBox';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import { PullToRefresh } from '../components/PullToRefresh';
import { useLanguage } from '../context/LanguageContext';

export function Items() {
  const { t } = useLanguage();
  useDocumentMeta(t.itemsTitle, 'Browse recovered, tested items ready for local pickup.');

  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || undefined;

  const [items, setItems] = useState<Item[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(
    async (cat?: string, cursor?: number, append = false) => {
      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        const repo = await getRepo();
        const res = await repo.list({ category: cat, cursor });

        setNextCursor(res.nextCursor);
        if (append) {
          setItems(prev => [...prev, ...res.items]);
        } else {
          setItems(res.items);
        }
      } catch (err) {
        console.error('Failed to load items:', err);
        setError((err as Error).message || t.errorDesc);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [t.errorDesc]
  );

  useEffect(() => {
    loadData(categoryParam);
  }, [categoryParam, loadData]);

  const handleCategoryChange = (newCat?: string) => {
    if (newCat) {
      setSearchParams({ category: newCat });
    } else {
      setSearchParams({});
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      loadData(categoryParam, nextCursor, true);
    }
  };

  // Client-side search filtering over currently loaded items
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <PullToRefresh onRefresh={() => loadData(categoryParam)} isRefreshing={loading}>
      <div className="space-y-6 sm:space-y-8 pb-16">
        {/* Title */}
        <div className="pt-1 border-b border-gray-100 dark:border-slate-800 pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)] tracking-tight">
            {t.itemsTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] pt-0.5">
            {t.itemsSubtitle}
          </p>
        </div>

        {/* Category Chips & Search Box */}
      <div className="space-y-4">
        <CategoryChips
          selectedCategory={categoryParam}
          onSelectCategory={handleCategoryChange}
        />
        <SearchBox value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Error state */}
      {error && items.length === 0 && (
        <ErrorState
          title={t.error}
          description={error}
          onRetry={() => loadData(categoryParam)}
        />
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <ItemGrid>
          {Array.from({ length: 12 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </ItemGrid>
      ) : filteredItems.length > 0 ? (
        <>
          <ItemGrid>
            {filteredItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </ItemGrid>

          {/* Load More Button */}
          {nextCursor && !searchQuery && (
            <div className="text-center pt-8">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="min-h-[46px] px-8 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 font-bold text-sm text-[var(--fg)] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {loadingMore ? t.loading : t.loadMore}
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title={searchQuery ? 'No matching items' : t.noItemsHeading}
          description={
            searchQuery
              ? `No items found matching "${searchQuery}". Try a different keyword.`
              : categoryParam
              ? t.noItemsFiltered
              : t.noItemsDesc
          }
          action={
            searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-sm font-semibold cursor-pointer"
              >
                Clear search
              </button>
            ) : undefined
          }
        />
      )}
    </div>
  </PullToRefresh>
  );
}
