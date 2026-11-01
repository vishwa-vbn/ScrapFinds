import type { ReactNode } from 'react';
import { strings } from '../config/strings';
import { CallButton } from './CallButton';
import { PackageIcon } from './Icons';

interface EmptyStateProps {
  title?: string;
  description?: string;
  showCall?: boolean;
  action?: ReactNode;
}

export function EmptyState({
  title = strings.noItemsHeading,
  description = strings.noItemsDesc,
  showCall = true,
  action,
}: EmptyStateProps) {
  return (
    <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center border border-green-200/60 dark:border-green-800/40">
        <PackageIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-xl font-bold text-[var(--fg)]">{title}</h3>
      <p className="text-sm text-[var(--muted)] leading-relaxed">{description}</p>
      <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
        {showCall && <CallButton variant="primary" />}
        {action}
      </div>
    </div>
  );
}
