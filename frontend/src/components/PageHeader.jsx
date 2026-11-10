import React from 'react';
import { cn } from '../utils/cn';

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800/80 mb-6',
        className
      )}
    >
      <div className="space-y-1.5 min-w-0">
        {breadcrumbs && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            {breadcrumbs}
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
