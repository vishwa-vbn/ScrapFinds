import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import crypto from 'node:crypto';

function devApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'dev-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        const url = new URL(req.url, 'http://localhost:5173');
        const pathname = url.pathname;

        res.setHeader('Content-Type', 'application/json');

        const authHeader = req.headers['authorization'] || '';
        const match = /^Bearer (.+)$/.exec(authHeader as string);
        const idToken = match ? match[1] : null;

        const apiKey = env.FIREBASE_SERVER_API_KEY || env.VITE_FIREBASE_API_KEY;
        const privateKey = env.IMAGEKIT_PRIVATE_KEY;
        const adminEmail = (env.ADMIN_EMAIL || env.VITE_ADMIN_EMAIL || 'vishwabnaik12@gmail.com').toLowerCase();

        async function checkAdmin() {
          if (!idToken) return { ok: false, status: 401, msg: 'Missing authorization token' };

          // 1. Fast decode check for admin identity from Firebase JWT payload
          try {
            const parts = idToken.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
              const email = payload.email?.toLowerCase();
              const uid = payload.user_id || payload.sub;
              if (
                uid === 'hgSPBxuZM7PNGsfJKMz5Syd66dJ3' ||
                email === 'vishwabnaik12@gmail.com' ||
                email === adminEmail
              ) {
                return { ok: true, email: email || adminEmail, uid: uid || 'hgSPBxuZM7PNGsfJKMz5Syd66dJ3' };
              }
            }
          } catch {
            // fallback to network lookup
          }

          // 2. Network verification fallback
          try {
            const resp = await fetch(
              `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
              }
            );
            if (!resp.ok) return { ok: false, status: 401, msg: 'Invalid token' };
            const data = (await resp.json()) as { users?: Array<{ localId?: string; email?: string }> };
            const email = data?.users?.[0]?.email?.toLowerCase();
            if (email !== adminEmail) {
              return { ok: false, status: 403, msg: `Access denied. Only ${adminEmail} is authorized.` };
            }
            return { ok: true, email, uid: data?.users?.[0]?.localId };
          } catch (e: unknown) {
            return { ok: false, status: 500, msg: (e as Error).message };
          }
        }

        if (pathname === '/api/whoami') {
          const authCheck = await checkAdmin();
          if (!authCheck.ok) {
            res.statusCode = authCheck.status || 401;
            return res.end(JSON.stringify({ error: authCheck.msg }));
          }
          res.statusCode = 200;
          return res.end(JSON.stringify({ ok: true, email: authCheck.email, uid: authCheck.uid }));
        }

        if (pathname === '/api/imagekit-auth') {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            return res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
          const authCheck = await checkAdmin();
          if (!authCheck.ok) {
            res.statusCode = authCheck.status || 401;
            return res.end(JSON.stringify({ error: authCheck.msg }));
          }
          if (!privateKey) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: 'IMAGEKIT_PRIVATE_KEY not configured' }));
          }
          const token = crypto.randomUUID();
          const expire = Math.floor(Date.now() / 1000) + 1800;
          const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');
          res.statusCode = 200;
          return res.end(JSON.stringify({ token, expire, signature }));
        }

        if (pathname === '/api/imagekit-delete') {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            return res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
          const authCheck = await checkAdmin();
          if (!authCheck.ok) {
            res.statusCode = authCheck.status || 401;
            return res.end(JSON.stringify({ error: authCheck.msg }));
          }
          let body = '';
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const { fileId } = JSON.parse(body || '{}');
              if (!fileId) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Missing fileId' }));
              }
              const ikAuth = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');
              const delResp = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
                method: 'DELETE',
                headers: { Authorization: ikAuth },
              });
              if (!delResp.ok && delResp.status !== 404) {
                res.statusCode = delResp.status;
                return res.end(JSON.stringify({ error: 'ImageKit delete failed' }));
              }
              res.statusCode = 200;
              return res.end(JSON.stringify({ ok: true }));
            } catch (err: unknown) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: (err as Error).message }));
            }
          });
          return;
        }

        if (pathname === '/api/translate') {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            return res.end(JSON.stringify({ error: 'Method not allowed' }));
          }
          const authCheck = await checkAdmin();
          if (!authCheck.ok) {
            res.statusCode = authCheck.status || 401;
            return res.end(JSON.stringify({ error: authCheck.msg }));
          }

          const geminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
          if (!geminiKey) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }));
          }

          let body = '';
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const { title, description, category, condition } = JSON.parse(body || '{}');
              const prompt = `You are a professional local second-hand and scrap item catalog copywriter in India.
Translate and adapt the following item listing into natural, clear Kannada (kn) and Hindi (hi) suitable for local second-hand buyers.

Item details:
- Category: ${category || 'general'}
- Condition: ${condition || 'good'}
- Title: ${title || ''}
- Description: ${description || ''}

Requirements:
1. Translate the title concisely into natural Kannada and Hindi (keep brand/model names in easily recognizable script or standard transliteration).
2. Translate the description into clear, conversational, buyer-friendly language highlighting the working condition.
3. Return ONLY a single raw valid JSON object with exact structure:
{
  "kn": {
    "title": "...",
    "description": "..."
  },
  "hi": {
    "title": "...",
    "description": "..."
  }
}
Do not wrap in markdown or backticks. Return valid JSON only.`;

              const gResp = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                      temperature: 0.2,
                      responseMimeType: 'application/json',
                    },
                  }),
                }
              );

              if (!gResp.ok) {
                const errText = await gResp.text();
                res.statusCode = gResp.status;
                return res.end(JSON.stringify({ error: `Gemini API error: ${errText}` }));
              }

              const gData: any = await gResp.json();
              const candidateText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (!candidateText) {
                res.statusCode = 502;
                return res.end(JSON.stringify({ error: 'No translation content returned' }));
              }

              const cleanJson = candidateText.replace(/^```json/i, '').replace(/```$/i, '').trim();
              res.statusCode = 200;
              return res.end(cleanJson);
            } catch (err: unknown) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: (err as Error).message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Refuse mock mode in production builds
  if (
    mode === 'production' &&
    (process.env.VITE_USE_MOCK === 'true' || env.VITE_USE_MOCK === 'true')
  ) {
    throw new Error(
      'Production build failed: VITE_USE_MOCK=true is not allowed in production builds. Remove VITE_USE_MOCK or set to false.'
    );
  }

  return {
    server: {
      port: 5173,
    },
    preview: {
      port: 4173,
    },
    plugins: [
      react(),
      tailwindcss(),
      devApiPlugin(env),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
          type: 'module',
        },
        includeAssets: ['favicon.svg', 'icons/*.png', 'robots.txt'],
        manifest: {
          id: '/',
          name: 'ScrapFinds',
          short_name: 'ScrapFinds',
          description: 'Good condition recovered items. Call to collect',
          start_url: '/?source=pwa',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#16a34a',
          background_color: '#ffffff',
          lang: 'en',
          categories: ['shopping', 'business'],
          icons: [
            { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [{ name: 'Browse items', url: '/items?source=shortcut' }],
        },
        workbox: {
          navigateFallback: '/index.html',
          navigateFallbackAllowlist: [/^(?!\/__).*/],
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/ik\.imagekit\.io\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'ik-images',
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/firestore/lite', 'firebase/auth'],
          },
        },
      },
    },
  };
});
