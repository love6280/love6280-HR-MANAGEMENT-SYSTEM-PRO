import React from 'react';

const DatePicker = ({
  label,
  range = false,
  value, // if single: string 'YYYY-MM-DD'. If range: { start: '', end: '' }
  onChange,
  error,
  className = '',
  ...props
}) => {
  if (range) {
    return (
      <div className={`w-full flex flex-col gap-1.5 ${className}`}>
        {label && (
          <label className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={value?.start || ''}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            className="w-full py-2.5 px-3.5 rounded-lg input-glass text-sm glow-border"
            {...props}
          />
          <span className="text-text-muted text-xs">to</span>
          <input
            type="date"
            value={value?.end || ''}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            className="w-full py-2.5 px-3.5 rounded-lg input-glass text-sm glow-border"
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-state-danger">
            {error.message || error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full py-2.5 px-3.5 rounded-lg input-glass text-sm glow-border ${error ? 'border-state-danger' : ''}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-state-danger">
          {error.message || error}
        </span>
      )}
    </div>
  );
};

export default DatePicker;
