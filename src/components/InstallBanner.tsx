import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInstall } from '../lib/pwa/useInstall';
import { site } from '../config/site';
import { DownloadIcon, CloseIcon } from './Icons';

const DISMISS_KEY = 'sh:banner_dismissed';
const VISITS_KEY = 'sh:visits';
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

export function InstallBanner() {
  const { isInstalled, isStandalone, canInstall, install } = useInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstalled || isStandalone) {
      setVisible(false);
      return;
    }

    // Check dismissal
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed && Date.now() - parseInt(dismissed, 10) < FOURTEEN_DAYS) {
        setVisible(false);
        return;
      }

      // Check visit count
      const visits = parseInt(localStorage.getItem(VISITS_KEY) ?? '0', 10) + 1;
      localStorage.setItem(VISITS_KEY, String(visits));

      // Show if visit count >= 2 or if user has viewed an item
      const viewedItem = sessionStorage.getItem('sh:viewed_item') === 'true';
      if (visits >= 2 || viewedItem) {
        setVisible(true);
      }
    } catch {
      // localStorage disabled
    }
  }, [isInstalled, isStandalone]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  const handleInstallClick = async () => {
    if (canInstall) {
      const result = await install();
      if (result === 'accepted') {
        setVisible(false);
      }
    }
  };

  if (!visible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-green-700 via-emerald-700 to-green-800 text-white shadow-md relative z-30 border-b border-green-600/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <DownloadIcon className="w-4 h-4 text-white" />
          </div>
          <span className="truncate">
            <strong className="font-bold">Install {site.shortName}</strong> for fast offline access on your phone.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canInstall ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-white text-green-900 font-bold rounded-lg hover:bg-green-50 transition-all shadow-xs text-xs cursor-pointer flex items-center gap-1.5"
            >
              <DownloadIcon className="w-3.5 h-3.5 text-green-900" />
              <span>Install</span>
            </button>
          ) : (
            <Link
              to="/install"
              className="px-3.5 py-1.5 bg-white text-green-900 font-bold rounded-lg hover:bg-green-50 transition-all shadow-xs text-xs flex items-center gap-1.5"
            >
              <DownloadIcon className="w-3.5 h-3.5 text-green-900" />
              <span>Install</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/90 hover:text-white"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
