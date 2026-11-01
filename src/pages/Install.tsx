import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useInstall } from '../lib/pwa/useInstall';
import { strings } from '../config/strings';
import { site } from '../config/site';
import { CallButton } from '../components/CallButton';
import { copyToClipboard } from '../lib/links';
import { useDocumentMeta } from '../lib/useDocumentMeta';
import { useLanguage } from '../context/LanguageContext';
import {
  RecycleIcon,
  DownloadIcon,
  ClipboardIcon,
  SparklesIcon,
  CheckIcon,
  ArrowRightIcon,
} from '../components/Icons';

export function Install() {
  const { t } = useLanguage();
  useDocumentMeta(t.installTitle, t.installSubtitle);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    canInstall,
    isInstalled,
    isStandalone,
    install,
    isIOS,
    isInAppBrowser,
  } = useInstall();

  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Store ?src= into sessionStorage
  useEffect(() => {
    const src = searchParams.get('src');
    if (src) {
      try {
        sessionStorage.setItem('sh:src', src);
      } catch {
        /* ignore */
      }
    }
  }, [searchParams]);

  // If already standalone, redirect to home
  useEffect(() => {
    if (isStandalone) {
      navigate('/?source=pwa', { replace: true });
    }
  }, [isStandalone, navigate]);

  const handleInstallClick = async () => {
    const outcome = await install();
    if (outcome === 'accepted') {
      setInstalledSuccess(true);
      setTimeout(() => {
        navigate('/?source=pwa', { replace: true });
      }, 2000);
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(window.location.origin);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-lg mx-auto pt-6 sm:pt-10 pb-20 px-4 space-y-8 text-center">
      {/* App Icon & Title */}
      <div className="space-y-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-lg">
          <RecycleIcon className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--fg)] tracking-tight">
          {strings.installTitle}
        </h1>
        <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed max-w-sm mx-auto">
          {site.name} • {strings.installSubtitle}
        </p>
      </div>

      {/* Main Flow Decision Tree */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-left">
        {installedSuccess || isInstalled ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-green-50 dark:bg-green-950/60 text-green-600 flex items-center justify-center">
              <SparklesIcon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-green-600 dark:text-green-400">
              {strings.installSuccess}
            </h2>
            <Link
              to="/?source=pwa"
              className="inline-flex items-center justify-center min-h-[46px] px-8 py-2.5 bg-green-600 text-white font-bold rounded-xl text-sm shadow-sm"
            >
              Open {site.shortName}
            </Link>
          </div>
        ) : isInAppBrowser ? (
          /* In-App Browser (Instagram, FB, WhatsApp browser, etc.) */
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs sm:text-sm text-amber-950 dark:text-amber-200 space-y-1">
              <strong className="font-bold block">{strings.inAppBrowserNote}</strong>
              <p>{strings.inAppBrowserDesc}</p>
            </div>
            <ol className="list-decimal list-inside text-xs sm:text-sm space-y-2.5 text-[var(--fg)] pl-1">
              <li>Tap the three dots (⋮ or ···) in the browser toolbar.</li>
              <li>Choose <strong>"Open in Chrome"</strong> or <strong>"Open in Safari"</strong>.</li>
              <li>Then tap <strong>Install</strong> on this page.</li>
            </ol>
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs sm:text-sm font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ClipboardIcon className="w-4 h-4 text-[var(--muted)]" />
              <span>{copied ? strings.linkCopied : strings.copyLink}</span>
            </button>
          </div>
        ) : canInstall ? (
          /* Android / Desktop Chrome with prompt available */
          <div className="space-y-4 text-center py-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black text-base shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5"
            >
              <DownloadIcon className="w-5 h-5 text-white" />
              <span>{strings.installBtn}</span>
            </button>
            <div className="flex items-center justify-center gap-4 text-xs text-[var(--muted)] font-medium pt-1">
              <span className="flex items-center gap-1.5">
                <CheckIcon className="w-3.5 h-3.5 text-green-600" /> Instant launch
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="w-3.5 h-3.5 text-green-600" /> Offline cache
              </span>
            </div>
          </div>
        ) : isIOS ? (
          /* iOS Safari Guide */
          <div className="space-y-5">
            <h3 className="font-extrabold text-sm sm:text-base text-[var(--fg)]">
              How to add to Home Screen on iPhone / iPad:
            </h3>
            <div className="space-y-3 text-xs sm:text-sm text-[var(--fg)]">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-bold">{strings.iosStep1}</p>
                  <p className="text-[var(--muted)] text-xs pt-1 flex items-center gap-1">
                    Tap the Share icon
                    <svg className="w-4 h-4 inline-block text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    at the bottom of your screen
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-bold">{strings.iosStep2}</p>
                  <p className="text-[var(--muted)] text-xs pt-1">Scroll down in the action menu</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-bold">{strings.iosStep3}</p>
                  <p className="text-[var(--muted)] text-xs pt-1">In the top right corner to finish</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Other Browsers (Firefox, Samsung Internet, Edge, etc.) */
          <div className="space-y-3.5 text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
            <p className="text-[var(--fg)] font-bold">{strings.otherBrowserNote}</p>
            <p>
              Once added, {site.shortName} will appear on your home screen or desktop just like a native app.
            </p>
          </div>
        )}
      </div>

      {/* Always visible below: Call button + Continue in browser */}
      <div className="space-y-4 pt-2">
        <CallButton variant="secondary" className="w-full text-base py-3" />
        <div>
          <Link
            to="/?source=install_page"
            className="text-xs sm:text-sm font-bold text-[var(--muted)] hover:text-[var(--fg)] underline p-2 inline-flex items-center gap-1"
          >
            <span>{strings.continueInBrowser}</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
