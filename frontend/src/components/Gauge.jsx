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

          {/* Arc end labels: 0% left, 100% right */}
          <text x="14" y="115" fontSize="9" fill="#6B7A93" textAnchor="middle" fontWeight="600">0%</text>
          <text x="186" y="115" fontSize="9" fill="#6B7A93" textAnchor="middle" fontWeight="600">100%</text>
          <text x="100" y="22" fontSize="9" fill="#6B7A93" textAnchor="middle" fontWeight="600">50%</text>

          {/* Percentage label above needle tip */}
          {(() => {
            const angle = Math.PI - normalized * Math.PI;
            const labelR = radius + 16;
            const lx = 100 + labelR * Math.cos(angle);
            const ly = 100 - labelR * Math.sin(angle);
            return (
              <text
                x={lx} y={ly}
                fontSize="10"
                fill={getStrokeColor()}
                textAnchor="middle"
                fontWeight="800"
                dominantBaseline="middle"
              >
                {percentage}%
              </text>
            );
          })()}

          {/* Needle pointer at exact percentage position */}
          {(() => {
            // Arc goes from left (20,100) at 0% → top (100,20) at 50% → right (180,100) at 100%
            // Angle 0 = left side (π radians from positive x-axis), angle π = right side
            // So: angle = π - normalized * π  →  left at 0%, right at 100%
            const angle = Math.PI - normalized * Math.PI;
            const dotCx = 100 + radius * Math.cos(angle);
            const dotCy = 100 - radius * Math.sin(angle);
            // Needle line from center (100,100) to the dot
            const needleLen = radius - strokeWidth / 2 - 2;
            const nx = 100 + needleLen * Math.cos(angle);
            const ny = 100 - needleLen * Math.sin(angle);
            return (
              <g className="motion-safe:transition-all duration-700 ease-out">
                {/* Needle line */}
                <line
                  x1="100" y1="100"
                  x2={nx} y2={ny}
                  stroke={getStrokeColor()}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Center pivot */}
                <circle cx="100" cy="100" r="5" fill={getStrokeColor()} stroke="#ffffff" strokeWidth="2" />
                {/* Tip dot */}
                <circle
                  cx={dotCx}
                  cy={dotCy}
                  r="6"
                  fill={getStrokeColor()}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  filter="url(#gaugeShadow)"
                />
              </g>
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
