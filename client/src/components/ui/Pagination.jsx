import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

const Pagination = ({
  total = 0,
  page = 1,
  perPage = 10,
  onChange,
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const handlePrev = () => {
    if (page > 1) onChange(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) onChange(page + 1);
  };

  return (
    <div className={`flex items-center justify-between w-full py-4 border-t border-white/5 ${className}`}>
      <span className="text-xs text-text-secondary">
        Showing <span className="font-semibold text-text-primary font-mono">{Math.min(total, (page - 1) * perPage + 1)}</span> to{' '}
        <span className="font-semibold text-text-primary font-mono">{Math.min(total, page * perPage)}</span> of{' '}
        <span className="font-semibold text-text-primary font-mono">{total}</span> records
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePrev}
          disabled={page === 1}
          icon={ChevronLeft}
        >
          Previous
        </Button>
        <span className="text-xs text-text-secondary px-2">
          Page <span className="font-semibold text-text-primary font-mono">{page}</span> of{' '}
          <span className="font-semibold text-text-primary font-mono">{totalPages}</span>
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNext}
          disabled={page === totalPages}
          icon={ChevronRight}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
