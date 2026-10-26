import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500 disabled:bg-brand-200 disabled:text-brand-400',
  secondary:
    'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-brand-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-brand-500 dark:text-gray-300 dark:hover:bg-gray-800',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 disabled:bg-red-200',
  success:
    'bg-green-700 text-white hover:bg-green-800 active:bg-green-900 focus-visible:ring-green-500 disabled:bg-green-200',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        {...props}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-medium rounded-lg
          transition-all duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-60
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        ) : icon ? (
          <span className="shrink-0" aria-hidden="true">{icon}</span>
        ) : null}
        {children}
        {!loading && iconRight && (
          <span className="shrink-0" aria-hidden="true">{iconRight}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
