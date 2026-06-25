import React, { forwardRef } from 'react';

const Select = forwardRef(({
  label,
  options = [],
  error,
  helperText,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full py-2.5 px-3.5 rounded-lg input-glass text-sm glow-border ${error ? 'border-state-danger focus:border-state-danger' : ''} ${className}`}
        {...props}
      >
        {options.map((opt, i) => (
          <option key={i} value={opt.value} className="bg-background-end text-text-primary">
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-state-danger">
          {error.message || error}
        </span>
      )}
      {!error && helperText && (
        <span className="text-xs text-text-muted">
          {helperText}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
