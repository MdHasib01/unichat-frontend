'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { get, getWithMeta, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge, FormField, Input } from '@/components/ui/primitives';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/overlays';
import { DataTable, STATUS_VARIANTS, useDebounced, type Column } from '@/components/shared/data-table';
import type { Order, Parcel, ParcelStatus } from '@/types';

const PARCEL_STATUSES: ParcelStatus[] = [
  'CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURNED',
  'CANCELLED',
];

export default function ParcelsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = useSession();
  const manage = can('sales.manage');

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<ParcelStatus | 'all'>('all');
  const [createOpen, setCreateOpen] = React.useState(false);

  const debouncedSearch = useDebounced(search);
  const params = {
    page,
    pageSize: 25,
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.parcels(params),
    queryFn: () => getWithMeta<Parcel[]>('/sales/parcels', params),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: ParcelStatus }) =>
      post(`/sales/parcels/${id}/status`, { status: next }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['parcels'] });
      toast.success('Parcel status updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  React.useEffect(() => setPage(1), [debouncedSearch, status]);

  const columns: Array<Column<Parcel>> = [
    {
      key: 'tracking',
      header: 'Tracking',
      cell: (parcel) => (
        <div>
          <p className="font-medium">{parcel.trackingNumber}</p>
          <p className="text-xs text-muted-foreground">{parcel.courier}</p>
        </div>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      cell: (parcel) =>
        parcel.order ? (
          <span className="text-sm">{parcel.order.orderNumber}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Standalone</span>
        ),
      className: 'w-32',
    },
    {
      key: 'recipient',
      header: 'Recipient',
      cell: (parcel) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{parcel.recipientName ?? '—'}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[parcel.city, parcel.recipientPhone].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (parcel) =>
        manage ? (
          <Select
            value={parcel.status}
            onValueChange={(value) => updateStatus.mutate({ id: parcel.id, next: value as ParcelStatus })}
          >
            <SelectTrigger className="h-7 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARCEL_STATUSES.map((option) => (
                <SelectItem key={option} value={option} className="capitalize">
                  {option.replace(/_/g, ' ').toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant={STATUS_VARIANTS[parcel.status] ?? 'secondary'}>
            {parcel.status.replace(/_/g, ' ').toLowerCase()}
          </Badge>
        ),
      className: 'w-48',
    },
    {
      key: 'created',
      header: 'Created',
      cell: (parcel) => (
        <span className="text-xs text-muted-foreground">{formatDate(parcel.createdAt)}</span>
      ),
      className: 'w-28',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Parcels"
        description="Track what has shipped, what is in transit and what has been delivered."
        actions={
          manage ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New parcel
            </Button>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(parcel) => parcel.id}
        isLoading={isLoading}
        onRowClick={(parcel) => router.push(`/sales/parcels/${parcel.id}`)}
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        search={{ value: search, onChange: setSearch, placeholder: 'Tracking number or recipient' }}
        emptyTitle="No parcels yet"
        emptyDescription="Create a parcel from an order, or add one directly."
        emptyAction={
          manage ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Truck className="h-4 w-4" />
              Create a parcel
            </Button>
          ) : null
        }
        toolbar={
          <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
            <SelectTrigger className="h-8 w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {PARCEL_STATUSES.map((option) => (
                <SelectItem key={option} value={option} className="capitalize">
                  {option.replace(/_/g, ' ').toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <NewParcelDialog open={createOpen} onOpenChange={setCreateOpen} />
    </PageContainer>
  );
}

function NewParcelDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({
    trackingNumber: '',
    courier: '',
    orderId: '',
    recipientName: '',
    recipientPhone: '',
    address: '',
    city: '',
  });

  const { data: orders } = useQuery({
    queryKey: queryKeys.orders({ picker: true }),
    queryFn: () => get<Order[]>('/sales/orders', { pageSize: 50 }),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      post('/sales/parcels', {
        trackingNumber: form.trackingNumber.trim(),
        courier: form.courier.trim(),
        orderId: form.orderId || null,
        recipientName: form.recipientName.trim() || null,
        recipientPhone: form.recipientPhone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['parcels'] });
      onOpenChange(false);
      setForm({
        trackingNumber: '',
        courier: '',
        orderId: '',
        recipientName: '',
        recipientPhone: '',
        address: '',
        city: '',
      });
      toast.success('Parcel created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Linking an order copies its delivery details across.
  React.useEffect(() => {
    if (!form.orderId) return;
    const order = orders?.find((o) => o.id === form.orderId);
    if (order) {
      setForm((current) => ({
        ...current,
        recipientName: order.contact?.displayName ?? order.customerName ?? '',
        recipientPhone: order.customerPhone ?? order.contact?.phone ?? '',
        address: order.shippingAddress ?? '',
        city: order.city ?? '',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.orderId, orders]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New parcel</DialogTitle>
          <DialogDescription>
            Link it to an order to copy the recipient details automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Order" className="sm:col-span-2">
            <Select value={form.orderId} onValueChange={(orderId) => setForm({ ...form, orderId })}>
              <SelectTrigger>
                <SelectValue placeholder="Optional — link an order" />
              </SelectTrigger>
              <SelectContent>
                {orders?.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.orderNumber} · {order.contact?.displayName ?? order.customerName ?? '—'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Tracking number" required>
            <Input
              value={form.trackingNumber}
              onChange={(event) => setForm({ ...form, trackingNumber: event.target.value })}
              autoFocus
            />
          </FormField>

          <FormField label="Courier" required>
            <Input
              value={form.courier}
              onChange={(event) => setForm({ ...form, courier: event.target.value })}
            />
          </FormField>

          <FormField label="Recipient">
            <Input
              value={form.recipientName}
              onChange={(event) => setForm({ ...form, recipientName: event.target.value })}
            />
          </FormField>

          <FormField label="Phone">
            <Input
              value={form.recipientPhone}
              onChange={(event) => setForm({ ...form, recipientPhone: event.target.value })}
            />
          </FormField>

          <FormField label="Address" className="sm:col-span-2">
            <Input
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </FormField>

          <FormField label="City">
            <Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            loading={create.isPending}
            disabled={!form.trackingNumber.trim() || !form.courier.trim()}
          >
            Create parcel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
