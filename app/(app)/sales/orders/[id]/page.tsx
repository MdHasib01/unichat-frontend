'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, MessageSquare, Package, Phone, Truck, User } from 'lucide-react';
import { toast } from 'sonner';
import { get, patch, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { PageContainer } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Separator,
  Skeleton,
} from '@/components/ui/primitives';
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
import { ErrorState } from '@/components/shared/states';
import { STATUS_VARIANTS } from '@/components/shared/data-table';
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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { can } = useSession();
  const manage = can('sales.manage');
  const [parcelOpen, setParcelOpen] = React.useState(false);

  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => get<Order>(`/sales/orders/${id}`),
  });

  const update = useMutation({
    mutationFn: (payload: { status?: OrderStatus; paymentStatus?: PaymentStatus }) =>
      patch(`/sales/orders/${id}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isError) {
    return (
      <PageContainer>
        <ErrorState title="Order not found" onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  if (isLoading || !order) {
    return (
      <PageContainer>
        <Skeleton className="h-28 w-full" />
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/sales/orders">
          <ArrowLeft className="h-4 w-4" />
          All orders
        </Link>
      </Button>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{order.orderNumber}</h1>
            <Badge variant={STATUS_VARIANTS[order.status] ?? 'secondary'}>
              {order.status.toLowerCase()}
            </Badge>
            <Badge variant={STATUS_VARIANTS[order.paymentStatus] ?? 'secondary'}>
              {order.paymentStatus.toLowerCase()}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Placed {formatDateTime(order.placedAt)}</p>
        </div>

        {manage ? (
          <div className="flex flex-wrap gap-2">
            <Select
              value={order.status}
              onValueChange={(value) => update.mutate({ status: value as OrderStatus })}
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={order.paymentStatus}
              onValueChange={(value) => update.mutate({ paymentStatus: value as PaymentStatus })}
            >
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'] as PaymentStatus[]).map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setParcelOpen(true)}>
              <Truck className="h-4 w-4" />
              Add parcel
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary">
                      {item.product?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      {item.sku ? (
                        <p className="text-xs text-muted-foreground">SKU {item.sku}</p>
                      ) : null}
                    </div>

                    <span className="text-sm text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPrice, order.currency)}
                    </span>
                    <span className="w-24 text-right text-sm font-semibold tabular-nums">
                      {formatCurrency(item.total, order.currency)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1 p-5 text-sm">
                <SummaryRow label="Subtotal" value={formatCurrency(order.subtotal, order.currency)} />
                {Number(order.discount) > 0 ? (
                  <SummaryRow
                    label="Discount"
                    value={`− ${formatCurrency(order.discount, order.currency)}`}
                  />
                ) : null}
                {Number(order.shippingFee) > 0 ? (
                  <SummaryRow label="Shipping" value={formatCurrency(order.shippingFee, order.currency)} />
                ) : null}
                {Number(order.tax) > 0 ? (
                  <SummaryRow label="Tax" value={formatCurrency(order.tax, order.currency)} />
                ) : null}
                <Separator className="my-2" />
                <SummaryRow label="Total" value={formatCurrency(order.total, order.currency)} bold />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parcels</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {order.parcels.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-muted-foreground">
                  No parcel has been created for this order yet.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {order.parcels.map((parcel) => (
                    <Link
                      key={parcel.id}
                      href={`/sales/parcels/${parcel.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/50"
                    >
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{parcel.trackingNumber}</p>
                        <p className="text-xs text-muted-foreground">{parcel.courier}</p>
                      </div>
                      <Badge variant={STATUS_VARIANTS[parcel.status] ?? 'secondary'}>
                        {parcel.status.replace(/_/g, ' ').toLowerCase()}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Detail
              icon={User}
              label="Name"
              value={order.contact?.displayName ?? order.customerName}
            />
            <Detail icon={Phone} label="Phone" value={order.customerPhone ?? order.contact?.phone} />
            <Detail
              icon={MapPin}
              label="Delivery"
              value={[order.shippingAddress, order.city, order.postalCode].filter(Boolean).join(', ')}
            />

            {order.note ? (
              <div className="rounded-lg bg-secondary/60 p-3 text-xs">
                <p className="font-medium">Note</p>
                <p className="mt-0.5 text-muted-foreground">{order.note}</p>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 pt-1">
              {order.contact ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/contacts/${order.contact.id}`}>
                    <User className="h-3.5 w-3.5" />
                    Open contact
                  </Link>
                </Button>
              ) : null}
              {order.conversation ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/inbox/${order.conversation.id}`}>
                    <MessageSquare className="h-3.5 w-3.5" />
                    Open conversation
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateParcelDialog
        open={parcelOpen}
        onOpenChange={setParcelOpen}
        order={order}
        onCreated={() => void queryClient.invalidateQueries({ queryKey: queryKeys.order(id) })}
      />
    </PageContainer>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? 'font-semibold' : 'text-muted-foreground'}>{label}</span>
      <span className={`tabular-nums ${bold ? 'text-base font-semibold' : ''}`}>{value}</span>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-2xs text-muted-foreground">{label}</p>
        <p className="break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

function CreateParcelDialog({
  open,
  onOpenChange,
  order,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onCreated: () => void;
}) {
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = React.useState('');
  const [courier, setCourier] = React.useState('');

  const create = useMutation({
    mutationFn: () =>
      post('/sales/parcels', {
        orderId: order.id,
        trackingNumber: trackingNumber.trim(),
        courier: courier.trim(),
        recipientName: order.contact?.displayName ?? order.customerName,
        recipientPhone: order.customerPhone ?? order.contact?.phone,
        address: order.shippingAddress,
        city: order.city,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['parcels'] });
      onCreated();
      onOpenChange(false);
      setTrackingNumber('');
      setCourier('');
      toast.success('Parcel created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a parcel</DialogTitle>
          <DialogDescription>
            Recipient details are copied from order {order.orderNumber}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FormField label="Tracking number" required>
            <Input
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="TRK123456"
              autoFocus
            />
          </FormField>
          <FormField label="Courier" required>
            <Input
              value={courier}
              onChange={(event) => setCourier(event.target.value)}
              placeholder="SwiftPost"
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            loading={create.isPending}
            disabled={!trackingNumber.trim() || !courier.trim()}
          >
            Create parcel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
