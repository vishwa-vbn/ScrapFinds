import { waHref } from '../lib/links';
import { strings } from '../config/strings';

interface WhatsAppButtonProps {
  title?: string;
  url?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  label?: string;
  className?: string;
}

export function WhatsAppButton({
  title,
  url,
  variant = 'secondary',
  label = strings.whatsapp,
  className = '',
}: WhatsAppButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl min-h-[44px] min-w-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2';

  if (variant === 'icon') {
    return (
      <a
        href={waHref(title, url)}
        target="_blank"
        rel="noopener noreferrer"
        className={`p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ${className}`}
        aria-label={strings.whatsappUs}
        title={strings.whatsappUs}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 fill-current"
          viewBox="0 0 24 24"
        >
          <path d="M12.031 2c-5.514 0-10 4.486-10 10 0 1.761.458 3.479 1.328 5.002l-1.359 4.998 5.122-1.343c1.472.805 3.125 1.343 4.909 1.343 5.514 0 10-4.486 10-10s-4.486-10-10-10zm5.859 14.159c-.244.685-1.42 1.309-1.968 1.355-.549.047-1.25.109-3.666-.884-2.738-1.127-4.509-3.909-4.646-4.091-.137-.182-1.113-1.482-1.113-2.825 0-1.343.701-2.003.948-2.277.247-.274.542-.343.722-.343.18 0 .361.002.518.01.168.008.393-.064.615.469.229.549.779 1.901.848 2.039.069.137.115.3.023.484-.092.183-.138.297-.274.457-.137.16-.289.358-.412.481-.137.137-.28.286-.12.56.16.274.71 1.17 1.523 1.895 1.047.933 1.93 1.222 2.204 1.36.274.137.435.114.595-.069.16-.183.686-.799.869-1.074.183-.274.366-.229.617-.137.251.092 1.589.75 1.864.887.274.137.457.206.526.32.069.115.069.664-.175 1.349z" />
        </svg>
      </a>
    );
  }

  const variantClasses = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm px-5 py-2.5',
    secondary:
      'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 px-5 py-2.5',
    ghost:
      'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-emerald-700 dark:text-emerald-400 px-4 py-2',
  };

  return (
    <a
      href={waHref(title, url)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 mr-2 -ml-1 shrink-0 fill-current"
        viewBox="0 0 24 24"
      >
        <path d="M12.031 2c-5.514 0-10 4.486-10 10 0 1.761.458 3.479 1.328 5.002l-1.359 4.998 5.122-1.343c1.472.805 3.125 1.343 4.909 1.343 5.514 0 10-4.486 10-10s-4.486-10-10-10zm5.859 14.159c-.244.685-1.42 1.309-1.968 1.355-.549.047-1.25.109-3.666-.884-2.738-1.127-4.509-3.909-4.646-4.091-.137-.182-1.113-1.482-1.113-2.825 0-1.343.701-2.003.948-2.277.247-.274.542-.343.722-.343.18 0 .361.002.518.01.168.008.393-.064.615.469.229.549.779 1.901.848 2.039.069.137.115.3.023.484-.092.183-.138.297-.274.457-.137.16-.289.358-.412.481-.137.137-.28.286-.12.56.16.274.71 1.17 1.523 1.895 1.047.933 1.93 1.222 2.204 1.36.274.137.435.114.595-.069.16-.183.686-.799.869-1.074.183-.274.366-.229.617-.137.251.092 1.589.75 1.864.887.274.137.457.206.526.32.069.115.069.664-.175 1.349z" />
      </svg>
      <span>{label}</span>
    </a>
  );
}
