import React, { useState } from 'react';
import { cn } from '../utils/cn';

export function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  variant = 'pill',
  size = 'md',
  className,
  children,
}) {
  const [internalActive, setInternalActive] = useState(
    defaultValue || (items.length > 0 ? items[0].id : '')
  );

  const activeId = value !== undefined ? value : internalActive;

  const handleSelect = (id, disabled) => {
    if (disabled) return;
    if (value === undefined) {
      setInternalActive(id);
    }
    if (onChange) {
      onChange(id);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        role="tablist"
        className={cn(
          'flex items-center gap-1.5 overflow-x-auto pb-1 select-none',
          variant === 'underline' && 'border-b border-tl-border gap-6 pb-0',
          variant === 'pill' && 'p-1 bg-tl-fill rounded-[14px]'
        )}
      >
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          const Icon = tab.icon;

          if (variant === 'underline') {
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                disabled={tab.disabled}
                onClick={() => handleSelect(tab.id, tab.disabled)}
                className={cn(
                  'flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-all duration-200 ease-out cursor-pointer -mb-px',
                  isActive
                    ? 'border-tl-accent text-tl-accent'
                    : 'border-transparent text-tl-muted hover:text-tl-text hover:border-tl-border',
                  tab.disabled && 'opacity-40 cursor-not-allowed hover:border-transparent'
                )}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-1 text-[11px] px-2 py-0.5 rounded-full font-semibold',
                      isActive
                        ? 'bg-tl-accent-bg text-tl-accent'
                        : 'bg-tl-fill text-tl-muted'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => handleSelect(tab.id, tab.disabled)}
              className={cn(
                'flex items-center gap-2 rounded-[10px] font-medium transition-all duration-200 ease-out text-xs md:text-sm cursor-pointer',
                size === 'sm' ? 'px-3 py-1.5' : 'px-4 py-2',
                isActive
                  ? 'bg-tl-accent-bg text-tl-accent font-semibold'
                  : 'text-tl-muted hover:text-tl-text hover:bg-tl-bg',
                tab.disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded-full font-semibold',
                    isActive
                      ? 'bg-tl-accent-bg text-tl-accent'
                      : 'bg-tl-fill text-tl-muted'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export default Tabs;
