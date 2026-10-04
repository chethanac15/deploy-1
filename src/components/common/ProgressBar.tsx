import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100 or higher
  max?: number;
  height?: 'sm' | 'md' | 'lg';
  color?: string;
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  height = 'md',
  color,
  showLabel = false,
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const rawPercentage = Math.round((value / max) * 100);

  // Determine color based on percentage if not explicitly provided
  let barColor = color;
  if (!barColor) {
    if (rawPercentage > 100) barColor = 'bg-rose-600';
    else if (rawPercentage >= 86) barColor = 'bg-rose-500';
    else if (rawPercentage >= 71) barColor = 'bg-amber-500';
    else barColor = 'bg-brand-500';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5'
  }[height];

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1 font-medium">
          <span>Progress</span>
          <span className="text-slate-900 font-semibold">{rawPercentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClasses} p-0.5`}>
        <div
          className={`${barColor} ${heightClasses} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
