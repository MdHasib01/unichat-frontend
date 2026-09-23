'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, ShoppingCart } from 'lucide-react';
import { getWithMeta } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge, UserAvatar } from '@/components/ui/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/overlays';
import { DataTable, STATUS_VARIANTS, useDebounced, type Column } from '@/components/shared/data-table';
import { OrderDialog } from '@/features/sales/order-dialog';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

const ORDER_STATUSES: OrderStatus[] = [
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

const PAYMENT_STATUSES: PaymentStatus[] = ['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'];

export default function OrdersPage() {
  const router = useRouter();
  const { can } = useSession();

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<OrderStatus | 'all'>('all');
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus | 'all'>('all');
  const [createOpen, setCreateOpen] = React.useState(false);

  const debouncedSearch = useDebounced(search);

  const params = {
    page,
    pageSize: 25,
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    paymentStatus: paymentStatus === 'all' ? undefined : paymentStatus,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () => getWithMeta<Order[]>('/sales/orders', params),
  });

  React.useEffect(() => setPage(1), [debouncedSearch, status, paymentStatus]);

  const columns: Array<Column<Order>> = [
    {
      key: 'orderNumber',
      header: 'Order',
      cell: (order) => (
        <div>
          <p className="font-medium">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{formatDate(order.placedAt)}</p>
        </div>
      ),
      className: 'w-40',
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (order) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar
            name={order.contact?.displayName ?? order.customerName}
            src={order.contact?.avatarUrl}
            className="h-7 w-7"
          />
          <div className="min-w-0">
            <p className="truncate text-sm">
              {order.contact?.displayName ?? order.customerName ?? 'Walk-in customer'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {order.customerPhone ?? order.contact?.phone ?? order.customerEmail ?? '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      cell: (order) => (
        <span className="text-muted-foreground">
          {order.items.reduce((sum, item) => sum + item.quantity, 0)}
        </span>
      ),
      className: 'w-20',
    },
    {
      key: 'total',
      header: 'Total',
      cell: (order) => (
        <span className="font-semibold tabular-nums">
          {formatCurrency(order.total, order.currency)}
        </span>
      ),
      className: 'w-32',
    },
    {
      key: 'payment',
      header: 'Payment',
      cell: (order) => (
        <Badge variant={STATUS_VARIANTS[order.paymentStatus] ?? 'secondary'}>
          {order.paymentStatus.toLowerCase()}
        </Badge>
      ),
      className: 'w-28',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (order) => (
        <Badge variant={STATUS_VARIANTS[order.status] ?? 'secondary'}>
          {order.status.toLowerCase()}
        </Badge>
      ),
      className: 'w-32',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Orders"
        description="Orders raised from conversations or entered by your team, with their parcels and payment status."
        actions={
          can('sales.manage') ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New order
            </Button>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(order) => order.id}
        isLoading={isLoading}
        onRowClick={(order) => router.push(`/sales/orders/${order.id}`)}
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        search={{ value: search, onChange: setSearch, placeholder: 'Order number, name or phone' }}
        emptyTitle="No orders yet"
        emptyDescription="Create an order from a conversation, or add one manually."
        emptyAction={
          can('sales.manage') ? (
            <Button onClick={() => setCreateOpen(true)}>
              <ShoppingCart className="h-4 w-4" />
              Create an order
            </Button>
          ) : null
        }
        toolbar={
          <>
            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ORDER_STATUSES.map((option) => (
                  <SelectItem key={option} value={option} className="capitalize">
                    {option.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={paymentStatus}
              onValueChange={(value) => setPaymentStatus(value as typeof paymentStatus)}
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="Any payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any payment</SelectItem>
                {PAYMENT_STATUSES.map((option) => (
                  <SelectItem key={option} value={option} className="capitalize">
                    {option.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <OrderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </PageContainer>
  );
}
