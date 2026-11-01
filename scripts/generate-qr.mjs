import QRCode from 'qrcode';
import fs from 'node:fs/promises';

const base = (process.env.SITE_URL ?? process.argv[2] ?? 'https://your-domain.com').replace(/\/$/, '');
if (!/^https?:\/\//.test(base)) {
  console.error('Usage: SITE_URL=https://yourdomain.com npm run qr');
  process.exit(1);
}

const sources = ['poster', 'card', 'sticker', 'whatsapp', 'flyer', 'vehicle'];
await fs.mkdir('marketing/qr', { recursive: true });

for (const s of sources) {
  const url = `${base}/install?src=${s}`;
  await QRCode.toFile(`marketing/qr/qr-${s}.svg`, url, {
    type: 'svg',
    errorCorrectionLevel: 'Q',
    margin: 4,
    color: { dark: '#111111', light: '#ffffff' },
  });
  await QRCode.toFile(`marketing/qr/qr-${s}.png`, url, {
    width: 1200,
    errorCorrectionLevel: 'Q',
    margin: 4,
    color: { dark: '#111111', light: '#ffffff' },
  });
  console.log('✓', s, url);
}
