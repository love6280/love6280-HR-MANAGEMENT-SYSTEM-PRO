import React from 'react';

const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  onRowClick,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            {columns.map((col, idx) => (
              <th key={idx} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {loading ? (
            // Skeleton Loading State
            Array.from({ length: 4 }).map((_, rIdx) => (
              <tr key={rIdx}>
                {columns.map((_, cIdx) => (
                  <td key={cIdx} className="px-5 py-4">
                    <div className="h-4 bg-white/5 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            // Empty State
            <tr>
              <td colSpan={columns.length} className="px-5 py-8 text-center text-text-muted text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            // Data Rows
            data.map((row, rIdx) => (
              <tr
                key={row._id || rIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`
                  transition-colors duration-150 group
                  ${onRowClick ? 'cursor-pointer hover:bg-white/[0.04]' : 'hover:bg-white/[0.02]'}
                `}
              >
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="px-5 py-3 text-sm text-text-primary">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
