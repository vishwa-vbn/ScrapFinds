import { Link } from 'react-router-dom';
import { strings } from '../config/strings';
import { CallButton } from '../components/CallButton';
import { useDocumentMeta } from '../lib/useDocumentMeta';

export function NotFound() {
  useDocumentMeta(strings.notFound, strings.notFoundDesc);

  return (
    <div className="py-20 px-4 text-center max-w-md mx-auto space-y-6">
      <div className="text-6xl font-black text-green-600">404</div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--fg)]">{strings.notFound}</h1>
        <p className="text-sm text-[var(--muted)]">{strings.notFoundDesc}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          to="/"
          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold text-sm text-[var(--fg)] transition-colors"
        >
          {strings.goHome}
        </Link>
        <CallButton variant="primary" />
      </div>
    </div>
  );
}
