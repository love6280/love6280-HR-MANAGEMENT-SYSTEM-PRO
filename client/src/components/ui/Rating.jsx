import React from 'react';
import { Star } from 'lucide-react';

const Rating = ({
  value = 0,
  onChange,
  max = 5,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= value;

        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onChange && onChange(starValue)}
            className={`
              p-0.5 transition-all duration-150 outline-none
              ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
            `}
          >
            <Star
              className={`
                h-5.5 w-5.5 transition-colors
                ${isFilled 
                  ? 'fill-state-warning text-state-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
                  : 'text-text-muted hover:text-state-warning/60'
                }
              `}
            />
          </button>
        );
      })}
    </div>
  );
};

export default Rating;
