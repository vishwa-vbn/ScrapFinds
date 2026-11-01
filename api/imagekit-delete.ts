import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdmin } from './_lib/verifyAdmin';

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
