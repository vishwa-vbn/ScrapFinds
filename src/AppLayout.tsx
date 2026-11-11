import { Outlet } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { InstallBanner } from './components/InstallBanner';
import { OfflineBanner } from './components/OfflineBanner';
import { ErrorBoundary } from './components/ErrorBoundary';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)] antialiased overflow-x-hidden">
      {/* PWA Install Banner */}
      <InstallBanner />

      {/* Clean Sticky Header */}
      <Header />

      {/* Offline Status Alert */}
      <OfflineBanner />

      {/* Main content body */}
      <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
