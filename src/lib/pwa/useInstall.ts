import { useSyncExternalStore, useCallback } from 'react';
import { subscribe, getSnapshot, canPrompt, promptInstall } from './installStore';
import { isIOS, isAndroid, isInAppBrowser, isStandalone } from './platform';

export function useInstall() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => 'false|false' // Server snapshot
  );

  const [, installedStr] = snapshot.split('|');
  const isAppInstalled = installedStr === 'true' || isStandalone();
  const canInstall = canPrompt() && !isAppInstalled;

  const install = useCallback(async () => {
    return await promptInstall();
  }, []);

  return {
    canInstall,
    isInstalled: isAppInstalled,
    install,
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isInAppBrowser: isInAppBrowser(),
    isStandalone: isStandalone(),
  };
}
