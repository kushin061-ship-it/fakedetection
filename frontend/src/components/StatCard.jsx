import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../utils/cn';

const variantColors = {
  primary: { bg: 'bg-tl-accent-bg', text: 'text-tl-accent' },
  fake: { bg: 'bg-tl-fake-bg', text: 'text-tl-fake' },
  genuine: { bg: 'bg-tl-genuine-bg', text: 'text-tl-genuine' },
  textual: { bg: 'bg-tl-accent-bg', text: 'text-tl-accent' },
  behavioral: { bg: 'bg-tl-warning-bg', text: 'text-tl-warning' },
  temporal: { bg: null, text: null, inlineBg: 'rgba(139,92,246,0.14)', inlineColor: '#8B5CF6' },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = 'primary',
  subtext,
  className,
}) {
  const colors = variantColors[variant] || variantColors.primary;

  const renderTrend = () => {
    if (!trend) return null;

    if (typeof trend === 'string') {
      return (
        <span className="text-xs font-medium text-tl-muted">
          {trend}
        </span>
      );
    }

    const { value: trendValue, isUp, positive = true } = trend;
    const isGood = positive ? isUp : !isUp;

    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
          isGood
            ? 'text-tl-genuine bg-tl-genuine-bg'
            : 'text-tl-fake bg-tl-fake-bg'
        )}
      >
        {isUp ? (
          <TrendingUp className="w-3.5 h-3.5" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5" />
        )}
        <span>{trendValue}</span>
      </div>
    );
  };

  return (
    <div
      className={cn(
        'rounded-[14px] border border-tl-border shadow-card bg-tl-card p-4 relative overflow-hidden',
        'motion-safe:hover:shadow-card-hover motion-safe:hover:-translate-y-0.5 transition-all duration-200 ease-out',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="uppercase text-[11px] tracking-wider font-semibold text-tl-muted truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold text-tl-text">
              {value}
            </h2>
          </div>
          {(trend || subtext) && (
            <div className="flex items-center gap-2 pt-1">
              {renderTrend()}
              {subtext && (
                <span className="text-xs text-tl-muted truncate">
                  {subtext}
                </span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] p-2 transition-transform duration-200',
              colors.bg,
              colors.text
            )}
            style={
              colors.inlineBg
                ? { backgroundColor: colors.inlineBg, color: colors.inlineColor }
                : undefined
            }
          >
            <Icon className="w-full h-full" />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
