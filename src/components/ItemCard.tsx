import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Item } from '../types/item';
import { ikUrl } from '../lib/imagekit';
import { Badge } from './Badge';
import { CameraIcon, CategoryIcon, SparklesIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const [imgSrc, setImgSrc] = useState(() =>
    item.images.length > 0 ? ikUrl(item.images[0].url, { w: 480, q: 70 }) : '/mock/placeholder-1.svg'
  );

  const { t, getCategoryLabel, getConditionLabel } = useLanguage();

  return (
    <Link
      to={`/item/${item.id}`}
      className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md hover:border-green-500/60 dark:hover:border-green-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      {/* 4:3 Aspect Ratio Image Container */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
        <img
          src={imgSrc}
          alt={item.title}
          loading="lazy"
          decoding="async"
          width="480"
          height="360"
          onError={() => setImgSrc('/mock/placeholder-1.svg')}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Status Overlay if Reserved */}
        {item.status === 'reserved' && (
          <div className="absolute top-3 left-3">
            <Badge variant="warning">{t.statusReserved}</Badge>
          </div>
        )}

        {/* Photo count indicator if > 1 */}
        {item.images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
            <CameraIcon className="w-3.5 h-3.5 text-white/90" />
            <span>{item.images.length}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
        <div>
          <h3 className="font-bold text-[var(--fg)] text-base line-clamp-2 leading-snug group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {item.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-800/80">
          <Badge variant="muted">
            <CategoryIcon categoryId={item.category} className="w-3.5 h-3.5 mr-1 text-green-600" />
            <span className="truncate max-w-[120px]">{getCategoryLabel(item.category)}</span>
          </Badge>
          <Badge variant="default">
            <SparklesIcon className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate max-w-[120px]">{getConditionLabel(item.condition)}</span>
          </Badge>
        </div>
      </div>
    </Link>
  );
}
