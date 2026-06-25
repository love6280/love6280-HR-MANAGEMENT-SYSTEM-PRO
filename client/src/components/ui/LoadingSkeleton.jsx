import React from 'react';

const LoadingSkeleton = ({ type = 'card' }) => {
  if (type === 'table') {
    return (
      <div className="w-full flex flex-col gap-4 animate-pulse">
        <div className="h-10 bg-white/5 rounded-lg w-full" />
        <div className="h-8 bg-white/5 rounded-lg w-full" />
        <div className="h-8 bg-white/5 rounded-lg w-full" />
        <div className="h-8 bg-white/5 rounded-lg w-full" />
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5">
            <div className="h-10 w-10 bg-white/5 rounded-full" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 bg-white/5 rounded w-1/3" />
              <div className="h-3 bg-white/5 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: card skeleton
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 bg-white/5 border border-white/10 rounded-2xl p-5" />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
