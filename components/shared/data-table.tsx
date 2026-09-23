'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, Input } from '@/components/ui/primitives';
import { EmptyState, TableSkeleton } from './states';
import type { Pagination } from '@/types';

export interface Column<T> {
  key: string;
  header: string;
  /** Rendered cell. Keep it a node so tables stay declarative. */
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  toolbar?: React.ReactNode;
  search?: { value: string; onChange: (value: string) => void; placeholder?: string };
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  onRowClick,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  pagination,
  onPageChange,
  toolbar,
  search,
}: DataTableProps<T>) {
  return (
    <Card className="overflow-hidden">
      {search || toolbar ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          {search ? (
            <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
                placeholder={search.placeholder ?? 'Search…'}
                className="h-8 pl-8"
              />
            </div>
          ) : null}
          {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
        </div>
      ) : null}

      {isLoading ? (
        <TableSkeleton columns={Math.min(columns.length, 5)} />
      ) : rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                      column.headerClassName,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-secondary/50')}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn('px-4 py-3 align-middle', column.className)}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!pagination.hasMore}
              onClick={() => onPageChange?.(pagination.page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

/** Debounces a fast-changing value (search boxes) before it hits the API. */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'muted' | 'outline'> = {
  OPEN: 'default',
  PENDING: 'warning',
  RESOLVED: 'success',
  SNOOZED: 'muted',
  DRAFT: 'muted',
  CONFIRMED: 'default',
  PROCESSING: 'default',
  SHIPPED: 'default',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
  UNPAID: 'warning',
  PARTIAL: 'warning',
  PAID: 'success',
  CREATED: 'muted',
  PICKED_UP: 'default',
  IN_TRANSIT: 'default',
  OUT_FOR_DELIVERY: 'default',
  RETURNED: 'destructive',
  COMPLETED: 'success',
  MISSED: 'destructive',
  FAILED: 'destructive',
  VOICEMAIL: 'warning',
  RINGING: 'warning',
  IN_PROGRESS: 'default',
  CONNECTED: 'success',
  DISCONNECTED: 'muted',
  ERROR: 'destructive',
  EXPIRED: 'warning',
  READY: 'success',
  ACTIVE: 'success',
  INVITED: 'warning',
  SUSPENDED: 'destructive',
};
