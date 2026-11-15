import { describe, it, expect } from 'vitest';
import { ikUrl } from '../lib/imagekit';

describe('imagekit ikUrl', () => {
  it('does not transform local or non-ImageKit URLs', () => {
    const localUrl = '/icons/pwa-192.png';
    expect(ikUrl(localUrl, { w: 480, q: 70 })).toBe('/icons/pwa-192.png');
  });

  it('transforms valid ImageKit endpoint URLs', () => {
    // If endpoint is set (e.g. https://ik.imagekit.io/mock in test env)
    const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT as string;
    if (endpoint) {
      const url = `${endpoint}/scrap/photo.jpg`;
      const transformed = ikUrl(url, { w: 480, q: 70 });
      expect(transformed).toBe(`${url}?tr=w-480,q-70,f-auto`);
    }
  });

  it('handles empty or undefined URL gracefully', () => {
    expect(ikUrl('', { w: 480 })).toBe('');
  });
});
