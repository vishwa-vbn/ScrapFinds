# SETUP.md — Human checklist (accounts, keys, deploy)

The build agent creates all code. **You** do the account steps below (about 30–40 minutes). Never paste secrets into chat or commit them.

Order matters. Tick as you go.

---

## 0. Before you start
- [ ] A Google account for the owner/admin (this will be the only admin).
- [ ] A GitHub account (to connect Vercel).
- [ ] Decide the public name and phone numbers; edit `src/config/site.ts` (placeholders marked `TODO(owner)`).
- [ ] Decide on hosting licence: Vercel **Hobby is for non-commercial personal use only**. A site that promotes a business may need Vercel Pro, or switch to Cloudflare Pages/Firebase Hosting. Decide before going live. (See ARCHITECTURE §12.)

## 1. Create the Firebase project (stay on Spark — never add billing)
1. console.firebase.google.com → **Add project** → name it (e.g. `scraphub-prod`). Disable Google Analytics (not needed).
2. **Build → Firestore Database → Create database** → *Standard edition*, **production mode**, pick the region closest to your users (cannot be changed later; for India use `asia-south1` Mumbai if available).
3. **Build → Authentication → Get started → Sign-in method → Google → Enable**. Set a support email.
4. **Project settings → Your apps → Web (`</>`)** → register app → copy the config values (`apiKey`, `authDomain`, `projectId`, `appId`).
5. Confirm **Usage and billing** shows **Spark (no-cost)**. Do **not** upgrade.

## 2. Create ImageKit account (free)
1. imagekit.io → sign up (free plan, no card).
2. **Developer options → API keys**: copy **URL endpoint** (`https://ik.imagekit.io/<id>`), **Public key**, and **Private key**.
3. Create a folder named `scrap` in the Media Library (optional; the upload creates it).
4. Check the dashboard usage page so you know your actual bandwidth/storage limits. Free bandwidth is a hard stop for the month.

## 3. Get the code on GitHub
1. Run the agent with `docs/INITIAL_PROMPT.md` and let it finish.
2. Review `docs/BUILD_REPORT.md`.
3. Create a GitHub repo and push the project.

## 4. Create the two Google Cloud API keys (security)
In **console.cloud.google.com → your Firebase project → APIs & Services → Credentials**:
1. Open the auto-created **Browser key** (used as `VITE_FIREBASE_API_KEY`):
   - Application restrictions → **HTTP referrers** → add `https://YOUR-DOMAIN/*`, `https://YOUR-PROJECT.vercel.app/*`, `http://localhost:5173/*`.
   - (Optional) API restrictions: Identity Toolkit API, Token Service API, Cloud Firestore API.
2. **Create credentials → API key** → name it `server-identitytoolkit` → API restrictions: **Identity Toolkit API only**; no referrer restriction. Copy it → this is `FIREBASE_SERVER_API_KEY` (server only).

## 5. Deploy to Vercel
1. vercel.com → **Add New → Project** → import the GitHub repo. Framework preset: **Vite**.
2. **Settings → Environment Variables** (Production + Preview):

| Variable | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | from step 1.4 |
| `VITE_FIREBASE_AUTH_DOMAIN` | from step 1.4 |
| `VITE_FIREBASE_PROJECT_ID` | from step 1.4 |
| `VITE_FIREBASE_APP_ID` | from step 1.4 |
| `VITE_IMAGEKIT_URL_ENDPOINT` | step 2.2 |
| `VITE_IMAGEKIT_PUBLIC_KEY` | step 2.2 |
| `VITE_SITE_URL` | `https://YOUR-DOMAIN` (no trailing slash) |
| `IMAGEKIT_PRIVATE_KEY` | step 2.2 (**secret**) |
| `FIREBASE_SERVER_API_KEY` | step 4.2 |
| `ADMIN_UID` | filled in step 6 |
| `ALLOWED_ORIGINS` | `https://YOUR-DOMAIN,https://YOUR-PROJECT.vercel.app` |

   Do **not** set `VITE_USE_MOCK` in Vercel.
3. Deploy. Optionally attach your custom domain (Vercel → Domains) and wait for HTTPS.
4. Firebase console → **Authentication → Settings → Authorized domains** → add your Vercel domain and custom domain.

## 6. Find the admin UID and lock the database
1. Open `https://YOUR-DOMAIN/admin` and sign in with the owner Google account once (the app will say "not allowed" because `ADMIN_UID` isn't set yet — that's expected).
2. Firebase console → **Authentication → Users** → copy the **User UID** of the owner.
3. Vercel → set `ADMIN_UID` to that value → **Redeploy**.
4. In the repo, edit `firestore.rules`: replace `REPLACE_WITH_ADMIN_UID` with the UID. Commit.
5. Install the CLI and deploy rules + indexes (needs only your Google login, no billing):
   ```
   npm i -g firebase-tools
   firebase login
   firebase use YOUR_PROJECT_ID
   npm run rules:deploy
   ```
   (Or paste `firestore.rules` into **Firestore → Rules → Publish**, and create the two indexes from `firestore.indexes.json` via the console links Firebase prints when a query first needs them.)
6. Firebase **Authentication → Settings → User actions**: if you see **"Enable create (sign-up)"**, turn it **off** now that the admin account exists.

## 7. First content & test
- [ ] Sign in at `/admin`, add 3–5 items with photos (speaker, phone, bicycle…).
- [ ] Open the site in a private window on your phone: list loads, item opens, **Call** dials, **WhatsApp** opens with a prefilled message.
- [ ] Turn on airplane mode: the app still opens; Call still works.
- [ ] Try writing from the browser console as an anonymous user (should fail) — optional.
- [ ] Firebase console → Firestore → **Usage**: reads look small.

## 8. QR codes
1. `SITE_URL=https://YOUR-DOMAIN npm run qr`, then `npm run marketing`.
2. Open `marketing/poster-a4.html` → print to PDF. Test every QR with an Android phone and an iPhone **before printing in bulk**.
3. Follow `docs/MARKETING_QR.md`.

## 9. Ongoing care (5 minutes/month)
- Check ImageKit usage (bandwidth) and Firestore usage dashboards.
- Use **Clean up sold** in the admin to remove old items and their photos.
- Keep the Firebase project on Spark; never link a billing account.

## Troubleshooting
| Symptom | Likely cause |
|---|---|
| Google sign-in popup blocked / error `auth/unauthorized-domain` | Domain missing in Firebase Auth authorized domains |
| Sign-in works but "not allowed" | `ADMIN_UID` not set/redeployed, or wrong account |
| `permission-denied` on public list | Rules not deployed, or query lacks `limit` / status filter |
| "The query requires an index" | Create the index from the link in the error, or deploy `firestore.indexes.json` |
| Upload fails 401/403 | `FIREBASE_SERVER_API_KEY` wrong/over-restricted, or origin missing from `ALLOWED_ORIGINS` |
| Images missing | ImageKit monthly bandwidth exhausted, or wrong `VITE_IMAGEKIT_URL_ENDPOINT` |
| No install button on Android | Not HTTPS, already installed, or opened in an in-app browser — open in Chrome |
| Blank page after deploy | Missing `VITE_` variables (they're baked in at build time → redeploy after changing) |
