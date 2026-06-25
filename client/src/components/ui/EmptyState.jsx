import React from 'react';

const EmptyState = ({
  icon: Icon,
  title = 'No Data Found',
  description = 'There are no items to display at this time.',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center glass-card border border-white/5 py-16">
      {Icon && (
        <div className="p-4 rounded-full bg-white/5 text-text-secondary mb-4">
          <Icon className="h-10 w-10 text-accent-primary" />
        </div>
      )}
      <h3 className="text-lg font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-text-secondary text-sm max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
