import React, { useState } from 'react';
import { cn } from '../utils/cn';

export function Tabs({
  items = [], // [{ id, label, icon: Icon, badge: string|number, badgeVariant, disabled }]
  value,
  defaultValue,
  onChange,
  variant = 'pill', // 'pill' | 'underline'
  size = 'md', // 'sm' | 'md'
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
          variant === 'underline' && 'border-b border-slate-200 dark:border-slate-800 gap-6 pb-0',
          variant === 'pill' && 'p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl'
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
                  'flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-all cursor-pointer -mb-px',
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-700',
                  tab.disabled && 'opacity-40 cursor-not-allowed hover:border-transparent'
                )}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-1 text-xs px-2 py-0.5 rounded-full font-semibold',
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                        : 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          }

          // Default 'pill' variant
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => handleSelect(tab.id, tab.disabled)}
              className={cn(
                'flex items-center gap-2 rounded-lg font-medium transition-all text-xs md:text-sm cursor-pointer',
                size === 'sm' ? 'px-3 py-1.5' : 'px-4 py-2',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-soft-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/40 dark:hover:bg-slate-700/40',
                tab.disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'text-[11px] px-1.5 py-0.5 rounded-full font-semibold',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                      : 'bg-slate-200/60 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'
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
