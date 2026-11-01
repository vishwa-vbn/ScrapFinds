const ua = () => (typeof navigator !== 'undefined' ? navigator.userAgent : '');

export const isIOS = (): boolean =>
  /iPad|iPhone|iPod/.test(ua()) ||
  (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isAndroid = (): boolean => /Android/i.test(ua());

export const isInAppBrowser = (): boolean =>
  /FBAN|FBAV|Instagram|Line\/|Snapchat|MicroMessenger|; wv\)/i.test(ua());

export const isStandalone = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);
