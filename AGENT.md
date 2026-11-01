# AGENT.md — Rules for the Build Agent (ScrapHub)

> Read this file FIRST and completely. Then read, in order: `docs/ARCHITECTURE.md`, `docs/SKILLS.md`, `docs/SETUP.md`, `docs/MARKETING_QR.md`.
> If any file conflicts with this one, **this file wins**.

Working name: **ScrapHub** (rename via `src/config/site.ts` only).

---

## 1. Mission

Build a **tiny, secure, installable PWA** for a family scrap-collection business.

1. Show the owner's contact details with one-tap **Call** and **WhatsApp**.
2. List good-condition recovered items (speakers, mobiles, repairable bicycles, etc.) as **available items** with photos and details.
3. Visitors browse, then **call** to arrange a hand-to-hand pickup.

**There is NO money in this app**: no prices, no cart, no checkout, no payments, no user accounts for the public, no forms that collect personal data.

Success = a phone-first site that loads fast on a cheap Android phone over weak 4G, installs from a QR code in two taps, and **cannot generate a bill**.

---

## 2. Non-negotiables (violating any of these is a failed build)

### 2.1 Zero-cost guarantees
- Firebase project stays on the **Spark (no-billing)** plan. Never add code or config that requires Blaze (no Cloud Functions, no Cloud Storage for Firebase, no TTL policies, no backups, no Extensions).
- Firestore usage must stay far below Spark daily quota (50K reads / 20K writes / 20K deletes per day, 1 GiB stored).
- **Forbidden:** `onSnapshot`, realtime listeners, polling, `setInterval` data refreshes, refetch-on-focus, fetching "all" documents, unbounded queries.
- **Required:** use `firebase/firestore/lite` (REST, no listeners possible), page size 12, the TTL cache described in `SKILLS.md` (skill 1), and the per-device daily read budget.
- Images live on **ImageKit** (free plan). Compress client-side before upload; serve thumbnails through URL transforms. Never serve original-size images in lists.
- Hosting is Vercel. No paid add-ons, no paid analytics, no third-party SaaS beyond Firebase, ImageKit, Vercel.

### 2.2 Security
- Public users can only **read** `items`. Only the single admin UID can write. Enforced in `firestore.rules` (not just in the UI).
- Admin = Firebase Auth **Google sign-in**, allow-listed by UID. No passwords stored anywhere.
- ImageKit **private key never reaches the browser**. Signed uploads go through `/api/imagekit-auth`, which verifies the Firebase ID token AND the admin UID server-side.
- No `dangerouslySetInnerHTML`, no `eval`, no inline event handlers, no user-supplied URLs rendered as links (phone/WhatsApp links are built from `site.ts` only).
- Ship strict security headers + CSP via `vercel.json` (see ARCHITECTURE §9).
- `/admin` is `noindex`, not linked from public UI, and lazy-loaded (admin code and Firebase Auth are not in the public bundle).
- Never commit secrets. Only `.env.example` with placeholders is committed.

### 2.3 Simplicity
- One small SPA. No SSR, no state-management library, no UI component library, no CSS-in-JS, no ORM.
- Every dependency must earn its place. Prefer platform features (`<dialog>`, CSS scroll-snap, `fetch`, `Intl`, Web Share API).
- Contact details are **static config** (`src/config/site.ts`), never fetched. **The Call button must work even if Firestore, ImageKit and the network are all down.**

---

## 3. Fixed stack (do not substitute)

| Layer | Choice |
|---|---|
| Build | Vite + React 19 + TypeScript (`strict: true`) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), design tokens as CSS variables |
| Routing | `react-router-dom` (admin routes via `React.lazy`) |
| Data | Firebase Firestore **lite** SDK; Firebase Auth (admin chunk only) |
| Validation | `zod` (client forms + parsing Firestore docs) |
| Images | ImageKit (URL transforms + signed direct upload) + `browser-image-compression` |
| PWA | `vite-plugin-pwa` (Workbox) + `@vite-pwa/assets-generator` |
| API | Vercel Node functions in `/api` (zero extra dependencies: `node:crypto` + `fetch`) |
| Tests | Vitest (unit). Lighthouse run manually in browser. |
| QR | `qrcode` npm package via `scripts/generate-qr.mjs` |

Use the latest **stable** versions. Before using any library API, check its current docs or `npm view <pkg>`; do not rely on memory for APIs that change (Tailwind v4, vite-plugin-pwa, react-router, Firebase modular SDK).

---

## 4. Coding standards
- TypeScript strict, no `any`, no `// @ts-ignore`. Zod-parse everything coming from Firestore and from `/api` responses.
- Small files (<200 lines), named exports, feature folders as in ARCHITECTURE §3.
- Data access ONLY through `src/lib/repo` (interface `ItemsRepo`). Pages never import Firebase directly.
- All time values cached as epoch **milliseconds** (numbers), never Firestore `Timestamp` objects.
- Accessibility: semantic HTML, labels on all inputs, visible focus ring, tap targets ≥ 44×44 px, contrast WCAG AA, `alt` text from item title, respects `prefers-reduced-motion`.
- All user-visible strings in `src/config/strings.ts` (keeps future translation easy). English only in Phase 1.
- Errors: every async path has loading, empty and error UI. Failed data fetch must show cached/stale data or a friendly message **plus the Call button**.
- No console noise in production builds. Dev-only `readMeter` logs Firestore reads.

---

## 5. UI rules
- Mobile-first (design at 390×844, scale up to 1280). Single column, generous spacing, large type (base 16–18px).
- Palette: neutral background, one strong accent (green or amber for "recycle/scrap"), high-contrast text. Light + dark via `prefers-color-scheme`.
- Cards: 4:3 image (`aspect-ratio`, explicit width/height → no layout shift), title (2 lines max), category + condition badges, status badge when Reserved.
- Always-visible primary action: sticky bottom bar on item detail with **Call** and **WhatsApp**.
- Skeleton loaders (no spinners-only screens). Friendly empty state ("No items right now — call us, we get new stock often").
- Disclaimer on item detail: "Items are given as-is. Please check the item when you collect it."

---

## 6. Workflow you must follow

1. **Plan first**: produce a short implementation plan (file tree + milestone list). Don't wait for approval unless something is truly ambiguous; make the most reasonable choice and record it in `docs/BUILD_REPORT.md`.
2. **Build in this order** (all within this single run):
   1. Scaffold + tooling + config files + `.env.example`
   2. Types, zod schemas, `site.ts`, categories, strings
   3. `repo` layer: `mockRepo` (in-memory, DEV only) and `firestoreRepo`, cache, read meter, daily budget
   4. Public UI: Home, Items, ItemDetail, NotFound, layout, install banner
   5. PWA: manifest, icons, service worker, `/install` page
   6. Admin: login, dashboard, create/edit form with image upload, mark reserved/sold, delete
   7. `/api` functions (`imagekit-auth`, `imagekit-delete`, `whoami`)
   8. `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `vercel.json`
   9. QR generator + printable A4 poster + visiting-card template
   10. Tests, lint, typecheck, production build, bundle-size check
3. **Verify** with the browser tool at 390×844 and 1280×800: home, items, item detail, install page, offline mode (DevTools offline), and the Lighthouse PWA/performance/accessibility audit. Fix issues before finishing.
4. Write `docs/BUILD_REPORT.md`: what was built, decisions, deviations, Lighthouse scores, bundle sizes, anything the human must still do from `SETUP.md`.

### Definition of done
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build` all pass
- [ ] App fully usable in **mock mode** (`VITE_USE_MOCK=true npm run dev`) including admin CRUD
- [ ] Production build **refuses** mock mode
- [ ] Public JS ≤ 150 KB gzipped on first load; admin code in a separate lazy chunk
- [ ] Lighthouse (mobile): Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90, installable PWA
- [ ] No `onSnapshot`, no `setInterval` fetch, no secret in the client bundle (`grep` the `dist/` folder for `IMAGEKIT_PRIVATE`)
- [ ] Home page cold load costs ≤ 12 Firestore reads; navigating Home → Items → Item detail costs 0 additional reads (verified via `readMeter`)
- [ ] `docs/BUILD_REPORT.md` written

---

## 7. Secrets and external accounts
- You do **not** have, and must not ask for, Firebase/ImageKit/Vercel secrets. Use placeholders; the human completes `docs/SETUP.md` afterwards.
- Never print or log env values. Never write real keys into any committed file.
- Server-only variables must NOT start with `VITE_`.

## 8. When unsure
Choose the option that is **cheaper, simpler and more secure**, and note it in `BUILD_REPORT.md`. Do not add features that are not in `ARCHITECTURE.md` (Phase 2 list is explicitly out of scope).
