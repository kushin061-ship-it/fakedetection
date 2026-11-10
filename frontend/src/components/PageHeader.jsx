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
        'flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-tl-border mb-6',
        className
      )}
    >
      <div className="space-y-1.5 min-w-0">
        {breadcrumbs && (
          <div className="flex items-center gap-2 text-xs text-tl-muted mb-1">
            {breadcrumbs}
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-tl-text">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-sm text-tl-muted mt-1 max-w-3xl">
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
