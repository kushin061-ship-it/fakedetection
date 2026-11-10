import React from 'react';
import { cn } from '../utils/cn';

export function Skeleton({
  variant = 'text', // 'text' | 'circle' | 'rectangle' | 'card'
  width,
  height,
  className,
  count = 1,
  ...props
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'card':
        return 'rounded-xl h-36 w-full';
      case 'rectangle':
        return 'rounded-lg';
      case 'text':
      default:
        return 'rounded-md h-4 w-full';
    }
  };

  const renderSingle = (index) => (
    <div
      key={index}
      className={cn(
        'relative overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 animate-pulse',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/20 dark:after:via-white/5 after:to-transparent',
        getVariantStyles(),
        className
      )}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
      }}
      {...props}
    />
  );

  if (count > 1) {
    return (
      <div className="space-y-2.5 w-full">
        {Array.from({ length: count }).map((_, i) => renderSingle(i))}
      </div>
    );
  }

  return renderSingle(0);
}

export default Skeleton;
