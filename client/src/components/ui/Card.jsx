import React from 'react';

const Card = ({
  children,
  glass = true,
  hover = true,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        ${glass ? 'glass-card' : 'bg-background-end/40 border border-white/5 rounded-xl'} 
        ${hover ? 'glass-card-hover' : ''} 
        p-5 ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
