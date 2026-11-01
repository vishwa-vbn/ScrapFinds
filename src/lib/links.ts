import { site } from '../config/site';

export function telHref(phone?: string): string {
  return `tel:${phone || site.phoneE164}`;
}

export function waHref(title?: string, url?: string): string {
  const cleanPhone = site.whatsappE164.replace(/\D/g, '');
  if (!title) {
    const text = `Hi, I want to inquire about items available at ${site.name}.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }
  const text = `Hi, I'm interested in "${title}" ${url ?? ''}`.trim();
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function mapsHref(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapsQuery)}`;
}

export async function shareItem(title: string, url: string): Promise<boolean> {
  const shareData = {
    title,
    text: `Check out "${title}" on ${site.name}`,
    url,
  };

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        // Fallback to clipboard
        return copyToClipboard(url);
      }
      return false;
    }
  }

  return copyToClipboard(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopy(text);
    }
  }
  return fallbackCopy(text);
}

function fallbackCopy(text: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}
