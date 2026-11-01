import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

const distDir = 'dist';

async function getFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function check() {
  console.log('--- Checking dist folder ---');
  let files;
  try {
    files = await getFiles(distDir);
  } catch {
    console.error(`Error: "${distDir}" folder does not exist. Run "npm run build" first.`);
    process.exit(1);
  }

  // 1. Check for leaked secrets
  const forbiddenPatterns = [
    /IMAGEKIT_PRIVATE/i,
    /BEGIN (RSA )?PRIVATE KEY/i,
    /ADMIN_UID/i,
  ];

  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.map') || file.endsWith('.css')) {
      const content = await fs.readFile(file, 'utf-8');
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(content)) {
          console.error(`❌ SECURITY ERROR: Forbidden pattern ${pattern} found in ${file}!`);
          process.exit(1);
        }
      }
    }
  }
  console.log('✓ No secret patterns leaked in dist bundle.');

  // 2. Measure initial JS bundle size (gzipped)
  const jsFiles = files.filter(f => f.endsWith('.js') && !f.includes('sw.js') && !f.includes('workbox'));
  console.log(`\nJS bundles:`);
  let maxBundleGzipKb = 0;

  for (const jsFile of jsFiles) {
    const raw = await fs.readFile(jsFile);
    const gzipped = zlib.gzipSync(raw);
    const rawKb = (raw.length / 1024).toFixed(1);
    const gzipKb = (gzipped.length / 1024).toFixed(1);
    const isInitial = path.basename(jsFile).startsWith('index-');
    console.log(`  - ${path.basename(jsFile)}: ${rawKb} KB raw, ${gzipKb} KB gzipped ${isInitial ? '(initial bundle)' : ''}`);

    if (isInitial && gzipped.length / 1024 > maxBundleGzipKb) {
      maxBundleGzipKb = gzipped.length / 1024;
    }
  }

  console.log(`\nInitial JS bundle gzipped: ${maxBundleGzipKb.toFixed(1)} KB`);
  if (maxBundleGzipKb > 150) {
    console.error(`❌ BUNDLE SIZE ERROR: Initial JS exceeds 150 KB gzipped limit! (${maxBundleGzipKb.toFixed(1)} KB)`);
    process.exit(1);
  }
  console.log('✓ Initial bundle size ≤ 150 KB passed.');
  console.log('\n--- dist check PASSED ---');
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
