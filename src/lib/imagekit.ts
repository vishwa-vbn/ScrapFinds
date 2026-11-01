import imageCompression from 'browser-image-compression';

const ENDPOINT = (import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT as string) || '';
const PUBLIC_KEY = (import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY as string) || '';

export function ikUrl(url: string, o: { w: number; q?: number }): string {
  if (!url || !ENDPOINT || !url.startsWith(ENDPOINT)) return url;
  return `${url}?tr=w-${o.w},q-${o.q ?? 70},f-auto`;
}

export async function uploadImage(file: File, idToken: string): Promise<{ url: string; fileId: string }> {
  // If in mock dev mode, return a mock placeholder
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') {
    const mockId = 'mock-' + Math.random().toString(36).substring(2, 9);
    return {
      url: `/mock/placeholder-1.svg`,
      fileId: mockId,
    };
  }

  const small = await imageCompression(file, {
    maxWidthOrHeight: 1280,
    maxSizeMB: 0.25,
    fileType: 'image/webp',
    useWebWorker: true,
  });

  const a = await fetch('/api/imagekit-auth', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!a.ok) {
    const errorData = await a.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to authenticate upload');
  }
  const { token, expire, signature } = await a.json();

  const fd = new FormData();
  fd.append('file', small);
  fd.append('fileName', `item-${Date.now()}.webp`);
  fd.append('publicKey', PUBLIC_KEY);
  fd.append('signature', signature);
  fd.append('expire', String(expire));
  fd.append('token', token);
  fd.append('folder', '/scrap');
  fd.append('useUniqueFileName', 'true');

  const u = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: fd,
  });
  if (!u.ok) {
    const errorData = await u.json().catch(() => ({}));
    throw new Error(errorData.message || 'ImageKit upload failed');
  }
  const j = await u.json();
  return { url: j.url, fileId: j.fileId };
}

export async function deleteImage(fileId: string, idToken: string): Promise<void> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') {
    return;
  }
  const res = await fetch('/api/imagekit-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fileId }),
  });
  if (!res.ok) {
    console.error('Failed to delete image from ImageKit:', fileId);
  }
}
