import React from 'react';
import { cn } from '../utils/cn';

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-5 h-5 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-4',
};

const colorMap = {
  primary: 'border-tl-accent border-t-transparent',
  fake: 'border-tl-fake border-t-transparent',
  genuine: 'border-tl-genuine border-t-transparent',
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
