'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package } from 'lucide-react';
import { get } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PageContainer } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui/primitives';
import { ErrorState, EmptyState } from '@/components/shared/states';
import { STATUS_VARIANTS } from '@/components/shared/data-table';
import type { OrderStatus, Product } from '@/types';

interface ProductDetail extends Product {
  orderItems: Array<{
    id: string;
    quantity: number;
    total: string;
    order: { id: string; orderNumber: string; status: OrderStatus; placedAt: string };
  }>;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => get<ProductDetail>(`/sales/products/${id}`),
  });

  if (isError) {
    return (
      <PageContainer>
        <ErrorState title="Product not found" onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  if (isLoading || !product) {
    return (
      <PageContainer>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="mt-4 h-64 w-full" />
      </PageContainer>
    );
  }

  const unitsSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const revenue = product.orderItems.reduce((sum, item) => sum + Number(item.total), 0);

  return (
    <PageContainer className="max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/sales/products">
          <ArrowLeft className="h-4 w-4" />
          All products
        </Link>
      </Button>

      <Card className="mb-4">
        <div className="flex flex-col gap-4 p-5 sm:flex-row">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Package className="h-7 w-7 text-muted-foreground" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{product.name}</h1>
              <Badge variant={product.isActive ? 'success' : 'muted'}>
                {product.isActive ? 'Active' : 'Hidden'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.sku ? `SKU ${product.sku}` : 'No SKU'}
              {product.category ? ` · ${product.category}` : ''}
            </p>
            {product.description ? (
              <p className="mt-2 text-sm leading-relaxed">{product.description}</p>
            ) : null}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(product.price, product.currency)}
            </p>
            {product.trackInventory ? (
              <p className="mt-1 text-sm text-muted-foreground">{product.stock} in stock</p>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Units sold</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{unitsSold}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatCurrency(revenue, product.currency)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Added</p>
          <p className="mt-1 text-2xl font-semibold">{formatDate(product.createdAt)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {product.orderItems.length === 0 ? (
            <EmptyState title="Not ordered yet" description="This product has not appeared on an order." />
          ) : (
            <div className="divide-y divide-border">
              {product.orderItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/sales/orders/${item.order.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/50"
                >
                  <span className="flex-1 text-sm font-medium">{item.order.orderNumber}</span>
                  <span className="text-sm text-muted-foreground">× {item.quantity}</span>
                  <Badge variant={STATUS_VARIANTS[item.order.status] ?? 'secondary'}>
                    {item.order.status.toLowerCase()}
                  </Badge>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(item.total, product.currency)}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(item.order.placedAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
