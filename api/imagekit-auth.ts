import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { verifyAdmin } from './_lib/verifyAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const v = await verifyAdmin(req);
  if (!v.ok) return res.status(v.status).json({ error: v.msg });

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    return res.status(500).json({ error: 'IMAGEKIT_PRIVATE_KEY not configured' });
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 600; // 10 minutes
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex');

  return res.status(200).json({ token, expire, signature });
}
