import React from 'react';

const ProgressBar = ({
  value = 0,
  max = 100,
  color = 'blue', // 'blue' | 'purple' | 'green' | 'amber' | 'rose'
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    blue: 'bg-accent-primary shadow-[0_0_10px_rgba(79,158,255,0.4)]',
    purple: 'bg-accent-secondary shadow-[0_0_10px_rgba(139,92,246,0.4)]',
    green: 'bg-state-success shadow-[0_0_10px_rgba(16,185,129,0.4)]',
    amber: 'bg-state-warning shadow-[0_0_10px_rgba(245,158,11,0.4)]',
    rose: 'bg-state-danger shadow-[0_0_10px_rgba(244,63,94,0.4)]',
  };

  return (
    <div className={`w-full flex flex-col gap-1 ${className}`}>
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-[10px] text-text-secondary font-mono">
        <span>{percentage.toFixed(0)}%</span>
        <span>{value}/{max}</span>
      </div>
    </div>
  );
};

export default ProgressBar;
