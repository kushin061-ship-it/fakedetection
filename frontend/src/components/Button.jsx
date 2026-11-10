import React from 'react';
import { cn } from '../utils/cn';
import Spinner from './Spinner';

const sizeStyles = {
  sm: 'text-xs px-3 py-1.5 rounded-[10px] gap-1.5',
  md: 'text-sm px-4 py-2 rounded-[10px] gap-2',
  lg: 'text-sm px-5 py-2.5 rounded-[10px] gap-2.5',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || isLoading;

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-white font-semibold shadow-btn motion-safe:hover:shadow-btn-hover motion-safe:hover:-translate-y-0.5 transition-all duration-200 ease-out focus-visible:ring-[#3A78F2]';
      case 'secondary':
        return 'bg-tl-fill border border-tl-border text-tl-text hover:bg-tl-bg transition-all duration-200 ease-out focus-visible:ring-tl-accent';
      case 'ghost':
        return 'bg-transparent text-tl-muted hover:bg-tl-fill transition-all duration-200 ease-out focus-visible:ring-tl-accent';
      case 'danger':
        return 'bg-tl-fake-bg text-tl-fake hover:bg-[rgba(224,90,90,0.22)] transition-all duration-200 ease-out focus-visible:ring-tl-fake';
      default:
        return 'text-white font-semibold shadow-btn motion-safe:hover:shadow-btn-hover motion-safe:hover:-translate-y-0.5 transition-all duration-200 ease-out focus-visible:ring-[#3A78F2]';
    }
  };

  const primaryGradientStyle =
    variant === 'primary' || (variant !== 'secondary' && variant !== 'ghost' && variant !== 'danger')
      ? { background: 'linear-gradient(135deg, #3A78F2, #74A6FF)' }
      : undefined;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
        getVariantClasses(),
        sizeStyles[size] || sizeStyles.md,
        className
      )}
      style={primaryGradientStyle}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner
            size={size === 'lg' ? 'md' : 'sm'}
            color={variant === 'primary' || variant === 'danger' ? 'white' : 'current'}
          />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
}

export default Button;
