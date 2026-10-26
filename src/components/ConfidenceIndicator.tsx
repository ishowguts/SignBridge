import React from 'react';

interface ConfidenceIndicatorProps {
  value: number | null; // 0–1
  label?: string;
  simulated?: boolean;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  value,
  simulated = true,
  label = simulated ? 'Demo confidence: illustrative only' : 'Model confidence',
}) => {
  const percentage = value !== null ? Math.round(value * 100) : 0;

  const barColor =
    value === null
      ? 'bg-gray-300 dark:bg-gray-600'
      : value >= 0.8
      ? 'bg-green-500'
      : value >= 0.6
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        {value !== null && (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {percentage}%
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${percentage}%`}
        className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">
        {simulated
          ? 'This is a simulated illustrative value and does not represent actual model confidence.'
          : 'Softmax probability of the top class, averaged over the last second of frames.'}
      </p>
    </div>
  );
};
