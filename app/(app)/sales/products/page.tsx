'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { del, getWithMeta, patch, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatCurrency } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge, FormField, Input, Switch, Textarea } from '@/components/ui/primitives';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlays';
import { DataTable, useDebounced, type Column } from '@/components/shared/data-table';
import type { Product } from '@/types';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { can, session } = useSession();
  const manage = can('sales.manage');

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Product | null>(null);

  const debouncedSearch = useDebounced(search);
  const params = { page, pageSize: 25, search: debouncedSearch || undefined };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => getWithMeta<Product[]>('/sales/products', params),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del(`/sales/products/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleting(null);
      toast.success('Product deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  React.useEffect(() => setPage(1), [debouncedSearch]);

  const columns: Array<Column<Product>> = [
    {
      key: 'name',
      header: 'Product',
      cell: (product) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{product.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {product.sku ? `SKU ${product.sku}` : 'No SKU'}
              {product.category ? ` · ${product.category}` : ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      cell: (product) => (
        <span className="font-semibold tabular-nums">
          {formatCurrency(product.price, product.currency)}
        </span>
      ),
      className: 'w-32',
    },
    {
      key: 'stock',
      header: 'Stock',
      cell: (product) =>
        product.trackInventory ? (
          <Badge variant={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'destructive'}>
            {product.stock} in stock
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Not tracked</span>
        ),
      className: 'w-36',
    },
    {
      key: 'active',
      header: 'Status',
      cell: (product) => (
        <Badge variant={product.isActive ? 'success' : 'muted'}>
          {product.isActive ? 'Active' : 'Hidden'}
        </Badge>
      ),
      className: 'w-28',
    },
    {
      key: 'actions',
      header: '',
      cell: (product) =>
        manage ? (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(product)} aria-label="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(product)} aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ) : null,
      className: 'w-24 text-right',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Products"
        description="What you sell. Products feed your orders and can be imported into the AI assistant's knowledge."
        actions={
          manage ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              New product
            </Button>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(product) => product.id}
        isLoading={isLoading}
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        search={{ value: search, onChange: setSearch, placeholder: 'Search products' }}
        emptyTitle="No products yet"
        emptyDescription="Add what you sell so you can attach it to orders and teach it to the AI assistant."
        emptyAction={
          manage ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Add your first product
            </Button>
          ) : null
        }
      />

      <ProductDialog
        product={editing}
        open={creating || Boolean(editing)}
        currency={session?.organization?.currency ?? 'USD'}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.name}”?</DialogTitle>
            <DialogDescription>
              Existing order lines keep their details, but the product is removed from your catalogue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleting && remove.mutate(deleting.id)}
              loading={remove.isPending}
            >
              Delete product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function ProductDialog({
  product,
  open,
  currency,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  currency: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({
    name: '',
    sku: '',
    description: '',
    price: '0',
    category: '',
    stock: '0',
    trackInventory: true,
    isActive: true,
    imageUrl: '',
  });

  React.useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku ?? '',
        description: product.description ?? '',
        price: String(product.price),
        category: product.category ?? '',
        stock: String(product.stock),
        trackInventory: product.trackInventory,
        isActive: product.isActive,
        imageUrl: product.imageUrl ?? '',
      });
    } else if (open) {
      setForm({
        name: '',
        sku: '',
        description: '',
        price: '0',
        category: '',
        stock: '0',
        trackInventory: true,
        isActive: true,
        imageUrl: '',
      });
    }
  }, [product, open]);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        description: form.description.trim() || null,
        price: Number(form.price) || 0,
        category: form.category.trim() || null,
        stock: Number(form.stock) || 0,
        trackInventory: form.trackInventory,
        isActive: form.isActive,
        imageUrl: form.imageUrl.trim() || null,
        currency,
      };
      return product
        ? patch(`/sales/products/${product.id}`, payload)
        : post('/sales/products', payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
      toast.success(product ? 'Product updated' : 'Product created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit product' : 'New product'}</DialogTitle>
          <DialogDescription>
            Prices are in your workspace currency ({currency}).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Name" required className="sm:col-span-2">
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              autoFocus
            />
          </FormField>

          <FormField label="SKU">
            <Input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
          </FormField>

          <FormField label="Category">
            <Input
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            />
          </FormField>

          <FormField label={`Price (${currency})`} required>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
            />
          </FormField>

          <FormField label="Stock">
            <Input
              type="number"
              min={0}
              value={form.stock}
              onChange={(event) => setForm({ ...form, stock: event.target.value })}
              disabled={!form.trackInventory}
            />
          </FormField>

          <FormField label="Image URL" className="sm:col-span-2">
            <Input
              type="url"
              value={form.imageUrl}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              placeholder="https://cdn.example.com/product.jpg"
            />
          </FormField>

          <FormField label="Description" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </FormField>

          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm">Track inventory</span>
            <Switch
              checked={form.trackInventory}
              onCheckedChange={(trackInventory) => setForm({ ...form, trackInventory })}
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm">Active</span>
            <Switch
              checked={form.isActive}
              onCheckedChange={(isActive) => setForm({ ...form, isActive })}
            />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!form.name.trim()}>
            {product ? 'Save changes' : 'Create product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
