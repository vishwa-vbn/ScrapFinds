import { describe, it, expect } from 'vitest';
import { ikUrl } from '../lib/imagekit';

describe('imagekit ikUrl', () => {
  it('does not transform mock or local SVG URLs', () => {
    const mockUrl = '/mock/placeholder-1.svg';
    expect(ikUrl(mockUrl, { w: 480, q: 70 })).toBe('/mock/placeholder-1.svg');
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
