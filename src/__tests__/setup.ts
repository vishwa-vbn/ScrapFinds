const storage = new Map<string, string>();

interface MockStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  readonly length: number;
  key: (i: number) => string | null;
  [key: string]: unknown;
}

const localStorageMock: MockStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, String(value));
    localStorageMock[key] = String(value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
    delete localStorageMock[key];
  },
  clear: () => {
    for (const key of storage.keys()) {
      delete localStorageMock[key];
    }
    storage.clear();
  },
  get length() {
    return storage.size;
  },
  key: (i: number) => Array.from(storage.keys())[i] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

if (typeof (globalThis as { window?: unknown }).window === 'undefined') {
  const windowMock = {
    navigator: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      platform: 'Win32',
      maxTouchPoints: 0,
    },
    matchMedia: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    location: {
      href: 'http://localhost:5173/',
      origin: 'http://localhost:5173',
    },
  };

  Object.defineProperty(globalThis, 'window', {
    value: windowMock,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'navigator', {
    value: windowMock.navigator,
    writable: true,
    configurable: true,
  });
}
