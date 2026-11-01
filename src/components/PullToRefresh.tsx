import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { RefreshIcon } from './Icons';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  isRefreshing: boolean;
  children: ReactNode;
  threshold?: number;
  maxPull?: number;
}

export function PullToRefresh({
  onRefresh,
  isRefreshing,
  children,
  threshold = 70,
  maxPull = 120,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      // Only initiate pull if at top of page
      if (window.scrollY <= 2 && !isRefreshing) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    },
    [isRefreshing]
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      // Only pull down
      if (diff > 0 && window.scrollY <= 2) {
        // Logarithmic / dampened pull resistance
        const dampened = Math.min(maxPull, Math.pow(diff, 0.82) * 2.2);
        setPullDistance(dampened);

        // Prevent native overscroll refresh when actively dragging
        if (diff > 10 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
      }
    },
    [isRefreshing, maxPull]
  );

  // Handle touch end / cancel
  const handleTouchEnd = useCallback(() => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setPullDistance(threshold * 0.85); // lock at indicator height
      onRefresh();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  // When refreshing finishes, reset pull distance smoothly
  useEffect(() => {
    if (!isRefreshing) {
      setPullDistance(0);
    }
  }, [isRefreshing]);

  // Attach touch listeners with passive: false so we can preventDefault on pull
  useEffect(() => {
    const onTouchStart = (e: Event) => handleTouchStart(e as TouchEvent);
    const onTouchMove = (e: Event) => handleTouchMove(e as TouchEvent);
    const onTouchEnd = () => handleTouchEnd();

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(1, pullDistance / threshold);
  const isTriggered = pullDistance >= threshold;
  const isVisible = pullDistance > 4 || isRefreshing;
  const displayY = isRefreshing ? 48 : pullDistance;

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Floating Instagram/Reels style pull indicator */}
      <div
        aria-hidden="true"
        className={`fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-transform duration-150 ease-out ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
        style={{
          top: `${Math.max(12, Math.min(displayY * 0.75 + 10, 80))}px`,
          transition: isPullingRef.current ? 'none' : 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border border-gray-200/90 dark:border-slate-700 transition-colors ${
            isTriggered || isRefreshing
              ? 'bg-green-600 text-white'
              : 'bg-white dark:bg-slate-900 text-green-600 dark:text-green-400'
          }`}
        >
          <RefreshIcon
            className={`w-5 h-5 transition-transform ${
              isRefreshing
                ? 'animate-spin'
                : ''
            }`}
            style={
              !isRefreshing
                ? { transform: `rotate(${progress * 280}deg)` }
                : undefined
            }
          />
        </div>
      </div>

      {/* Main Content with subtle resistance transform */}
      <div
        style={{
          transform: pullDistance > 0 && isPullingRef.current ? `translateY(${pullDistance * 0.3}px)` : 'none',
          transition: isPullingRef.current ? 'none' : 'transform 0.25s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
