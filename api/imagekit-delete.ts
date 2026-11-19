import type { VercelRequest, VercelResponse } from '@vercel/node';

type AdminCheck = { ok: true; uid: string } | { ok: false; status: number; msg: string };

async function verifyAdmin(req: VercelRequest): Promise<AdminCheck> {
  const allowed = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin;
  const isTrustedDomain =
    !origin ||
    origin.endsWith('.vercel.app') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1');

  if (origin && allowed.length > 0 && !allowed.includes(origin) && !isTrustedDomain) {
    return { ok: false, status: 403, msg: 'origin not allowed' };
  }

  const m = /^Bearer (.+)$/.exec(req.headers.authorization ?? '');
  if (!m) return { ok: false, status: 401, msg: 'missing token' };

  const idToken = m[1];
  const configuredAdminUid = (process.env.ADMIN_UID || 'hgSPBxuZM7PNGsfJKMz5Syd66dJ3').trim();
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'vishwabnaik12@gmail.com').toLowerCase();

  try {
    const parts = idToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const email = payload.email?.toLowerCase();
      const uid = payload.user_id || payload.sub;
      if (
        uid === configuredAdminUid ||
        email === configuredAdminEmail ||
        email === 'vishwabnaik12@gmail.com'
      ) {
        return { ok: true, uid: uid || configuredAdminUid };
      }
    }
  } catch {
    // fallback to identitytoolkit lookup
  }

  const apiKey = process.env.FIREBASE_SERVER_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 500, msg: 'firebase api key not configured' };
  }

  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!r.ok) return { ok: false, status: 401, msg: 'invalid token' };
    const data = (await r.json()) as { users?: Array<{ localId?: string; email?: string }> };
    const user = data?.users?.[0];
    const uid = user?.localId;
    const email = user?.email?.toLowerCase();

    const isAdminUid = uid && uid === configuredAdminUid;
    const isAdminEmail =
      email &&
      (email === 'vishwabnaik12@gmail.com' ||
        email === configuredAdminEmail);

    if (!isAdminUid && !isAdminEmail) {
      return { ok: false, status: 403, msg: 'not admin' };
    }

    return { ok: true, uid: uid || configuredAdminUid };
  } catch (err) {
    return { ok: false, status: 500, msg: (err as Error).message };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const v = await verifyAdmin(req);
  if (!v.ok) return res.status(v.status).json({ error: v.msg });

  const { fileId } = (req.body ?? {}) as { fileId?: string };
  if (!fileId || !/^[a-zA-Z0-9_-]{5,80}$/.test(fileId)) {
    return res.status(400).json({ error: 'invalid fileId' });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    return res.status(500).json({ error: 'IMAGEKIT_PRIVATE_KEY not configured' });
  }

  const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');

  const r = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: authHeader },
  });

  if (!r.ok && r.status !== 404) {
    return res.status(r.status).json({ error: 'failed to delete from imagekit' });
  }

  return res.status(200).json({ ok: true });
}
