import React from 'react';
import { cn } from '../utils/cn';

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-5 h-5 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
};

const colorMap = {
  primary: 'border-indigo-600 border-t-transparent dark:border-indigo-400 dark:border-t-transparent',
  fake: 'border-rose-600 border-t-transparent dark:border-rose-400 dark:border-t-transparent',
  genuine: 'border-emerald-600 border-t-transparent dark:border-emerald-400 dark:border-t-transparent',
  white: 'border-white border-t-transparent',
  current: 'border-current border-t-transparent',
};

export function Spinner({
  size = 'md',
  color = 'primary',
  className,
  label = 'Loading...',
  ...props
}) {
  return (
    <div
      role="status"
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-solid',
          sizeMap[size] || sizeMap.md,
          colorMap[color] || colorMap.primary
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default Spinner;
