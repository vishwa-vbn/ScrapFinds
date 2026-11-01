import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isIOS, isAndroid, isInAppBrowser, isStandalone } from '../lib/pwa/platform';

describe('platform detection', () => {
  let userAgentGetter: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    userAgentGetter = vi.spyOn(window.navigator, 'userAgent', 'get');
  });

  it('detects iOS devices', () => {
    userAgentGetter.mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)');
    expect(isIOS()).toBe(true);
    expect(isAndroid()).toBe(false);
  });

  it('detects Android devices', () => {
    userAgentGetter.mockReturnValue('Mozilla/5.0 (Linux; Android 13; SM-S901B)');
    expect(isAndroid()).toBe(true);
    expect(isIOS()).toBe(false);
  });

  it('detects In-App browsers (e.g. Instagram / FBAN)', () => {
    userAgentGetter.mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5) Mobile/15E148 Instagram 280.0');
    expect(isInAppBrowser()).toBe(true);
  });

  it('detects standalone display mode', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(isStandalone()).toBe(true);
  });
});
