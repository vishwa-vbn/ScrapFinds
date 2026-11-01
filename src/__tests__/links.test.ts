import { describe, it, expect } from 'vitest';
import { telHref, waHref } from '../lib/links';
import { site } from '../config/site';

describe('links', () => {
  it('builds telHref with e164 phone', () => {
    expect(telHref()).toBe(`tel:${site.phoneE164}`);
  });

  it('builds telHref with custom phone', () => {
    expect(telHref(site.altPhoneE164)).toBe(`tel:${site.altPhoneE164}`);
  });

  it('builds general waHref with whatsappE164 phone', () => {
    const cleanPhone = site.whatsappE164.replace(/\D/g, '');
    const href = waHref();
    expect(href).toContain(`https://wa.me/${cleanPhone}`);
    expect(href).toContain(encodeURIComponent(site.name));
  });

  it('builds item waHref with title and url encoded', () => {
    const href = waHref('Vintage Radio', 'https://scrapfinds.com/item/123');
    expect(href).toContain(encodeURIComponent('Hi, I\'m interested in "Vintage Radio" https://scrapfinds.com/item/123'));
  });
});
