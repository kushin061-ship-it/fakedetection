import React from 'react';
import { cn } from '../utils/cn';

const variantStyles = {
  fake: 'text-tl-fake bg-tl-fake-bg',
  genuine: 'text-tl-genuine bg-tl-genuine-bg',
  warning: 'text-tl-warning bg-tl-warning-bg',
  neutral: 'text-tl-muted bg-tl-fill',
  primary: 'text-tl-accent bg-tl-accent-bg',
  textual: 'bg-tl-accent-bg text-tl-accent',
  behavioral: 'bg-tl-warning-bg text-tl-warning',
  temporal: 'text-[#8B5CF6] bg-[rgba(139,92,246,0.14)]',
};

const dotStyles = {
  fake: 'bg-tl-fake',
  genuine: 'bg-tl-genuine',
  warning: 'bg-tl-warning',
  neutral: 'bg-tl-muted',
  primary: 'bg-tl-accent',
  textual: 'bg-tl-accent',
  behavioral: 'bg-tl-warning',
  temporal: 'bg-[#8B5CF6]',
};

const sizeStyles = {
  sm: 'text-[11px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon: Icon,
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-[10px] select-none transition-colors duration-200 ease-out',
        variantStyles[variant] || variantStyles.neutral,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotStyles[variant] || 'bg-current'
          )}
        />
      )}
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
