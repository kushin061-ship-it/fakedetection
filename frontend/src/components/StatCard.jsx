import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../utils/cn';
import Card from './Card';

const themeStyles = {
  primary: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50',
    accent: 'from-indigo-500/10 to-transparent',
  },
  fake: {
    iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50',
    accent: 'from-rose-500/10 to-transparent',
  },
  genuine: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50',
    accent: 'from-emerald-500/10 to-transparent',
  },
  textual: {
    iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50',
    accent: 'from-blue-500/10 to-transparent',
  },
  behavioral: {
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50',
    accent: 'from-amber-500/10 to-transparent',
  },
  temporal: {
    iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50',
    accent: 'from-purple-500/10 to-transparent',
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = 'primary', // 'primary' | 'fake' | 'genuine' | 'textual' | 'behavioral' | 'temporal'
  subtext,
  className,
}) {
  const currentTheme = themeStyles[variant] || themeStyles.primary;

  const renderTrend = () => {
    if (!trend) return null;

    if (typeof trend === 'string') {
      return (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
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
            ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50'
            : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/50'
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
    <Card
      hoverable
      className={cn('relative overflow-hidden p-5 transition-all', className)}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r',
          variant === 'primary' && 'from-indigo-500 via-indigo-400 to-indigo-600',
          variant === 'fake' && 'from-rose-500 via-rose-400 to-rose-600',
          variant === 'genuine' && 'from-emerald-500 via-emerald-400 to-emerald-600',
          variant === 'textual' && 'from-blue-500 via-blue-400 to-blue-600',
          variant === 'behavioral' && 'from-amber-500 via-amber-400 to-amber-600',
          variant === 'temporal' && 'from-purple-500 via-purple-400 to-purple-600'
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-xs font-medium tracking-wide uppercase text-slate-500 dark:text-slate-400 truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {value}
            </h2>
          </div>
          {(trend || subtext) && (
            <div className="flex items-center gap-2 pt-1">
              {renderTrend()}
              {subtext && (
                <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {subtext}
                </span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2.5 transition-transform duration-200 group-hover:scale-105',
              currentTheme.iconBg
            )}
          >
            <Icon className="w-full h-full" />
          </div>
        )}
      </div>
    </Card>
  );
}

export default StatCard;
