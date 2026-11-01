import { useState, useEffect } from 'react';
import { ZapIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';

export function OfflineBanner() {
  const { t } = useLanguage();
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-amber-500 text-amber-950 font-semibold text-xs py-2 px-4 text-center sticky top-16 z-30 shadow-sm flex items-center justify-center gap-2"
    >
      <ZapIcon className="w-4 h-4 text-amber-950" />
      <span>{t.offlineDesc}</span>
    </div>
  );
}
