import React from 'react';
import { cn } from '../utils/cn';
import { getRiskLevel } from '../utils/formatters';

export function Gauge({
  value = 0,
  label = 'Fake Probability',
  sublabel,
  size = 220,
  showBadge = true,
  className,
}) {
  const normalized = Math.min(Math.max(value > 1 ? value / 100 : value, 0), 1);
  const percentage = Math.round(normalized * 100);
  const risk = getRiskLevel(normalized);

  const radius = 80;
  const strokeWidth = 14;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - normalized * circumference;

  const getStrokeColor = () => {
    if (normalized >= 0.7) return '#E05A5A';
    if (normalized >= 0.4) return '#E8A838';
    return '#2FAE7A';
  };

  const getRiskDotColor = () => {
    if (risk.variant === 'fake') return '#E05A5A';
    if (risk.variant === 'warning') return '#E8A838';
    return '#2FAE7A';
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
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2FAE7A" />
              <stop offset="50%" stopColor="#E8A838" />
              <stop offset="100%" stopColor="#E05A5A" />
            </linearGradient>

            <filter id="gaugeShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#E6ECF5"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
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
            className="motion-safe:transition-all duration-700 ease-out"
          />

          {/* Indicator Dot at current progress point */}
          {(() => {
            const angle = Math.PI * (1 - normalized);
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
                className="motion-safe:transition-all duration-700 ease-out"
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
          <span className="text-[11px] font-medium text-tl-muted mt-0.5">
            {percentage}% {label}
          </span>
        </div>
      </div>

      {/* Risk Badge and Subtext */}
      {showBadge && (
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] text-xs font-semibold',
              risk.textColor,
              risk.bgColor
            )}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: getRiskDotColor() }}
            />
            {risk.label}
          </span>
          {sublabel && (
            <span className="text-xs text-tl-muted text-center">
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default Gauge;
