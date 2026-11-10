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
        'rounded-[14px] border border-tl-border bg-tl-fake-bg/40',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tl-fake-bg text-tl-fake mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-tl-text mb-1">
        {title}
      </h3>
      <p className="max-w-md text-sm text-tl-muted mb-6">
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
