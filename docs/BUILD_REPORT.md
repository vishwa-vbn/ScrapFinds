# BUILD_REPORT.md — ScrapHub Phase 1

**Date:** October 31, 2026  
**Status:** Build Complete & Verified  
**Workspace:** `c:\Users\vishw\projects\ScrapFinds`

---

## 1. Executive Summary

ScrapHub Phase 1 has been built, tested, and verified according to `AGENT.md`, `ARCHITECTURE.md`, `SKILLS.md`, `SETUP.md`, and `MARKETING_QR.md`.

The application is a lightweight, mobile-first, installable Progressive Web App (PWA) with zero online payments, designed for a family scrap-collection business. It connects visitors directly with the business owner via one-tap **Call** and **WhatsApp** actions to inspect and collect good-condition recovered items (audio, phones, cycles, electronics, appliances, etc.).

All code adheres strictly to the zero-cost architecture on the Firebase Spark free plan, ImageKit free tier, and Vercel hosting.

---

## 2. Milestones Summary

| Milestone | Description | Status |
|---|---|---|
| **M1: Tooling & Scaffold** | Node 22 + npm 10, Vite 6, React 19, TypeScript strict, Tailwind CSS v4, vite-plugin-pwa, vitest, eslint 9 flat config. | Complete |
| **M2: Config Layer** | `src/config/site.ts` (business details, phone, address, timings), `src/config/categories.ts`, `src/config/strings.ts`. | Complete |
| **M3: Types & Schemas** | Zod schemas for items, conditions, statuses, images in `src/types/item.ts`. | Complete |
| **M4: Data Layer** | `firestoreRepo` (`firebase/firestore/lite` only), `mockRepo` (10 seeded items with local SVGs), `cache.ts` (TTL + stale fallback), `readBudget.ts` (150 reads/day limit), `readMeter.ts` (DEV read tracking). | Complete |
| **M5: Lib Utilities** | `links.ts` (tel, wa.me, Google Maps, Web Share), `imagekit.ts` (client compression, signed upload, delete), `installStore.ts`, `platform.ts`, `useInstall.ts`. | Complete |
| **M6: Components** | Badge, Skeleton, EmptyState, ErrorState, CallButton, WhatsAppButton, Header, Footer, ContactBar, ItemCard, ItemGrid, CategoryChips, SearchBox, Gallery, InstallBanner, OfflineBanner, ErrorBoundary. | Complete |
| **M7: Public Pages** | Home (`/`), Items listing (`/items`), Item Detail (`/item/:id`), Install landing (`/install`), 404 (`*`). | Complete |
| **M8: Admin Chunk** | Lazy chunk with Google sign-in (`/admin`), AdminGuard, Dashboard (`/admin/items`), ItemForm (`/admin/items/new`, `/admin/items/:id/edit`), Clean up sold items. Mock admin login enabled in dev. | Complete |
| **M9: API Functions** | `/api/imagekit-auth`, `/api/imagekit-delete`, `/api/whoami`, `verifyAdmin.ts` with HMAC SHA1 signature and Firebase ID token verification. | Complete |
| **M10: Static & Rules** | `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `vercel.json` (CSP + security headers), `pwa-assets-generator` icons, 10 mock placeholder SVGs. | Complete |
| **M11: Marketing & QR** | `scripts/generate-qr.mjs` (6 channels), `scripts/make-marketing.mjs` (A4 printable poster + visiting card), `scripts/check-dist.mjs`. | Complete |
| **M12: Tests** | 23 Vitest unit tests covering cache, budget, imagekit URL transform, link generation, zod schemas, and platform detection. | Complete |
| **M13: Verification** | Full test suite, lint, typecheck, production build, mock mode rejection test, bundle size audit. | Complete |

---

## 3. Verification & Quality Gates

### 3.1 Automated Test Suite (`npm run test`)
Vitest executed 23 unit tests across 6 suites with 100% pass rate:
- `cache.test.ts`: Cache retrieval, TTL expiry, stale fallback on failure, cache clearing.
- `readBudget.test.ts`: Read allowance tracking and enforcement of 150 reads/day limit.
- `imagekit.test.ts`: ImageKit URL transforms with dimensions, quality, and format flags; pass-through for mock URLs.
- `links.test.ts`: E.164 phone formatting for `tel:`, URL encoding for `wa.me`, Google Maps query encoding.
- `itemSchema.test.ts`: Zod validation for valid items, partial input schema, and rejection of invalid data (empty title, missing images, invalid status).
- `platform.test.ts`: Detection of iOS, Android, in-app webviews (Instagram/Facebook), and standalone PWA display mode.

### 3.2 TypeScript Typecheck (`npm run typecheck`)
- `tsc -b --noEmit` passed with 0 errors across `src/`, `api/`, and `scripts/`.
- Strict mode enabled (`noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`).

### 3.3 Linting (`npm run lint`)
- ESLint flat config with TypeScript-ESLint passed with 0 errors and 0 warnings.

### 3.4 Production Build & Bundle Audit
- `npm run build` compiled all assets into `dist/` with PWA service worker generation.
- `node scripts/check-dist.mjs` verified:
  - **No leaked secrets:** Scanned all `.js`, `.html`, `.css`, and `.map` files in `dist/` for private keys or server tokens (`IMAGEKIT_PRIVATE`, `BEGIN PRIVATE KEY`, `ADMIN_UID`).
  - **Initial JS bundle size:** `100.5 KB` gzipped (Strict requirement: ≤ 150 KB gzipped).
  - **Admin code splitting:** Admin pages and Firebase Auth are completely separated into lazy chunks (`Login`, `Dashboard`, `ItemForm`, `AdminGuard`, `useAdminAuth`), absent from the initial visitor bundle.

### 3.5 Production Mock Mode Rejection Test
- Executed build with `VITE_USE_MOCK=true`.
- Build successfully **FAILED** with exit code 1 and error message:  
  `Production build failed: VITE_USE_MOCK=true is not allowed in production builds. Remove VITE_USE_MOCK or set to false.`
- Confirmed that mock mode is structurally prohibited in production builds.

### 3.6 Dev Server & Mock Mode Test
- Started Vite dev server (`npm run dev`).
- Verified HTTP 200 responses on all public and admin routes:
  - `/` (Home page with hero, available now, how it works, what we collect, contact bar)
  - `/items` (Category chips, search bar, item cards)
  - `/item/mock-1` (Item detail with gallery, badges, description, disclaimer, sticky action bar)
  - `/install` (PWA install funnel with device detection)
  - `/admin` (Owner login screen)
  - `/mock/placeholder-1.svg` (SVG assets)

---

## 4. Quota & Security Compliance

1. **Firestore Spark Zero-Cost Guarantees:**
   - Public visitors only use `firebase/firestore/lite` (REST queries only; zero listeners, zero `onSnapshot`).
   - Page size fixed at 12 with cursor pagination (`createdAt` ms).
   - Client cache TTL: 10 minutes for lists, 30 minutes for single items.
   - Home and Items share cache key `items:list:all:first` (Home → Items navigation costs 0 additional reads).
   - Stale cache fallback ensures the app remains readable offline or when quota is reached.
   - Per-device read budget limits reads to 150/day in `localStorage`.
   - Admin writes automatically clear client cache (`clearCache()`).

2. **Image Storage & Bandwidth:**
   - Image uploads use `browser-image-compression` to resize to ≤ 1280px and ≤ 250 KB WebP before upload.
   - ImageKit serves resized thumbnails via URL transforms (`w-480` for cards, `w-960` for detail hero, `w-120` for gallery thumbs).
   - Workbox service worker caches ImageKit assets (`CacheFirst`, max 80 entries, 30 days) to prevent repeat bandwidth costs.

3. **Security & Permissions:**
   - `firestore.rules` enforces admin-only writes via UID matching and strict schema validation.
   - Public list queries require `limit <= 13` and visible status filter (`available`, `reserved`).
   - `/api/imagekit-auth` and `/api/imagekit-delete` verify caller's Firebase ID token against `ADMIN_UID` server-side via Google Identity Toolkit API.
   - Strict Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security` configured in `vercel.json`.

---

## 6. UI/UX Redesign & PWA Installability Refinements

In response to design review:
1. **Replacement of All Emojis with Custom SVG Vector Icons**:
   - Replaced all inline emojis across the entire codebase (`♻`, `📞`, `💬`, `📍`, `📦`, `📷`, `🔄`, `💾`, `🔒`, `🧹`, `🗑`, `🎉`, etc.) with dedicated SVG vector components in `src/components/Icons.tsx`.
   - Category chips and badges now render vector icons (`AudioIcon`, `PhoneIcon`, `BicycleIcon`, `ElectronicsIcon`, `AppliancesIcon`, `FurnitureIcon`, `ToolsIcon`, `PackageIcon`).
   - Clean, professional aesthetic with consistent strokes (`strokeWidth="2"`), alignment, and color tokens.

2. **Fixing Layout Overlaps and Spacing**:
   - Removed `-my-2` negative vertical margin from `CategoryChips` that pulled down adjacent elements and overlapped with `SearchBox`.
   - Increased container padding across all views (`max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8`).
   - Responsive scrap collection grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5`) with padded pills so long texts never overflow or collide on narrow screens.
   - Fixed sticky action bar overlap on `ItemDetail`: added `pb-40` bottom margin and backdrop blur styling so that sticky call/whatsapp buttons never collide with footer or item content.
   - Restructured "How it Works" step cards with clean typography and spacing.

3. **Chrome Omnibox Install Prompt & PWA Downloadability**:
   - Added explicit `<link rel="manifest" href="/manifest.webmanifest" />` into `index.html` `<head>` so Chrome immediately discovers the manifest.
   - Enabled `devOptions: { enabled: true, type: 'module' }` in `VitePWA` so that the service worker is active during both development (`npm run dev`) and production.
   - Added `registerSW({ immediate: true })` in `src/main.tsx` via `virtual:pwa-register`.
   - Updated manifest icons with explicit `purpose: 'any'` and `purpose: 'maskable'` metadata meeting all Chrome installability criteria (showing the install button in Chrome's address bar / omnibox).

---

## 7. Human Next Steps (from `SETUP.md`)

Before taking the app live:
1. **Configure Business Details:** Review and edit placeholders marked `TODO(owner)` in `src/config/site.ts`.
2. **Create Firebase Project:** Follow `SETUP.md` §1 (stay on Spark plan, enable Google sign-in).
3. **Create ImageKit Account:** Follow `SETUP.md` §2 (copy endpoint, public key, and private key).
4. **Deploy to Vercel:** Follow `SETUP.md` §5 (configure environment variables).
5. **Set Admin UID:** Sign in once at `/admin`, retrieve UID from Firebase Console, set `ADMIN_UID` in Vercel, and update `firestore.rules`.
6. **Deploy Rules:** Run `npm run rules:deploy` or deploy via Firebase Console.
7. **Print Marketing Assets:** Run `SITE_URL=https://your-domain.com npm run qr`, open `marketing/poster-a4.html` and `marketing/visiting-card.html`, and print.
