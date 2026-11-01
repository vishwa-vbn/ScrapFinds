type BIPEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: BIPEvent | null = null;
let installed = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());

export function initInstallCapture() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e as BIPEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    emit();
  });
}

export const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

export const getSnapshot = () => `${!!deferred}|${installed}`;
export const canPrompt = () => !!deferred;

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  emit();
  return outcome;
}
