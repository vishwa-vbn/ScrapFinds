import { useState, useRef } from 'react';
import type { ItemImage } from '../types/item';
import { ikUrl } from '../lib/imagekit';

interface GalleryProps {
  images: ItemImage[];
  title: string;
}

export function Gallery({ images, title }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
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
      <div className="w-full aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400">
        No image available
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
              <img
                src={ikUrl(img.url, { w: 960, q: 75 })}
                alt={`${title} - photo ${idx + 1}`}
                loading={idx === 0 ? 'eager' : 'lazy'}
                decoding="async"
                width="960"
                height="720"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = '/mock/placeholder-1.svg';
                }}
                className="w-full h-full object-contain"
              />
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
                <img
                  src={ikUrl(img.url, { w: 120, q: 60 })}
                  alt=""
                  width="64"
                  height="64"
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = '/mock/placeholder-1.svg';
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
