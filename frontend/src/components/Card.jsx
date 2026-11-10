import React from 'react';
import { cn } from '../utils/cn';

export function Card({
  children,
  className,
  hoverable = false,
  bordered = true,
  glow = null, // 'primary' | 'fake' | 'genuine' | null
  ...props
}) {
  const glowClasses = {
    primary: 'hover:shadow-glow-primary hover:border-indigo-500/40',
    fake: 'hover:shadow-glow-fake hover:border-rose-500/40',
    genuine: 'hover:shadow-glow-genuine hover:border-emerald-500/40',
  };

  return (
    <div
      className={cn(
        'rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
        'shadow-soft-sm transition-all duration-200',
        bordered && 'border border-slate-200/90 dark:border-slate-800/80',
        hoverable && 'hover:shadow-soft-md hover:-translate-y-0.5',
        glow && glowClasses[glow],
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
        'flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/70',
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
        'text-base font-semibold leading-6 text-slate-900 dark:text-slate-50',
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
        'text-sm text-slate-500 dark:text-slate-400',
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
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-4 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/70 rounded-b-xl',
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
