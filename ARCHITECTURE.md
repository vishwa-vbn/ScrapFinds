# ARCHITECTURE.md — ScrapHub

## 1. Overview

A static React PWA on Vercel. Public visitors read a small `items` collection from Firestore (read-only, cached aggressively). One admin (the owner) signs in with Google, creates/edits items and uploads photos to ImageKit through a tiny signed-upload API. Contact details are static config.

```
                   ┌────────────────────────────── Vercel (static + 3 tiny API routes) ─────────────────────────────┐
 Visitor phone ──► │  React PWA (SPA, service worker)                                                               │
 (QR / link)       │    ├─ public pages: Home, Items, ItemDetail, Install                                           │
                   │    └─ /admin (lazy chunk): Login, Dashboard, ItemForm                                          │
                   │  /api/imagekit-auth   (verifies Firebase ID token + admin UID → returns upload signature)      │
                   │  /api/imagekit-delete (same verification → deletes a file by fileId)                           │
                   └───────────────┬───────────────────────────────┬───────────────────────────────┬────────────────┘
                                   │ REST (firestore/lite)         │ signed direct upload           │ image GET (CDN)
                                   ▼                               ▼                                ▼
                         Firebase Firestore (Spark)          ImageKit (free)               ik.imagekit.io (+ SW cache)
                         items/{id}  (public read,           /scrap folder
                         admin-only write)
                         Firebase Auth (Google, admin only)
```

**Cost model:** Spark plan has no billing account attached → exceeding a quota makes calls fail (site degrades gracefully), it never produces a charge. ImageKit free plan and Vercel Hobby also stop rather than bill. The app is designed so every failure mode still shows the **Call** button.

### Free-tier facts (verified Oct 2026 — re-check dashboards before launch)
| Service | Limit that matters | Behaviour at limit |
|---|---|---|
| Firestore (Spark) | 1 GiB stored, 50K reads/day, 20K writes/day, 20K deletes/day, 10 GiB egress/month | Requests fail until the daily reset |
| ImageKit (Free) | ~20 GB bandwidth/month (storage allowance varies by source/plan — assume ≥3 GB, check dashboard) | **Image delivery stops** until the monthly reset |
| Vercel (Hobby) | Generous transfer/function limits | Feature paused for up to 30 days. **Hobby is licensed for non-commercial personal use only** — see §12 risk R1 |

## 2. Tech stack
Vite · React 19 · TypeScript strict · Tailwind v4 · react-router-dom · firebase (modular; `firestore/lite`, `auth`) · zod · browser-image-compression · vite-plugin-pwa · @vite-pwa/assets-generator · vitest · qrcode · @vercel/node (types).

## 3. Repository layout

```
scrap-hub/
├─ AGENT.md
├─ docs/  ARCHITECTURE.md SKILLS.md SETUP.md MARKETING_QR.md INITIAL_PROMPT.md BUILD_REPORT.md(generated)
├─ api/
│  ├─ _lib/verifyAdmin.ts          # underscore = not a route
│  ├─ imagekit-auth.ts
│  ├─ imagekit-delete.ts
│  └─ whoami.ts                    # 200 if caller is admin, else 403 (used by AdminGuard)
├─ public/
│  ├─ favicon.svg  robots.txt  sitemap.xml  og-image.png
│  ├─ icons/ (generated: 192, 512, maskable-512, apple-touch-180)
│  └─ mock/ (placeholder SVG images for mock mode)
├─ marketing/ (generated QR codes + poster + card)
├─ scripts/ generate-qr.mjs  make-marketing.mjs
├─ src/
│  ├─ main.tsx  App.tsx  routes.tsx  index.css
│  ├─ config/ site.ts  categories.ts  strings.ts
│  ├─ types/ item.ts                # zod schemas + TS types
│  ├─ lib/
│  │  ├─ firebase.ts                # app init (env-driven)
│  │  ├─ repo/ index.ts types.ts firestoreRepo.ts mockRepo.ts
│  │  ├─ cache.ts  readBudget.ts  readMeter.ts
│  │  ├─ imagekit.ts                # ikUrl(), uploadImage(), deleteImage()
│  │  ├─ links.ts                   # telHref(), waHref(), shareItem()
│  │  └─ pwa/ installStore.ts  platform.ts  useInstall.ts
│  ├─ components/ Header Footer ContactBar CallButton WhatsAppButton ItemCard ItemGrid
│  │              CategoryChips SearchBox Gallery Badge Skeleton EmptyState ErrorState
│  │              InstallBanner OfflineBanner ErrorBoundary
│  └─ pages/ Home Items ItemDetail Install NotFound
│     └─ admin/ AdminGuard Login Dashboard ItemForm useAdminAuth
├─ firestore.rules  firestore.indexes.json  firebase.json
├─ vercel.json  vite.config.ts  tsconfig.json  eslint.config.js
├─ .env.example  .gitignore  package.json
```

## 4. Routes

| Path | Purpose | Notes |
|---|---|---|
| `/` | Home: hero (name, tagline, **Call** + **WhatsApp**), "Available now" (first 6 of the cached list), "What we collect", "How it works" (Call → we confirm → hand-to-hand pickup), contact card (phone, address, hours, Maps link) | Uses same list cache as `/items` |
| `/items` | Full listing: category chips, client-side search, "Load more" (12/page) | Category chip = server query (indexed); search = client-side over loaded items |
| `/item/:id` | Detail: swipe gallery, badges, description, disclaimer, sticky Call/WhatsApp/Share bar | Reads from list cache first; else 1 `getDoc` |
| `/install` | QR landing: platform-aware install flow (§7) | Captures `?src=` into sessionStorage |
| `/admin` | Google sign-in | `noindex`; lazy chunk |
| `/admin/items` | Admin list (limit 50), quick actions: Reserve / Mark sold / Edit / Delete | AdminGuard |
| `/admin/items/new`, `/admin/items/:id/edit` | Item form | AdminGuard |
| `*` | 404 with Call button | |

## 5. Data model

### Collection `items/{autoId}`
| Field | Type | Rules |
|---|---|---|
| `title` | string | 2–80 chars |
| `description` | string | 0–1000 chars, plain text |
| `category` | string | one of `categories.ts` ids (rules only check ≤30 chars; zod enforces the enum) |
| `condition` | string | `like_new` \| `good` \| `fair` \| `needs_repair` |
| `status` | string | `available` \| `reserved` \| `sold` |
| `images` | list<map> | 1–4 entries `{ url: string, fileId: string }` (ImageKit) |
| `createdAt` | timestamp | `serverTimestamp()`; immutable after create |
| `updatedAt` | timestamp | `serverTimestamp()` on every write |

No prices. No personal data. No counters (counters would cost writes).

Default categories (`categories.ts`): `audio` Speakers & Audio · `phones` Mobiles & Tablets · `bicycles` Bicycles · `electronics` Electronics · `appliances` Home Appliances · `furniture` Furniture · `tools` Tools · `other` Other.

Lifecycle: `available` → `reserved` → `sold`. Public listing shows `available` + `reserved` only. Admin has a **"Clean up sold"** action that deletes sold items and their ImageKit files (frees storage; deletes are well within 20K/day).

### `firestore.rules`
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && request.auth.uid == 'REPLACE_WITH_ADMIN_UID';
    }

    function validItem(d) {
      return d.keys().hasOnly(['title','description','category','condition','status','images','createdAt','updatedAt'])
        && d.title is string && d.title.size() >= 2 && d.title.size() <= 80
        && d.description is string && d.description.size() <= 1000
        && d.category is string && d.category.size() > 0 && d.category.size() <= 30
        && d.condition in ['like_new','good','fair','needs_repair']
        && d.status in ['available','reserved','sold']
        && d.images is list && d.images.size() >= 1 && d.images.size() <= 4
        && d.createdAt is timestamp && d.updatedAt is timestamp;
    }

    match /items/{itemId} {
      allow get: if true;
      // Public lists must be bounded and must only target visible statuses. Admin lists must be bounded too.
      allow list: if (request.query.limit <= 13 && resource.data.status in ['available','reserved'])
                  || (isAdmin() && request.query.limit <= 100);
      allow create: if isAdmin() && validItem(request.resource.data);
      allow update: if isAdmin() && validItem(request.resource.data)
                    && request.resource.data.createdAt == resource.data.createdAt;
      allow delete: if isAdmin();
    }

    match /{document=**} { allow read, write: if false; }
  }
}
```
Notes for the agent: (1) page size is 12, so public queries may use `limit(12)` (13 allowed for headroom). (2) A query with no `limit` is denied by design. (3) Confirm the public `where('status','in',[...])` query is accepted by the rules; if the emulator/console rejects it, relax only that clause, document it in BUILD_REPORT, and keep the limit check. (4) Admin UID is hard-coded in the rules file and replaced by the human (SETUP step 6).

### `firestore.indexes.json`
```json
{
  "indexes": [
    { "collectionGroup": "items", "queryScope": "COLLECTION",
      "fields": [ {"fieldPath":"status","order":"ASCENDING"}, {"fieldPath":"createdAt","order":"DESCENDING"} ] },
    { "collectionGroup": "items", "queryScope": "COLLECTION",
      "fields": [ {"fieldPath":"category","order":"ASCENDING"}, {"fieldPath":"status","order":"ASCENDING"}, {"fieldPath":"createdAt","order":"DESCENDING"} ] }
  ],
  "fieldOverrides": []
}
```
`firebase.json` contains only the `firestore` block (rules + indexes). No hosting, no functions.

## 6. Data access & quota design

- Everything goes through `ItemsRepo`:
  ```ts
  interface ItemsRepo {
    list(opts: { category?: string; cursor?: number }): Promise<{ items: Item[]; nextCursor: number | null; fromCache: boolean }>;
    get(id: string): Promise<Item | null>;
    // admin
    listAll(): Promise<Item[]>;                       // limit 50, admin only
    create(input: ItemInput): Promise<string>;
    update(id: string, input: ItemInput): Promise<void>;
    setStatus(id: string, status: Status): Promise<void>;
    remove(id: string): Promise<void>;
  }
  ```
- `firestoreRepo` uses `firebase/firestore/lite` only (`getDocs`, `getDoc`, `query`, `where`, `orderBy`, `limit`, `startAfter`, `addDoc`, `updateDoc`, `deleteDoc`, `serverTimestamp`). Cursor = last item's `createdAt` in ms → `startAfter(Timestamp.fromMillis(ms))`.
- **Cache** (`cache.ts`): memory `Map` + `localStorage` (`sh:v1:` prefix). TTL: list pages 10 min, single item 30 min. A cache hit costs 0 reads. On network/quota error, serve **stale** cache and show a small "Showing saved list" note. Admin writes call `clearCache()` locally.
- **Manual refresh** button on `/items` with 60 s cooldown.
- **Per-device read budget** (`readBudget.ts`): max 150 document reads per device per day (localStorage counter, resets at local midnight). When exhausted, serve cache only and show the friendly note. This stops bugs/loops and casual abuse from one device.
- **Dev read meter** (`readMeter.ts`): wraps `getDocs/getDoc`, logs `docs.length` in `import.meta.env.DEV` only; used to verify the acceptance numbers in AGENT §6.
- **Home and Items share one cache key** (`items:list:all:first`), so Home → Items costs nothing extra.

### Quota math (public)
Cold visitor ≈ 12 (first page) + 12 ("load more", optional) + ≤1 (direct item link) ≈ 25 reads. Repeat visits within 10 min ≈ 0.
50,000 ÷ 25 ≈ **2,000 cold visitors/day** before the daily quota is hit; realistic local-business traffic is a small fraction. Writes (admin only): a few dozen/day maximum. Storage: an item doc ≈ 1 KB → thousands of items fit in 1 GiB.

### Known residual risk (honest note)
A determined attacker could script reads against the public API (the Firebase web key is public by design) and exhaust the 50K/day quota → site shows cached data/Call button until reset. No money is lost. Phase 2 mitigations: Firebase App Check, edge-cached catalog endpoint (§13).

## 7. PWA & QR install

### Manifest (generated by `vite-plugin-pwa`)
```json
{
  "id": "/",
  "name": "<site.name>",
  "short_name": "<≤12 chars>",
  "description": "<site.tagline>",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#<accent>",
  "background_color": "#ffffff",
  "lang": "en",
  "icons": [
    {"src":"/icons/pwa-192.png","sizes":"192x192","type":"image/png"},
    {"src":"/icons/pwa-512.png","sizes":"512x512","type":"image/png"},
    {"src":"/icons/maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}
  ],
  "shortcuts": [{"name":"Browse items","url":"/items?source=shortcut"}]
}
```
Also: `<link rel="apple-touch-icon" href="/icons/apple-touch-180.png">`, `<meta name="theme-color">`, `<meta name="apple-mobile-web-app-capable" content="yes">`. Optional `screenshots` (narrow, 2 images) enable Chrome's richer install sheet.

### Service worker (Workbox via plugin, `registerType: 'autoUpdate'`)
- Precache the app shell (JS/CSS/HTML/icons). `navigateFallback: '/index.html'`, `navigateFallbackDenylist: [/^\/api\//]`.
- Runtime caching: `ik.imagekit.io` images → `CacheFirst`, cache `ik-images`, max 80 entries, 30 days, cacheable statuses `[0, 200]`.
- Do not cache Firestore or `/api` calls in the SW (the app-level cache handles data).
- This makes repeat image views free on ImageKit bandwidth and gives an offline experience.

### Install funnel (QR → installed in two taps)
```
QR print  ─►  https://<domain>/install?src=<poster|card|sticker|whatsapp|flyer|vehicle>
                 │
                 ├─ already running standalone?        → redirect to /
                 ├─ in-app browser (Instagram/FB/etc.)? → "Open in Chrome" panel + Copy-link button
                 ├─ Android/desktop Chrome with captured `beforeinstallprompt`
                 │        → big "Install app" button → prompt() → success screen "Open the app"
                 ├─ iOS Safari/Chrome                   → 3-step illustrated guide (Share → Add to Home Screen → Add)
                 └─ other browsers (Firefox, Samsung…)  → menu → "Install app / Add to Home screen"
                 Always visible below: Call button + "Continue in browser".
```
Key facts the UI must respect:
- A browser **cannot install silently**; one user tap on our button (user gesture) is required. The QR's job is to land people on the page that makes that tap obvious.
- `beforeinstallprompt` fires once, early: capture it in `main.tsx` **before** React mounts (`installStore.ts`).
- iOS has no install prompt API → manual guide.
- `InstallBanner` on normal pages: appears only after 2nd visit or after viewing an item, dismissible, remembered 14 days, hidden when standalone/installed.
- `src` is stored in `sessionStorage` (`sh:src`) for future analytics; no tracking in Phase 1.

## 8. ImageKit pipeline

**Upload (admin, in browser):**
1. User picks up to 4 images (`accept="image/jpeg,image/png,image/webp"`, camera or gallery; reject >15 MB raw).
2. `browser-image-compression`: `maxWidthOrHeight: 1280`, `maxSizeMB: 0.25`, `fileType: 'image/webp'` (fallback jpeg), `useWebWorker: true`.
3. `POST /api/imagekit-auth` with `Authorization: Bearer <Firebase ID token>` → `{ token, expire, signature }`.
4. `POST https://upload.imagekit.io/api/v1/files/upload` (multipart): `file`, `fileName`, `publicKey`, `signature`, `expire`, `token`, `folder=/scrap`, `useUniqueFileName=true`.
5. Response gives `{ url, fileId }` → stored in the item doc. If saving the doc then fails, best-effort `POST /api/imagekit-delete` for the just-uploaded files.

**Serve:** `ikUrl(url, { w, q })` appends `?tr=w-<w>,q-<q>,f-auto`. Sizes: card thumb `w-480,q-70`; detail hero `w-960,q-75`; gallery thumb `w-120`. `<img loading="lazy" decoding="async" width height>`; `onError` swaps to a neutral placeholder. Max ~60 KB per thumb → one 12-card page ≈ 0.7 MB → 20 GB/month ≈ 25K+ page views before the hard stop (the SW cache lowers this further).

**Delete:** `POST /api/imagekit-delete { fileId }` → `DELETE https://api.imagekit.io/v1/files/{fileId}` with Basic auth (`privateKey:`). Validate `fileId` with `/^[a-zA-Z0-9]{10,40}$/`.

## 9. Security architecture

### Threat model summary
| Threat | Mitigation |
|---|---|
| Stranger writes/deletes items | Rules: write only if `request.auth.uid == ADMIN_UID` + schema validation |
| Stranger gets ImageKit upload rights | `/api/imagekit-auth` requires valid Firebase ID token whose UID == `ADMIN_UID` (checked server-side via Identity Toolkit `accounts:lookup`, which also honours revocation) |
| Private key leak | Only in Vercel server env (`IMAGEKIT_PRIVATE_KEY`); never `VITE_`; CI-style grep of `dist/` |
| XSS | React escaping, no `dangerouslySetInnerHTML`, strict CSP, plain-text descriptions |
| Clickjacking | `frame-ancestors 'none'` + `X-Frame-Options: DENY` |
| Fake sign-ups on Firebase Auth | After the admin's first login, disable "Enable create (sign-up)" in Firebase Auth settings (if offered); app signs out any non-admin UID instantly; rules deny them anyway |
| API key abuse | Firebase web key restricted by HTTP referrer + API; separate server key restricted to Identity Toolkit API only |
| Unbounded/expensive queries | Rules require `limit`; repo enforces page size; per-device budget |
| Privacy | No public accounts, no forms, no analytics, no cookies; only localStorage for cache/preferences |

### `api/_lib/verifyAdmin.ts` (reference)
```ts
import type { VercelRequest } from '@vercel/node';

export type AdminCheck = { ok: true; uid: string } | { ok: false; status: number; msg: string };

export async function verifyAdmin(req: VercelRequest): Promise<AdminCheck> {
  const allowed = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (origin && !allowed.includes(origin)) return { ok: false, status: 403, msg: 'origin' };

  const m = /^Bearer (.+)$/.exec(req.headers.authorization ?? '');
  if (!m) return { ok: false, status: 401, msg: 'missing token' };

  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_SERVER_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: m[1] }) }
  );
  if (!r.ok) return { ok: false, status: 401, msg: 'invalid token' };
  const uid = (await r.json())?.users?.[0]?.localId as string | undefined;
  if (!uid || uid !== process.env.ADMIN_UID) return { ok: false, status: 403, msg: 'not admin' };
  return { ok: true, uid };
}
```

### `api/imagekit-auth.ts` (reference)
```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { verifyAdmin } from './_lib/verifyAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const v = await verifyAdmin(req);
  if (!v.ok) return res.status(v.status).json({ error: v.msg });

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 600; // must be < 1 hour
  const signature = crypto.createHmac('sha1', process.env.IMAGEKIT_PRIVATE_KEY!).update(token + expire).digest('hex');
  return res.status(200).json({ token, expire, signature });
}
```
`imagekit-delete.ts` is the same shape: POST only, `verifyAdmin`, validate `fileId`, call ImageKit's delete endpoint with `Authorization: Basic base64(privateKey + ':')`.
(Agent: confirm the signature scheme and endpoints against current ImageKit docs before finalising.)

### `vercel.json` (reference)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://apis.google.com; style-src 'self'; img-src 'self' data: blob: https://ik.imagekit.io; font-src 'self'; connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://upload.imagekit.io https://www.googleapis.com; frame-src https://accounts.google.com https://*.firebaseapp.com; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=()" },
      { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
    ]},
    { "source": "/sw.js", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
  ]
}
```
Agent: the Google sign-in popup may need extra CSP entries (`script-src`/`frame-src`/`connect-src`). Test `/admin` login in a production preview; widen **only** what the browser console reports as blocked, and record each addition in BUILD_REPORT. `camera=()` in Permissions-Policy must not block the file input's camera capture (it doesn't; it only blocks `getUserMedia`).
Verify `/api/*` still resolves with the catch-all rewrite (filesystem/functions take precedence on Vercel); if not, exclude `api/` in the rewrite source.

## 10. Environment variables

| Name | Where | Secret? | Purpose |
|---|---|---|---|
| `VITE_FIREBASE_API_KEY` | client | no (public, restrict by referrer) | Firebase web config |
| `VITE_FIREBASE_AUTH_DOMAIN` | client | no | `<project>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | client | no | |
| `VITE_FIREBASE_APP_ID` | client | no | |
| `VITE_IMAGEKIT_URL_ENDPOINT` | client | no | `https://ik.imagekit.io/<id>` |
| `VITE_IMAGEKIT_PUBLIC_KEY` | client | no | upload public key |
| `VITE_SITE_URL` | client | no | canonical URL, QR base |
| `VITE_USE_MOCK` | client (dev only) | no | `true` → in-memory data; build fails/ignores in prod |
| `IMAGEKIT_PRIVATE_KEY` | server | **YES** | signs uploads, deletes files |
| `FIREBASE_SERVER_API_KEY` | server | yes-ish | key restricted to Identity Toolkit API |
| `ADMIN_UID` | server | no (still keep out of client) | allow-listed admin |
| `ALLOWED_ORIGINS` | server | no | e.g. `https://yourdomain.com,https://yourproject.vercel.app` |

## 11. UI system (summary)
Tokens in `index.css` (`--bg, --fg, --muted, --accent, --accent-fg, --card, --border, --radius`), light/dark. Type: system font stack (no web fonts → faster, CSP-simple). Components stay <100 lines each. Item grid: 1 column <480px, 2 columns ≥480px, 3 ≥900px, 4 ≥1200px. Sticky header with brand + Call icon-button. Footer with contact + "Admin" link absent (admin reached by typing `/admin`).

Link builders (`links.ts`): `tel:${site.phoneE164}`, `https://wa.me/${digitsOnly(site.whatsappE164)}?text=${encodeURIComponent(`Hi, I'm interested in "${title}" ${url}`)}`, Maps `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapsQuery)}`. Share uses `navigator.share` with clipboard fallback.

## 12. Risks & decisions to be aware of
- **R1 – Vercel Hobby licence.** Vercel restricts the Hobby plan to non-commercial personal use; a site promoting a scrap business is plausibly "commercial". Options: (a) accept the risk, (b) Vercel Pro, (c) move to Cloudflare Pages (free, commercial use allowed; port the two API routes to Pages Functions) or Firebase Hosting (Spark includes free hosting; API routes would need another home). To keep this easy, the API handlers are small, dependency-free and use only `fetch` + `node:crypto`.
- **R2 – ImageKit hard stop.** If monthly bandwidth is exhausted, images stop; the app shows placeholders and the Call button still works. Keep photos small (enforced), max 4 per item.
- **R3 – QR ≠ silent install.** Documented in §7; the UX is built around it.
- **R4 – WhatsApp link previews.** A SPA can't give per-item previews when an item link is shared (all links preview as the home page). Phase 2 fix: an edge function that returns OG tags per item.

## 13. Phase 2 (explicitly OUT of scope for the build)
Edge-cached catalog endpoint (CDN `s-maxage` → caps Firestore reads at a few hundred/day regardless of traffic) · Firebase App Check · per-item Open Graph previews · analytics keyed on `src` · regional-language UI · "Wanted items" request list · sitemap generation from items.
