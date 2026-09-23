'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Package, Phone, Truck, User } from 'lucide-react';
import { toast } from 'sonner';
import { get, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { PageContainer } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/overlays';
import { ErrorState } from '@/components/shared/states';
import { STATUS_VARIANTS } from '@/components/shared/data-table';
import type { Parcel, ParcelStatus } from '@/types';

const PARCEL_STATUSES: ParcelStatus[] = [
  'CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURNED',
  'CANCELLED',
];

export default function ParcelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { can } = useSession();

  const { data: parcel, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.parcel(id),
    queryFn: () => get<Parcel & { order?: { id: string; orderNumber: string; total?: string; currency?: string; contact?: { id: string; displayName: string } | null } | null }>(`/sales/parcels/${id}`),
  });

  const updateStatus = useMutation({
    mutationFn: (status: ParcelStatus) => post(`/sales/parcels/${id}/status`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.parcel(id) });
      void queryClient.invalidateQueries({ queryKey: ['parcels'] });
      toast.success('Parcel status updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isError) {
    return (
      <PageContainer>
        <ErrorState title="Parcel not found" onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  if (isLoading || !parcel) {
    return (
      <PageContainer>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="mt-4 h-64 w-full" />
      </PageContainer>
    );
  }

  const history = parcel.history ?? [];

  return (
    <PageContainer className="max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/sales/parcels">
          <ArrowLeft className="h-4 w-4" />
          All parcels
        </Link>
      </Button>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{parcel.trackingNumber}</h1>
            <Badge variant={STATUS_VARIANTS[parcel.status] ?? 'secondary'}>
              {parcel.status.replace(/_/g, ' ').toLowerCase()}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {parcel.courier}
            {parcel.order ? ` · order ${parcel.order.orderNumber}` : ''}
          </p>
        </div>

        {can('sales.manage') ? (
          <Select value={parcel.status} onValueChange={(value) => updateStatus.mutate(value as ParcelStatus)}>
            <SelectTrigger className="h-9 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARCEL_STATUSES.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status.replace(/_/g, ' ').toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Journey</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-5">
                {[...history].reverse().map((entry, index) => (
                  <li key={index} className="relative">
                    <span
                      className={`absolute -left-[1.625rem] mt-1 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-card ${
                        index === 0 ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                    <p className="text-sm font-medium capitalize">
                      {entry.status.replace(/_/g, ' ').toLowerCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</p>
                    {entry.note ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{entry.note}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Detail icon={User} label="Recipient" value={parcel.recipientName} />
            <Detail icon={Phone} label="Phone" value={parcel.recipientPhone} />
            <Detail
              icon={MapPin}
              label="Address"
              value={[parcel.address, parcel.city].filter(Boolean).join(', ')}
            />
            <Detail
              icon={Package}
              label="Weight"
              value={parcel.weightKg ? `${parcel.weightKg} kg` : null}
            />
            {parcel.codAmount ? (
              <Detail
                icon={Truck}
                label="Cash on delivery"
                value={formatCurrency(parcel.codAmount, parcel.order?.currency ?? 'USD')}
              />
            ) : null}

            {parcel.order ? (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/sales/orders/${parcel.order.id}`}>View order</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
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
