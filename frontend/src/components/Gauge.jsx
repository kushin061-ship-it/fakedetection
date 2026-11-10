import React from 'react';
import { cn } from '../utils/cn';
import { getRiskLevel } from '../utils/formatters';

export function Gauge({
  value = 0, // 0 to 1 or 0 to 100
  label = 'Fake Probability',
  sublabel,
  size = 220,
  showBadge = true,
  className,
}) {
  // Normalize value between 0 and 1
  const normalized = Math.min(Math.max(value > 1 ? value / 100 : value, 0), 1);
  const percentage = Math.round(normalized * 100);
  const risk = getRiskLevel(normalized);

  // SVG semi-circle geometry
  const radius = 80;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half-circle arc length ~ 251.327
  const strokeDashoffset = circumference - normalized * circumference;

  // Determine active color stroke based on risk
  const getStrokeColor = () => {
    if (normalized >= 0.7) return '#f43f5e'; // rose-500 (fake)
    if (normalized >= 0.4) return '#f59e0b'; // amber-500 (suspicious)
    return '#10b981'; // emerald-500 (genuine)
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-4 select-none',
        className
      )}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size * 0.65 }}
      >
        <svg
          viewBox="0 0 200 120"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Linear gradient along the arc */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />   {/* Genuine emerald */}
              <stop offset="50%" stopColor="#f59e0b" />  {/* Warning amber */}
              <stop offset="100%" stopColor="#f43f5e" /> {/* Fake rose */}
            </linearGradient>
            
            <filter id="gaugeShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-slate-100 dark:text-slate-800"
          />

          {/* Colored / Progress Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />

          {/* Indicator Dot at current progress point */}
          {(() => {
            const angle = Math.PI * (1 - normalized); // from PI to 0
            const cx = 100 - radius * Math.cos(angle);
            const cy = 100 - radius * Math.sin(angle);
            return (
              <circle
                cx={cx}
                cy={cy}
                r="7"
                fill={getStrokeColor()}
                stroke="#ffffff"
                strokeWidth="2.5"
                filter="url(#gaugeShadow)"
                className="transition-all duration-700 ease-out dark:stroke-slate-900"
              />
            );
          })()}
        </svg>

        {/* Center Text Stats */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center text-center">
          <span
            className="text-3xl font-black tracking-widest uppercase"
            style={{ color: getStrokeColor() }}
          >
            {normalized >= 0.5 ? 'FAKE' : 'REAL'}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {percentage}% {label}
          </span>
        </div>
      </div>

      {/* Risk Badge and Subtext */}
      {showBadge && (
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
              risk.textColor,
              risk.bgColor,
              risk.borderColor
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full animate-pulse',
                risk.variant === 'fake' && 'bg-rose-500',
                risk.variant === 'warning' && 'bg-amber-500',
                risk.variant === 'genuine' && 'bg-emerald-500'
              )}
            />
            {risk.label}
          </span>
          {sublabel && (
            <span className="text-xs text-slate-400 dark:text-slate-500 text-center">
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default Gauge;
