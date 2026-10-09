import React from 'react';

export default function MatchRing({ percent = 100, size = 52, strokeWidth = 5 }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clampedPercent / 100) * circumference;

  let strokeColor = '#0d9488'; // teal-600 (eligible)
  let bgColor = 'text-teal-50';
  let textColor = 'text-teal-900';

  if (clampedPercent >= 100) {
    strokeColor = '#059669'; // emerald-600
  } else if (clampedPercent >= 60) {
    strokeColor = '#d97706'; // amber-600
    textColor = 'text-amber-900';
  } else {
    strokeColor = '#94a3b8'; // slate-400
    textColor = 'text-slate-700';
  }

  return (
    <div 
      className="relative inline-flex items-center justify-center shrink-0" 
      style={{ width: size, height: size }}
      title={`${clampedPercent}% Eligibility Match`}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className={`absolute flex flex-col items-center justify-center font-bold text-[11px] sm:text-xs ${textColor}`}>
        <span>{Math.round(clampedPercent)}%</span>
      </div>
    </div>
  );
}
