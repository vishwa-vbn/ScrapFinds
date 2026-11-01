import { telHref } from '../lib/links';
import { strings } from '../config/strings';

interface CallButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  label?: string;
  className?: string;
  phone?: string;
}

export function CallButton({
  variant = 'primary',
  label = strings.callToCollect,
  className = '',
  phone,
}: CallButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl min-h-[44px] min-w-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2';

  if (variant === 'icon') {
    return (
      <a
        href={telHref(phone)}
        className={`p-2.5 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-sm ${className}`}
        aria-label={strings.callUs}
        title={strings.callUs}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </a>
    );
  }

  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white shadow-sm px-5 py-2.5',
    secondary:
      'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-950/60 dark:hover:bg-green-900 dark:text-green-300 px-5 py-2.5',
    ghost:
      'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-green-700 dark:text-green-400 px-4 py-2',
  };

  return (
    <a
      href={telHref(phone)}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 mr-2 -ml-1 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
      <span>{label}</span>
    </a>
  );
}
