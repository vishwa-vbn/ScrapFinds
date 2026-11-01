import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { initInstallCapture } from './lib/pwa/installStore';
import './index.css';
import App from './App';

// Register Service Worker immediately for PWA installability & offline caching
registerSW({ immediate: true });

// Capture install prompt BEFORE React mounts
initInstallCapture();

// Refuse mock mode in production
if (import.meta.env.PROD && import.meta.env.VITE_USE_MOCK === 'true') {
  throw new Error('Mock mode is not allowed in production builds. Remove VITE_USE_MOCK from your environment.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
