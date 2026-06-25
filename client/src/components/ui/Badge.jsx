import React from 'react';

const Badge = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border';

  const variants = {
    success: 'bg-state-success/10 text-state-success border-state-success/20',
    warning: 'bg-state-warning/10 text-state-warning border-state-warning/20',
    danger: 'bg-state-danger/10 text-state-danger border-state-danger/20',
    info: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
    neutral: 'bg-white/5 text-text-secondary border-white/10',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
