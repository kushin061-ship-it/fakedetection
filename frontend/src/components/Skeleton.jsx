import React from 'react';
import { cn } from '../utils/cn';

export function Skeleton({
  variant = 'text',
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
        return 'rounded-[14px] h-36 w-full';
      case 'rectangle':
        return 'rounded-[10px]';
      case 'text':
      default:
        return 'rounded-[10px] h-4 w-full';
    }
  };

  const renderSingle = (index) => (
    <div
      key={index}
      className={cn(
        'relative overflow-hidden bg-tl-fill animate-pulse',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent',
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
