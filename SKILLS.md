# SKILLS.md — Build playbooks for the agent

Each skill = **Goal → Steps → Reference code → Acceptance checks**. Apply them while following `AGENT.md` and `ARCHITECTURE.md`. Reference code shows intent; verify library APIs against current docs before using them.

---

## Skill 1 — Quota-safe Firestore access

**Goal:** make it structurally impossible to burn the free quota.

**Steps**
1. Import only from `firebase/firestore/lite` (no listeners exist in lite).
2. All reads go through `ItemsRepo` → cache → budget → Firestore.
3. Page size 12, cursor pagination by `createdAt` ms.
4. Cache stores plain JSON (epoch ms numbers).
5. Add dev-only `readMeter`.

**Reference — `src/lib/cache.ts`**
```ts
type Entry<T> = { v: T; t: number };
const mem = new Map<string, Entry<unknown>>();
const P = 'sh:v1:';

export const TTL = { list: 10 * 60_000, item: 30 * 60_000 };

export function getCached<T>(key: string, ttl: number): T | null {
  const now = Date.now();
  const m = mem.get(key) as Entry<T> | undefined;
  if (m && now - m.t < ttl) return m.v;
  try {
    const raw = localStorage.getItem(P + key);
    if (raw) {
      const e = JSON.parse(raw) as Entry<T>;
      if (now - e.t < ttl) { mem.set(key, e); return e.v; }
    }
  } catch { /* storage unavailable */ }
  return null;
}

/** Ignores TTL – used when the network or quota fails. */
export function getStale<T>(key: string): T | null {
  const m = mem.get(key) as Entry<T> | undefined;
  if (m) return m.v;
  try { const raw = localStorage.getItem(P + key); return raw ? (JSON.parse(raw) as Entry<T>).v : null; } catch { return null; }
}

export function setCached<T>(key: string, v: T) {
  const e: Entry<T> = { v, t: Date.now() };
  mem.set(key, e);
  try { localStorage.setItem(P + key, JSON.stringify(e)); } catch { /* quota */ }
}

export function clearCache() {
  mem.clear();
  try { Object.keys(localStorage).filter(k => k.startsWith(P)).forEach(k => localStorage.removeItem(k)); } catch { /* */ }
}
```

**Reference — `src/lib/readBudget.ts`**
```ts
const KEY = 'sh:reads';
const MAX_PER_DAY = 150;
const today = () => new Date().toDateString();

export function canRead(n: number): boolean {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { d: string; n: number } | null;
    return !s || s.d !== today() || s.n + n <= MAX_PER_DAY;
  } catch { return true; }
}
export function recordReads(n: number) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { d: string; n: number } | null;
    localStorage.setItem(KEY, JSON.stringify(s && s.d === today() ? { d: s.d, n: s.n + n } : { d: today(), n }));
  } catch { /* */ }
}
```

**Reference — list query (inside `firestoreRepo.ts`)**
```ts
import { getFirestore, collection, query, where, orderBy, limit, startAfter, getDocs, Timestamp } from 'firebase/firestore/lite';

const PAGE = 12;
export async function listVisible(db: Firestore, category?: string, cursor?: number) {
  const parts = [
    ...(category ? [where('category', '==', category)] : []),
    where('status', 'in', ['available', 'reserved']),
    orderBy('createdAt', 'desc'),
    ...(cursor ? [startAfter(Timestamp.fromMillis(cursor))] : []),
    limit(PAGE),
  ];
  const snap = await getDocs(query(collection(db, 'items'), ...parts));
  // parse with zod → Item (createdAt as ms)
}
```

**Acceptance**
- `grep -r "onSnapshot\|setInterval\|from 'firebase/firestore'" src` returns nothing (only `/lite`, and `firebase/auth` in the admin chunk).
- `readMeter` shows ≤ 12 reads for home cold load, 0 for Home → Items → Item detail.
- With airplane mode, previously viewed list + items still render with the "saved list" note.
- Unit tests: TTL expiry, stale fallback, budget exhaustion.

---

## Skill 2 — Secure Firestore rules

**Goal:** public read-only, admin-only write, bounded lists, schema-validated.

**Steps:** write `firestore.rules` and `firestore.indexes.json` exactly per ARCHITECTURE §5; write `firebase.json` with only the `firestore` block; add `npm run rules:deploy` = `firebase deploy --only firestore`.

**Acceptance**
- Rules contain a placeholder `REPLACE_WITH_ADMIN_UID` and `SETUP.md` tells the human to replace it.
- Default-deny catch-all present.
- (Optional, only if the Firebase emulator is available) `@firebase/rules-unit-testing` tests: anonymous write denied, anonymous list without limit denied, admin write with bad schema denied, admin valid write allowed.

---

## Skill 3 — Admin auth & guard

**Goal:** one owner can manage items from a phone; nobody else can.

**Steps**
1. `src/lib/firebase.ts` initialises the app from `VITE_FIREBASE_*`. Auth is imported **only** in admin modules.
2. `useAdminAuth()` — `onAuthStateChanged`, `signInWithPopup(new GoogleAuthProvider())`, `signOut`.
3. Client-side UID check is cosmetic: server + rules are the real gate. Because the client doesn't know the admin UID (keep it out of the bundle), "admin-ness" is determined by a **probe**: after login, call `/api/imagekit-auth`-style endpoint `GET /api/whoami` (optional helper, same `verifyAdmin`) → 200 = admin, 403 = sign out + message "This account is not allowed". Add `api/whoami.ts` for this.
4. `AdminGuard` redirects unauthenticated users to `/admin`.
5. Admin pages set `<meta name="robots" content="noindex">` and are `React.lazy` loaded.

**Acceptance:** signing in with a non-admin Google account never shows admin UI and any write attempt is rejected by rules; admin chunk is absent from the public initial bundle (`vite build` output / `rollup-plugin-visualizer` optional).

---

## Skill 4 — ImageKit image pipeline

**Goal:** tiny images, safe uploads, graceful failure.

**Reference — `src/lib/imagekit.ts`**
```ts
import imageCompression from 'browser-image-compression';

const ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT as string;
const PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY as string;

export function ikUrl(url: string, o: { w: number; q?: number }) {
  if (!url.startsWith(ENDPOINT)) return url;               // e.g. mock images
  return `${url}?tr=w-${o.w},q-${o.q ?? 70},f-auto`;
}

export async function uploadImage(file: File, idToken: string): Promise<{ url: string; fileId: string }> {
  const small = await imageCompression(file, { maxWidthOrHeight: 1280, maxSizeMB: 0.25, fileType: 'image/webp', useWebWorker: true });
  const a = await fetch('/api/imagekit-auth', { method: 'POST', headers: { Authorization: `Bearer ${idToken}` } });
  if (!a.ok) throw new Error('auth');
  const { token, expire, signature } = await a.json();
  const fd = new FormData();
  fd.append('file', small);
  fd.append('fileName', `item-${Date.now()}.webp`);
  fd.append('publicKey', PUBLIC_KEY);
  fd.append('signature', signature);
  fd.append('expire', String(expire));
  fd.append('token', token);
  fd.append('folder', '/scrap');
  fd.append('useUniqueFileName', 'true');
  const u = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: fd });
  if (!u.ok) throw new Error('upload');
  const j = await u.json();
  return { url: j.url, fileId: j.fileId };
}
```

**Steps**
1. Form shows previews, remove/reorder, progress per image, max 4, first image = cover.
2. Upload sequentially (low memory on cheap phones).
3. If saving the Firestore doc fails after uploads → call `/api/imagekit-delete` for uploaded files.
4. Editing an item and removing an image → delete it from ImageKit after the doc update succeeds.
5. `ItemCard`/`Gallery` use `ikUrl` with sizes from ARCHITECTURE §8; `onError` → placeholder.

**Acceptance:** uploading a 6 MB phone photo results in ≤ ~250 KB stored; a card thumbnail request is < 70 KB; network panel shows no private key anywhere; killing `/api` makes upload show a clear error, not a crash.

---

## Skill 5 — PWA & install flow

**Goal:** installable, offline-capable shell, and a QR landing page that gets people to the install tap.

**Steps**
1. `vite.config.ts`: `VitePWA({ registerType: 'autoUpdate', manifest: {...ARCHITECTURE §7}, workbox: { navigateFallback: '/index.html', navigateFallbackDenylist: [/^\/api\//], runtimeCaching: [ik-images CacheFirst] } })`.
2. Icons: one `public/favicon.svg` source → `pwa-assets-generator` config (`pwa-assets.config.ts`, preset minimal-2023 + maskable + apple) → `public/icons/*`. Add an npm script `icons`.
3. Capture install prompt before React mounts.

**Reference — `src/lib/pwa/installStore.ts`**
```ts
type BIPEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
let deferred: BIPEvent | null = null;
let installed = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());

export function initInstallCapture() {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as BIPEvent; emit(); });
  window.addEventListener('appinstalled', () => { deferred = null; installed = true; emit(); });
}
export const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };
export const getSnapshot = () => `${!!deferred}|${installed}`;
export const canPrompt = () => !!deferred;
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null; emit();
  return outcome;
}
```

**Reference — `src/lib/pwa/platform.ts`**
```ts
const ua = () => navigator.userAgent;
export const isIOS = () => /iPad|iPhone|iPod/.test(ua()) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isAndroid = () => /Android/i.test(ua());
export const isInAppBrowser = () => /FBAN|FBAV|Instagram|Line\/|Snapchat|MicroMessenger|; wv\)/i.test(ua());
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
```
Use `useSyncExternalStore(subscribe, getSnapshot)` in a `useInstall()` hook.

4. `/install` page follows the decision tree in ARCHITECTURE §7. Copy tone: plain, big buttons, short steps, an inline SVG for the iOS Share icon. Always show a Call button and "Continue in browser".
5. `InstallBanner` rules: show after visit #2 or after viewing an item; dismiss → hide for 14 days; never show in standalone.
6. `OfflineBanner` listens to `online`/`offline`.

**Acceptance**
- Lighthouse "Installable" passes on the production build; DevTools → Application → Manifest shows no warnings; maskable icon renders correctly.
- Android Chrome: opening `/install?src=poster` shows the Install button; tapping it shows the native prompt; after install the app opens standalone at `/?source=pwa`.
- iOS Safari: guide shows; Chrome in-app browser panel shows "Open in Chrome".
- Offline: shell loads, cached list shows, Call button works.

---

## Skill 6 — QR codes & marketing assets

**Goal:** print-ready QR assets per channel, plus a poster and card template.

**Reference — `scripts/generate-qr.mjs`**
```js
import QRCode from 'qrcode';
import fs from 'node:fs/promises';

const base = (process.env.SITE_URL ?? process.argv[2] ?? '').replace(/\/$/, '');
if (!/^https:\/\//.test(base)) { console.error('Usage: SITE_URL=https://yourdomain.com npm run qr'); process.exit(1); }

const sources = ['poster', 'card', 'sticker', 'whatsapp', 'flyer', 'vehicle'];
await fs.mkdir('marketing/qr', { recursive: true });

for (const s of sources) {
  const url = `${base}/install?src=${s}`;
  await QRCode.toFile(`marketing/qr/qr-${s}.svg`, url, { type: 'svg', errorCorrectionLevel: 'Q', margin: 4, color: { dark: '#111111', light: '#ffffff' } });
  await QRCode.toFile(`marketing/qr/qr-${s}.png`, url, { width: 1200, errorCorrectionLevel: 'Q', margin: 4, color: { dark: '#111111', light: '#ffffff' } });
  console.log('✓', s, url);
}
```

**Steps**
1. `npm run qr` → files in `marketing/qr/`.
2. `scripts/make-marketing.mjs` builds `marketing/poster-a4.html` (print CSS, A4) and `marketing/visiting-card.html` (90×55 mm) embedding the SVG QR, business name, phone number (from `site.ts`) and a one-line call to action ("Scan to install • See items available now • Call us to collect scrap").
3. Document in `MARKETING_QR.md` how to print and test.

**Acceptance:** each QR decodes (use the browser/Phone) to `https://<domain>/install?src=<channel>`; poster prints on one A4 page; QR ≥ 3 cm on cards, ≥ 8 cm on posters, 4-module quiet zone kept.

---

## Skill 7 — Clean UI system

**Goal:** a calm, trustworthy, fast mobile UI.

**Steps**
1. Tokens in `index.css`; dark mode via `prefers-color-scheme`.
2. Build the primitives: `Button` (primary/secondary/ghost, ≥44px), `Badge`, `Skeleton`, `EmptyState`, `ErrorState`.
3. `ItemCard`: `<a>` wrapping the card; image with fixed aspect ratio; title clamp 2 lines; badges row.
4. `Gallery`: CSS `scroll-snap-type: x mandatory`, dots/thumbnails, no JS library, keyboard accessible.
5. Category chips: horizontally scrollable, `aria-pressed`.
6. Set per-route `document.title` + meta description (tiny `useDocumentMeta`).
7. `robots.txt`: allow all, disallow `/admin`; `sitemap.xml` static with `/`, `/items`, `/install`.
8. Respect `prefers-reduced-motion`; avoid layout shift.

**Acceptance:** Lighthouse mobile Accessibility ≥ 95, CLS < 0.05, LCP < 2.5 s on the throttled profile; keyboard-only navigation works; screenshots at 390×844 and 1280×800 look consistent.

---

## Skill 8 — Mock mode & tests

**Goal:** the whole app is verifiable before any account exists.

**Steps**
1. `mockRepo` implements `ItemsRepo` with ~10 seeded items (varied categories/conditions/statuses) using `public/mock/*.svg` placeholders; admin CRUD works in memory; fake "admin" login available **only** when `import.meta.env.DEV && VITE_USE_MOCK === 'true'`.
2. `repo/index.ts` selects the implementation. In `main.tsx`: `if (import.meta.env.PROD && import.meta.env.VITE_USE_MOCK === 'true') throw new Error('Mock mode is not allowed in production')`.
3. Vitest unit tests: `cache`, `readBudget`, `ikUrl`, `links` (tel/wa/maps encoding), zod `itemSchema` (valid/invalid), `platform` detection helpers.
4. Scripts in `package.json`: `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `icons`, `qr`, `marketing`, `rules:deploy`.

**Acceptance:** `VITE_USE_MOCK=true npm run dev` shows a populated, fully functional app; `npm run build` with `VITE_USE_MOCK=true` fails or ignores mock mode (documented).

---

## Skill 9 — Vercel deploy hardening

**Steps**
1. `vercel.json` per ARCHITECTURE §9; Framework preset Vite; Node 20+ runtime for `/api`.
2. `.env.example` lists every variable in ARCHITECTURE §10 with placeholder values and a comment on public vs secret.
3. `.gitignore`: `node_modules`, `dist`, `.env*` (except `.env.example`), `.vercel`, `marketing/qr` optional.
4. Post-build check script (`scripts/check-dist.mjs`): fail if `dist/` contains `IMAGEKIT_PRIVATE`, `BEGIN PRIVATE KEY`, or `ADMIN_UID` value patterns; print gzip sizes of the initial JS and assert ≤ 150 KB.
5. Document preview deployments: add preview origin to `ALLOWED_ORIGINS` and Firebase Auth authorized domains.

**Acceptance:** `npm run build && node scripts/check-dist.mjs` passes; security headers visible in the browser's network panel on the deployed site.
