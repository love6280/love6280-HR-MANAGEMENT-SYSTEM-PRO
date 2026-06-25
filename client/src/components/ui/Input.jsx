import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  prefix: Prefix,
  suffix: Suffix,
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
      <div className="relative flex items-center">
        {Prefix && (
          <div className="absolute left-3 text-text-muted">
            <Prefix className="h-4.5 w-4.5" />
          </div>
        )}
        <input
          ref={ref}
          className={`w-full py-2.5 rounded-lg input-glass ${Prefix ? 'pl-10' : 'pl-3.5'} ${Suffix ? 'pr-10' : 'pr-3.5'} text-sm glow-border ${error ? 'border-state-danger focus:border-state-danger focus:ring-state-danger/10' : ''} ${className}`}
          {...props}
        />
        {Suffix && (
          <div className="absolute right-3 text-text-muted">
            <Suffix className="h-4.5 w-4.5" />
          </div>
        )}
      </div>
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

Input.displayName = 'Input';
export default Input;
