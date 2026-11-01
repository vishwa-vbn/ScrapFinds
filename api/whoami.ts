import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdmin } from './_lib/verifyAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const v = await verifyAdmin(req);
  if (!v.ok) return res.status(v.status).json({ error: v.msg });
  return res.status(200).json({ ok: true, uid: v.uid });
}
