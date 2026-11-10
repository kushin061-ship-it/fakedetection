import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';
import Button from './Button';

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this data. Please try again.',
  onRetry,
  retryText = 'Try again',
  isRetrying = false,
  secondaryAction,
  icon: Icon = AlertTriangle,
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-10',
        'rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20',
        className
      )}
    >
      <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 mb-4 shadow-soft-xs">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-900 dark:text-rose-200 mb-1">
        {title}
      </h3>
      <p className="max-w-md text-sm text-rose-700/80 dark:text-rose-300/80 mb-6">
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            variant="danger"
            size="md"
            onClick={onRetry}
            isLoading={isRetrying}
            loadingText="Retrying..."
            leftIcon={RefreshCw}
          >
            {retryText}
          </Button>
        )}
        {secondaryAction}
      </div>
    </div>
  );
}

export default ErrorState;
