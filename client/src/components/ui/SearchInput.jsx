import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchInput = ({
  placeholder = 'Search...',
  onSearch,
  className = '',
}) => {
  const [val, setVal] = useState('');

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(val);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [val, onSearch]);

  return (
    <div className={`relative flex items-center w-full max-w-sm ${className}`}>
      <div className="absolute left-3 text-text-muted">
        <Search className="h-4.5 w-4.5" />
      </div>
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2 pl-10 pr-9 rounded-lg input-glass text-sm glow-border"
      />
      {val && (
        <button
          onClick={() => setVal('')}
          className="absolute right-3 text-text-muted hover:text-text-primary p-0.5 rounded-full hover:bg-white/5 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
