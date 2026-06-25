import React from 'react';

const Timeline = ({ items = [], className = '' }) => {
  return (
    <div className={`flex flex-col relative ${className}`}>
      {/* Connecting line */}
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-white/10" />

      {items.map((item, idx) => {
        const Icon = item.icon;

        return (
          <div key={idx} className="flex gap-4 mb-5 last:mb-0 relative group">
            {/* Circle / Icon wrapper */}
            <div
              className={`
                w-8 h-8 rounded-full border border-white/10 bg-background-end flex items-center justify-center shrink-0 z-10 transition-all duration-200 group-hover:border-accent-primary group-hover:shadow-[0_0_10px_rgba(79,158,255,0.3)]
                ${item.active ? 'border-accent-primary text-accent-primary' : 'text-text-secondary'}
              `}
            >
              {Icon ? <Icon className="h-4 w-4" /> : <div className="w-2.5 h-2.5 rounded-full bg-current" />}
            </div>

            {/* Content card */}
            <div className="flex flex-col gap-1 pt-0.5">
              <span className="text-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
                {item.title}
              </span>
              {item.description && (
                <p className="text-xs text-text-secondary leading-relaxed">
                  {item.description}
                </p>
              )}
              {item.time && (
                <span className="text-[10px] font-mono text-text-muted mt-1 uppercase">
                  {item.time}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
