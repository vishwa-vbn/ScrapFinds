import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'warning' | 'muted';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide';
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    accent: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300 font-semibold',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-semibold',
    muted: 'bg-gray-200/70 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
