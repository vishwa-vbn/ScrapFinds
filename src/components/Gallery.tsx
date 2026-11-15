import { useState, useRef } from 'react';
import type { ItemImage } from '../types/item';
import { ikUrl } from '../lib/imagekit';
import { CameraIcon } from './Icons';

interface GalleryProps {
  images: ItemImage[];
  title: string;
}

export function Gallery({ images, title }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const newIndex = Math.round(scrollLeft / clientWidth);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < images.length) {
      setActiveIndex(newIndex);
    }
  };

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      left: index * scrollRef.current.clientWidth,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border border-[var(--border)] select-none">
        <CameraIcon className="w-12 h-12 opacity-30 mb-2 stroke-[1.5]" />
        <span className="text-xs font-semibold uppercase tracking-wider opacity-60">No photos available</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Snap Scroll Viewport */}
      <div className="relative aspect-[4/3] w-full bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
          style={{ scrollSnapType: 'x mandatory' }}
          tabIndex={0}
          aria-label="Image gallery"
        >
          {images.map((img, idx) => (
            <div
              key={img.fileId || idx}
              className="w-full h-full shrink-0 snap-center flex items-center justify-center bg-black/5"
            >
              {failedIndices.has(idx) ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 select-none">
                  <CameraIcon className="w-12 h-12 opacity-30 mb-2 stroke-[1.5]" />
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-60">Photo unavailable</span>
                </div>
              ) : (
                <img
                  src={ikUrl(img.url, { w: 960, q: 75 })}
                  alt={`${title} - photo ${idx + 1}`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  width="960"
                  height="720"
                  onError={() => {
                    setFailedIndices(prev => new Set(prev).add(idx));
                  }}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          ))}
        </div>

        {/* Floating Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full pointer-events-none">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          {images.map((img, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <button
                key={img.fileId || idx}
                type="button"
                onClick={() => scrollTo(idx)}
                aria-label={`View photo ${idx + 1}`}
                className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-green-600 scale-105 shadow-sm'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                {failedIndices.has(idx) ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <CameraIcon className="w-5 h-5 opacity-40" />
                  </div>
                ) : (
                  <img
                    src={ikUrl(img.url, { w: 120, q: 60 })}
                    alt=""
                    width="64"
                    height="64"
                    className="w-full h-full object-cover"
                    onError={() => {
                      setFailedIndices(prev => new Set(prev).add(idx));
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
