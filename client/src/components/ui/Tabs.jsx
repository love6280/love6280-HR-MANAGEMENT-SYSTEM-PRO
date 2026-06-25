import React from 'react';

const Tabs = ({
  items = [],
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex border-b border-white/10 gap-1 overflow-x-auto scrollbar-none ${className}`}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 shrink-0
              ${isActive 
                ? 'border-accent-primary text-accent-primary bg-accent-primary/5' 
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-white/5'
              }
            `}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
