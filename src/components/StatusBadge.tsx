import React from 'react';

type BadgeVariant = 'default' | 'prototype' | 'demo' | 'success' | 'warning' | 'error' | 'info' | 'simulated';

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  prototype: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  demo: 'bg-blue-50 text-brand-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  success: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  error: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  info: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  simulated: 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800',
};

const pulseColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-400',
  prototype: 'bg-amber-400',
  demo: 'bg-blue-400',
  success: 'bg-green-500',
  warning: 'bg-amber-400',
  error: 'bg-red-500',
  info: 'bg-blue-400',
  simulated: 'bg-violet-400',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = 'default',
  children,
  pulse = false,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColors[variant]}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pulseColors[variant]}`} />
        </span>
      )}
      {children}
    </span>
  );
};
