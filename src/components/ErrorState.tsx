import { strings } from '../config/strings';
import { CallButton } from './CallButton';
import { AlertIcon } from './Icons';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = strings.error,
  description = strings.errorDesc,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/40">
        <AlertIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-xl font-bold text-[var(--fg)]">{title}</h3>
      <p className="text-sm text-[var(--muted)] leading-relaxed">{description}</p>
      <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[44px] px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-[var(--fg)] font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            {strings.tryAgain}
          </button>
        )}
        <CallButton variant="primary" />
      </div>
    </div>
  );
}
