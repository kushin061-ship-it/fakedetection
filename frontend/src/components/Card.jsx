import React from 'react';
import { cn } from '../utils/cn';

export function Card({
  children,
  className,
  hoverable = false,
  bordered = true,
  ...props
}) {
  return (
    <div
      className={cn(
        'rounded-[14px] bg-tl-card text-tl-text shadow-card',
        bordered && 'border border-tl-border',
        hoverable && 'motion-safe:hover:shadow-card-hover motion-safe:hover:-translate-y-0.5 transition-all duration-200 ease-out',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, action, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-5 py-4 border-b border-tl-border',
        className
      )}
      {...props}
    >
      <div className="space-y-0.5">{children}</div>
      {action && <div className="flex items-center space-x-2">{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={cn(
        'text-base font-semibold leading-6 text-tl-text',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p
      className={cn(
        'text-sm text-tl-muted',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-5 py-3 bg-tl-fill border-t border-tl-border rounded-b-[14px]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
