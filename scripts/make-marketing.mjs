import fs from 'node:fs/promises';
import path from 'node:path';

// Extract site config without needing TypeScript compile
const siteConfigRaw = await fs.readFile('src/config/site.ts', 'utf-8');
const nameMatch = /name:\s*['"]([^'"]+)['"]/.exec(siteConfigRaw);
const phoneMatch = /phoneDisplay:\s*['"]([^'"]+)['"]/.exec(siteConfigRaw);
const altPhoneMatch = /altPhoneDisplay:\s*['"]([^'"]+)['"]/.exec(siteConfigRaw);

const siteName = nameMatch ? nameMatch[1] : 'ScrapFinds';
const phone = phoneMatch ? phoneMatch[1] : '+91 91139 66625';
const altPhone = altPhoneMatch ? altPhoneMatch[1] : '+91 96329 43726';

await fs.mkdir('marketing', { recursive: true });

// Read QR SVGs or generate fallback
let posterQrSvg = '';
let cardQrSvg = '';
try {
  posterQrSvg = await fs.readFile('marketing/qr/qr-poster.svg', 'utf-8');
  cardQrSvg = await fs.readFile('marketing/qr/qr-card.svg', 'utf-8');
} catch {
  console.log('QR SVGs not found yet, generating QR codes first...');
  const { execSync } = await import('node:child_process');
  execSync('node scripts/generate-qr.mjs', { stdio: 'inherit' });
  posterQrSvg = await fs.readFile('marketing/qr/qr-poster.svg', 'utf-8');
  cardQrSvg = await fs.readFile('marketing/qr/qr-card.svg', 'utf-8');
}

// 1. A4 Poster
const posterHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${siteName} - A4 Poster</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      width: 210mm;
      height: 297mm;
      padding: 20mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      background: #ffffff;
      color: #111827;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      width: 100%;
      border-bottom: 3px solid #16a34a;
      padding-bottom: 8mm;
    }
    .brand {
      font-size: 38pt;
      font-weight: 900;
      color: #16a34a;
      letter-spacing: -1px;
    }
    .headline {
      font-size: 24pt;
      font-weight: 800;
      margin-top: 5mm;
      color: #1f2937;
    }
    .subheadline {
      font-size: 14pt;
      color: #4b5563;
      margin-top: 3mm;
    }
    .qr-container {
      width: 90mm;
      height: 90mm;
      margin: 6mm auto;
      padding: 4mm;
      border: 3px solid #e5e7eb;
      border-radius: 6mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-container svg {
      width: 100%;
      height: 100%;
    }
    .cta-box {
      background: #f0fdf4;
      border: 2px dashed #16a34a;
      border-radius: 4mm;
      padding: 6mm 10mm;
      margin: 4mm 0;
    }
    .cta-title {
      font-size: 16pt;
      font-weight: 800;
      color: #15803d;
    }
    .cta-desc {
      font-size: 12pt;
      color: #374151;
      margin-top: 2mm;
    }
    .footer {
      width: 100%;
      border-top: 2px solid #e5e7eb;
      padding-top: 6mm;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      text-align: left;
    }
    .contact-info {
      font-size: 12pt;
      line-height: 1.5;
    }
    .phone-big {
      font-size: 18pt;
      font-weight: 800;
      color: #16a34a;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">♻ ${siteName}</div>
    <div class="headline">Good items, hand-to-hand. No money, just call.</div>
    <div class="subheadline">Speakers • Mobiles • Cycles • Appliances • Electronics</div>
  </div>

  <div class="middle">
    <div class="cta-box">
      <div class="cta-title">Scan with any phone camera to install our app</div>
      <div class="cta-desc">See real photos of items available today • Call to collect</div>
    </div>

    <div class="qr-container">
      ${posterQrSvg}
    </div>
  </div>

  <div class="footer">
    <div class="contact-info">
      <div><strong>We also buy scrap!</strong> Papers, plastics, iron, copper, e-waste.</div>
      <div>Direct pickup and collection by phone or WhatsApp.</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 10pt; color: #6b7280;">Direct Phone & WhatsApp:</div>
      <div class="phone-big">📞 ${phone} / ${altPhone}</div>
    </div>
  </div>
</body>
</html>`;

await fs.writeFile('marketing/poster-a4.html', posterHtml, 'utf-8');
console.log('✓ Created marketing/poster-a4.html');

// 2. Visiting Card (90mm x 55mm)
const cardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${siteName} - Visiting Card</title>
  <style>
    @page { size: 90mm 55mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      width: 90mm;
      height: 55mm;
      padding: 5mm;
      display: flex;
      background: #ffffff;
      color: #111827;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .left {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding-right: 3mm;
    }
    .brand {
      font-size: 13pt;
      font-weight: 900;
      color: #16a34a;
    }
    .tagline {
      font-size: 6.5pt;
      color: #4b5563;
      margin-top: 1mm;
      line-height: 1.2;
    }
    .services {
      font-size: 6.5pt;
      color: #1f2937;
      line-height: 1.3;
    }
    .contact {
      font-size: 7.5pt;
      line-height: 1.3;
    }
    .phone {
      font-size: 9pt;
      font-weight: 800;
      color: #15803d;
    }
    .right {
      width: 32mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-left: 1px dashed #d1d5db;
      padding-left: 2mm;
    }
    .qr-box {
      width: 28mm;
      height: 28mm;
    }
    .qr-box svg {
      width: 100%;
      height: 100%;
    }
    .scan-note {
      font-size: 5.5pt;
      font-weight: 700;
      text-align: center;
      margin-top: 1mm;
      color: #374151;
    }
  </style>
</head>
<body>
  <div class="left">
    <div>
      <div class="brand">♻ ${siteName}</div>
      <div class="tagline">Recovered goods & scrap collection</div>
    </div>
    
    <div class="services">
      <strong>• Recovered Items:</strong> Audio, Mobiles, Bicycles, Tools<br>
      <strong>• Scrap Bought:</strong> Paper, Metals, Plastic, E-waste
    </div>

    <div class="contact">
      <div class="phone">📞 ${phone} / ${altPhone}</div>
      <div style="font-size: 6pt; color: #6b7280;">Direct pickup & hand-to-hand collection</div>
    </div>
  </div>

  <div class="right">
    <div class="qr-box">
      ${cardQrSvg}
    </div>
    <div class="scan-note">Scan to install app & browse available items</div>
  </div>
</body>
</html>`;

await fs.writeFile('marketing/visiting-card.html', cardHtml, 'utf-8');
console.log('✓ Created marketing/visiting-card.html');
