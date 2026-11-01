import type { VercelRequest } from '@vercel/node';

export type AdminCheck = { ok: true; uid: string } | { ok: false; status: number; msg: string };

export async function verifyAdmin(req: VercelRequest): Promise<AdminCheck> {
  const allowed = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowed.length > 0 && !allowed.includes(origin)) {
    return { ok: false, status: 403, msg: 'origin not allowed' };
  }

  const m = /^Bearer (.+)$/.exec(req.headers.authorization ?? '');
  if (!m) return { ok: false, status: 401, msg: 'missing token' };

  const apiKey = process.env.FIREBASE_SERVER_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 500, msg: 'firebase api key not configured' };
  }

  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: m[1] }),
    }
  );

  if (!r.ok) return { ok: false, status: 401, msg: 'invalid token' };
  const data = (await r.json()) as { users?: Array<{ localId?: string }> };
  const uid = data?.users?.[0]?.localId;
  if (!uid || uid !== process.env.ADMIN_UID) {
    return { ok: false, status: 403, msg: 'not admin' };
  }

  return { ok: true, uid };
}
