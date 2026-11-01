import { useRef, useEffect, useCallback } from 'react';
import { categories } from '../config/categories';
import { CategoryIcon, PackageIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';

interface CategoryChipsProps {
  selectedCategory?: string;
  onSelectCategory: (categoryId?: string) => void;
}

export function CategoryChips({ selectedCategory, onSelectCategory }: CategoryChipsProps) {
  const { t, getCategoryLabel } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Center a button horizontally in the container without affecting vertical page scroll
  const scrollButtonIntoView = useCallback((buttonEl: HTMLElement) => {
    const container = containerRef.current;
    if (!container || !buttonEl) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = buttonEl.getBoundingClientRect();
    const currentScroll = container.scrollLeft;

    const buttonOffset = buttonRect.left - containerRect.left + currentScroll;
    const targetScroll = buttonOffset - container.clientWidth / 2 + buttonRect.width / 2;

    container.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth',
    });
  }, []);

  // When selectedCategory changes, center it smoothly
  useEffect(() => {
    if (activeBtnRef.current) {
      scrollButtonIntoView(activeBtnRef.current);
    }
  }, [selectedCategory, scrollButtonIntoView]);

  // Handle click on chip: selects category and auto-scrolls to position
  const handleChipClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    catId?: string
  ) => {
    onSelectCategory(catId);
    scrollButtonIntoView(e.currentTarget);
  };

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-auto no-scrollbar py-1.5 flex items-center gap-2.5 scroll-smooth"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {/* "All" chip */}
      <button
        ref={!selectedCategory ? activeBtnRef : undefined}
        type="button"
        aria-pressed={!selectedCategory}
        onClick={e => handleChipClick(e, undefined)}
        className={`shrink-0 min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer flex items-center gap-2 ${
          !selectedCategory
            ? 'bg-green-600 text-white shadow-sm scale-102'
            : 'bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-[var(--fg)] border border-gray-200 dark:border-slate-700'
        }`}
      >
        <PackageIcon className="w-3.5 h-3.5" />
        <span>{t.allCategories}</span>
      </button>

      {/* Specific category chips */}
      {categories.map(cat => {
        const isSelected = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            ref={isSelected ? activeBtnRef : undefined}
            type="button"
            aria-pressed={isSelected}
            onClick={e => handleChipClick(e, cat.id)}
            className={`shrink-0 min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-2 cursor-pointer ${
              isSelected
                ? 'bg-green-600 text-white shadow-sm scale-102'
                : 'bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-[var(--fg)] border border-gray-200 dark:border-slate-700'
            }`}
          >
            <CategoryIcon categoryId={cat.id} className="w-3.5 h-3.5" />
            <span>{getCategoryLabel(cat.id)}</span>
          </button>
        );
      })}
    </div>
  );
}
