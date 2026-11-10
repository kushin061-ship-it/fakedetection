import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../utils/cn';
import Button from './Button';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no data to display for this view.',
  actionText,
  onAction,
  actionButton,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12',
        'rounded-[14px] border border-dashed border-tl-border bg-tl-fill/50',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tl-fill text-tl-accent mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-tl-text mb-1">
        {title}
      </h3>
      <p className="max-w-sm text-sm text-tl-muted mb-6">
        {description}
      </p>
      {actionButton ? (
        actionButton
      ) : actionText && onAction ? (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      ) : null}
      {children}
    </div>
  );
}

export default EmptyState;
