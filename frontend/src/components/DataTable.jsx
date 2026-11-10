import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../utils/cn';
import EmptyState from './EmptyState';

export function DataTable({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = 'Search reviews, products, IDs...',
  pageSizeOptions = [5, 10, 25],
  defaultPageSize = 5,
  emptyMessage = 'No matching results found',
  className,
  onRowClick,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();

    return data.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return Object.values(val).some((innerVal) =>
            String(innerVal).toLowerCase().includes(query)
          );
        }
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return sortOrder === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder]);

  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, validCurrentPage, pageSize]);

  return (
    <div className={cn('w-full flex flex-col space-y-4', className)}>
      {/* Top Bar: Search & Page size */}
      {searchable && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tl-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-sm bg-tl-fill border border-tl-border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-tl-accent/30 focus:border-tl-accent transition-all duration-200 ease-out text-tl-text placeholder-tl-muted"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-tl-muted">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-tl-fill border border-tl-border rounded-[10px] px-2.5 py-1.5 text-xs text-tl-text focus:outline-none focus:ring-1 focus:ring-tl-accent cursor-pointer"
            >
              {pageSizeOptions.map((sz) => (
                <option key={sz} value={sz}>
                  {sz} entries
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-[14px] border border-tl-border bg-tl-card shadow-card overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-tl-fill text-[11px] uppercase tracking-wider font-semibold text-tl-muted">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    className={cn(
                      'px-5 py-3.5 select-none transition-colors duration-200 ease-out',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.sortable !== false
                        ? 'cursor-pointer hover:bg-tl-bg'
                        : 'cursor-default'
                    )}
                  >
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        col.align === 'right' && 'justify-end',
                        col.align === 'center' && 'justify-center'
                      )}
                    >
                      <span>{col.label}</span>
                      {col.sortable !== false && (
                        <span className="text-tl-muted">
                          {isSorted ? (
                            sortOrder === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-tl-accent" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-tl-accent" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="text-tl-text">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    'border-b border-tl-border last:border-0 transition-colors duration-150',
                    onRowClick && 'cursor-pointer hover:bg-tl-fill/50',
                    !onRowClick && 'hover:bg-tl-fill/50'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-5 py-3.5',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center'
                      )}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center">
                  <EmptyState
                    title="No records match your criteria"
                    description={
                      searchQuery
                        ? `No results found for "${searchQuery}". Try modifying your search term.`
                        : emptyMessage
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 text-xs text-tl-muted">
          <div>
            Showing{' '}
            <span className="font-semibold text-tl-text">
              {(validCurrentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-tl-text">
              {Math.min(validCurrentPage * pageSize, totalItems)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-tl-text">
              {totalItems}
            </span>{' '}
            results
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className="p-1.5 rounded-[10px] border border-tl-border hover:bg-tl-fill disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 ease-out"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isCurrent = pageNum === validCurrentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    'min-w-8 h-8 px-2 rounded-[10px] font-medium transition-colors duration-200 ease-out text-xs',
                    isCurrent
                      ? 'bg-tl-accent text-white font-semibold'
                      : 'border border-tl-border hover:bg-tl-fill text-tl-text'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className="p-1.5 rounded-[10px] border border-tl-border hover:bg-tl-fill disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 ease-out"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
