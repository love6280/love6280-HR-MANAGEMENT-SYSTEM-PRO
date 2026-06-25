import React, { useState } from 'react';

const Avatar = ({
  src,
  name = '',
  size = 'md',
  className = '',
}) => {
  const [error, setError] = useState(false);

  const getInitials = (n) => {
    if (!n) return '';
    const parts = n.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-20 h-20 text-xl font-bold',
  };

  const hashColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-accent-primary/20 text-accent-primary border-accent-primary/30',
      'bg-accent-secondary/20 text-accent-secondary border-accent-secondary/30',
      'bg-state-success/20 text-state-success border-state-success/30',
      'bg-state-warning/20 text-state-warning border-state-warning/30',
      'bg-rose-500/20 text-rose-400 border-rose-500/30'
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`relative shrink-0 select-none overflow-hidden rounded-full border ${sizes[size]} flex items-center justify-center ${className}`}>
      {src && !error ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center font-medium ${hashColor(name)}`}>
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
