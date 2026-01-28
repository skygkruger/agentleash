'use client';

// ═══════════════════════════════════════════════════════════════
// SCOPEAGENT TABLE COMPONENT
// Retro terminal styled data table
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T, index: number) => void;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

export function Table<T extends object>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data found',
  loading = false,
  className,
}: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-scope-border">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  'text-left py-2 px-3 text-xs text-scope-amber font-normal',
                  column.width && `w-[${column.width}]`
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-scope-muted"
              >
                <span className="animate-pulse">[~] Loading...</span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-8 text-center text-scope-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={index}
                onClick={() => onRowClick?.(item, index)}
                className={cn(
                  'border-b border-scope-border-light hover:bg-scope-bg-light',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={cn('py-2 px-3 text-scope-text', column.className)}
                  >
                    {column.render
                      ? column.render(item, index)
                      : String(item[column.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-2 py-1 text-xs text-scope-muted hover:text-scope-amber disabled:opacity-50 disabled:cursor-not-allowed"
      >
        [{'<'}]
      </button>
      <span className="text-xs text-scope-muted">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-2 py-1 text-xs text-scope-muted hover:text-scope-amber disabled:opacity-50 disabled:cursor-not-allowed"
      >
        [{'>'}]
      </button>
    </div>
  );
}

export default Table;
