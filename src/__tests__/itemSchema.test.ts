import { describe, it, expect } from 'vitest';
import { itemSchema, itemInputSchema } from '../types/item';

describe('itemSchema', () => {
  const validItem = {
    id: 'item-123',
    title: 'Vintage Radio',
    description: 'Good condition radio',
    category: 'audio',
    condition: 'good',
    status: 'available',
    images: [{ url: 'https://example.com/photo.jpg', fileId: 'img-123' }],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  };

  it('validates a correct item', () => {
    const result = itemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('validates itemInputSchema without id and timestamps', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, ...input } = validItem;
    const result = itemInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects title shorter than 2 chars', () => {
    const invalid = { ...validItem, title: 'A' };
    const result = itemSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects empty images array', () => {
    const invalid = { ...validItem, images: [] };
    const result = itemSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid condition', () => {
    const invalid = { ...validItem, condition: 'broken' };
    const result = itemSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates item with optional soldPrice', () => {
    const soldItem = { ...validItem, status: 'sold', soldPrice: 2500 };
    const result = itemSchema.safeParse(soldItem);
    expect(result.success).toBe(true);
  });

  it('validates item with optional translations', () => {
    const localized = {
      ...validItem,
      translations: {
        kn: { title: 'ವಿಂಟೇಜ್ ರೇಡಿಯೋ', description: 'ಉತ್ತಮ ಸ್ಥಿತಿಯಲ್ಲಿದೆ' },
        hi: { title: 'विंटेज रेडियो', description: 'अच्छी स्थिति में है' },
      },
    };
    const result = itemSchema.safeParse(localized);
    expect(result.success).toBe(true);
  });
});
