# INITIAL_PROMPT.md — Paste this into the Antigravity agent

**Before you paste:** create an empty project folder, put `AGENT.md` in the root, and put `ARCHITECTURE.md`, `SKILLS.md`, `SETUP.md`, `MARKETING_QR.md` in a `docs/` folder. Open the folder as the workspace. Use a high-capability model and let the agent run to completion.

---

## PROMPT (copy everything below this line)

You are the build agent for **ScrapHub**, a tiny, secure, installable PWA for a family scrap-collection business. Build the **entire Phase 1 product in this single run**.

### Step 0 — Read the specification (mandatory)
Read these files completely, in this order, before writing any code:
1. `AGENT.md` — your operating rules. It overrides everything else.
2. `docs/ARCHITECTURE.md` — the system design, data model, rules, API, security, PWA/QR design.
3. `docs/SKILLS.md` — step-by-step playbooks and reference code for each subsystem.
4. `docs/SETUP.md` — what the human will configure afterwards (so you generate the right config/env files).
5. `docs/MARKETING_QR.md` — QR and print asset requirements.

### Product in one paragraph
A mobile-first website where visitors see the owner's contact details (one-tap **Call** and **WhatsApp**) and browse a clean list of **good-condition recovered items** (speakers, mobiles, repairable bicycles, etc.) with photos and details. There is **no money anywhere**: no prices, cart, payments or public accounts. Visitors call the owner and collect items hand-to-hand. The owner signs in with Google at `/admin` to add/edit/reserve/mark-sold/delete items and upload photos. The app is installable as a PWA, and printed QR codes land people on `/install`, which guides them to install in two taps.

### Hard constraints (summary — full list in AGENT.md)
- **Zero-cost safe:** Firebase Spark plan only; Firestore via `firebase/firestore/lite`; **no listeners/polling**; page size 12; TTL cache + per-device read budget; images on ImageKit with client-side compression and URL-transform thumbnails; Vercel hosting.
- **Secure:** public read-only Firestore, admin-only writes by UID in `firestore.rules` with schema validation and required `limit`; Google sign-in admin; signed ImageKit uploads via `/api/imagekit-auth` that verifies the Firebase ID token + admin UID; private key server-side only; strict CSP and security headers in `vercel.json`; admin code lazy-loaded and `noindex`.
- **Simple:** Vite + React 19 + TypeScript strict + Tailwind v4 + react-router + zod. No UI kits, no state libraries, no SSR. Contact details are static config so **Call works even if every backend is down**.

### Scope — build ALL of this now
1. **Project scaffold & tooling:** `package.json` scripts (`dev build preview typecheck lint test icons qr marketing rules:deploy`), TypeScript strict, ESLint, Vitest, Tailwind v4, `.env.example`, `.gitignore`.
2. **Config:** `src/config/site.ts` (name, tagline, owner, phone display/E.164, WhatsApp, address, maps query, hours, service areas, what we collect) with clearly marked `TODO(owner)` placeholders; `categories.ts`; `strings.ts`.
3. **Data layer:** zod schemas, `ItemsRepo` interface, `firestoreRepo` (lite SDK), `mockRepo` (in-memory, DEV-only), `cache.ts`, `readBudget.ts`, `readMeter.ts`. Production build must refuse mock mode.
4. **Public UI:** Home, Items (category chips, client-side search, Load more, refresh with cooldown), ItemDetail (swipe gallery, badges, as-is disclaimer, sticky Call/WhatsApp/Share bar), 404, Header/Footer, skeletons, empty/error/offline states, light/dark themes.
5. **PWA:** manifest, generated icons (192/512/maskable/apple-touch), Workbox service worker (app-shell precache + ImageKit image CacheFirst), install-prompt capture in `main.tsx`, `InstallBanner`, and the `/install` QR landing page with the full decision tree (already standalone, in-app browser, Android/desktop prompt, iOS guide, other browsers) that always shows Call and "Continue in browser".
6. **Admin:** Google login, guard (via an `/api/whoami` probe), dashboard list with quick actions (Reserve / Mark sold / Edit / Delete / Clean up sold), item form with up to 4 compressed photos, progress, cleanup of orphaned images.
7. **API routes:** `api/_lib/verifyAdmin.ts`, `api/imagekit-auth.ts`, `api/imagekit-delete.ts`, `api/whoami.ts` — dependency-free (`fetch` + `node:crypto`). Confirm the ImageKit signature scheme and endpoints against current docs.
8. **Backend config:** `firestore.rules`, `firestore.indexes.json`, `firebase.json` (firestore only), `vercel.json` (SPA rewrite, CSP, headers, cache headers). Keep the `REPLACE_WITH_ADMIN_UID` placeholder.
9. **Marketing tooling:** `scripts/generate-qr.mjs`, `scripts/make-marketing.mjs` producing `marketing/poster-a4.html` and `marketing/visiting-card.html` with embedded QR (using a placeholder site URL unless `SITE_URL` is set).
10. **SEO basics:** per-route titles/meta, `robots.txt` (disallow `/admin`), static `sitemap.xml`, OG image placeholder.
11. **Quality gates:** unit tests (cache, readBudget, ikUrl, links, schema, platform helpers), `scripts/check-dist.mjs` (secret grep + bundle size check).

### Explicitly OUT of scope
Prices/payments, public accounts, comments/forms, analytics, App Check, edge-cached catalog, per-item OG previews, translations, Cloud Functions, Cloud Storage for Firebase, any paid service. (Listed as Phase 2 in the architecture.)

### How to work
1. First produce a brief **implementation plan** (file tree + ordered milestones from AGENT.md §6). Don't pause for approval; decide sensibly and log decisions.
2. Implement milestone by milestone. Use mock mode so the app is fully usable **before any real Firebase/ImageKit keys exist**.
3. You do **not** have secrets and must **never** ask for or invent them. Use placeholders; the human follows `docs/SETUP.md` after you finish.
4. Verify as you go: run typecheck, lint, tests and the production build; fix failures yourself.
5. **Use the browser tool** to verify in mock mode at 390×844 and 1280×800: home, items (filter/search/load more), item detail, install page (simulate the states), admin CRUD, offline mode. Run Lighthouse (mobile) and fix until targets are met: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90, installable PWA. Capture screenshots into `docs/screenshots/`.
6. Run `node scripts/check-dist.mjs` and confirm: no secrets in `dist/`, initial JS ≤ 150 KB gzipped, admin chunk separate, no `onSnapshot`/`setInterval` data refresh anywhere.

### Deliverables
- The complete working project in this workspace.
- `docs/BUILD_REPORT.md` containing: what was built, file tree, decisions & deviations (with reasons), CSP additions you had to make, Lighthouse scores, bundle sizes, read-meter results (home cold load ≤ 12 reads; Home→Items→Item = 0 extra), test results, and a precise **"Human TODO"** list mapped to `docs/SETUP.md` steps.
- Final message: a short summary of the outcome and the 3 most important things the human must do next.

### Definition of done
Everything in `AGENT.md §6 → Definition of done` passes. If any item cannot be met, say exactly which and why in `BUILD_REPORT.md` rather than hiding it.

Begin with Step 0 now.
