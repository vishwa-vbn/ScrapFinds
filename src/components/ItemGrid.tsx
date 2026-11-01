import type { ReactNode } from 'react';

interface ItemGridProps {
  children: ReactNode;
  className?: string;
}

export function ItemGrid({ children, className = '' }: ItemGridProps) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 ${className}`}
    >
      {children}
    </div>
  );
}
