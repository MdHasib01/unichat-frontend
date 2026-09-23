'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { get, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatCurrency } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { FormField, Input, Separator, Textarea } from '@/components/ui/primitives';
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
import type { Contact, Order, Product } from '@/types';

interface LineDraft {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export function OrderDialog({
  open,
  onOpenChange,
  contactId,
  conversationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId?: string;
  conversationId?: string;
}) {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const currency = session?.organization?.currency ?? 'USD';

  const [lines, setLines] = React.useState<LineDraft[]>([]);
  const [selectedContact, setSelectedContact] = React.useState(contactId ?? '');
  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [city, setCity] = React.useState('');
  const [note, setNote] = React.useState('');
  const [shippingFee, setShippingFee] = React.useState('0');
  const [discount, setDiscount] = React.useState('0');

  const { data: products } = useQuery({
    queryKey: queryKeys.products({ all: true }),
    queryFn: () => get<Product[]>('/sales/products', { pageSize: 100, isActive: true }),
    enabled: open,
  });

  const { data: contacts } = useQuery({
    queryKey: queryKeys.contacts({ picker: true }),
    queryFn: () => get<Contact[]>('/contacts', { pageSize: 50 }),
    enabled: open,
  });

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(shippingFee || 0));

  const create = useMutation({
    mutationFn: () =>
      post<Order>('/sales/orders', {
        contactId: selectedContact || null,
        conversationId: conversationId ?? null,
        currency,
        discount: Number(discount) || 0,
        shippingFee: Number(shippingFee) || 0,
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        shippingAddress: address.trim() || null,
        city: city.trim() || null,
        note: note.trim() || null,
        items: lines.map((line) => ({
          productId: line.productId || null,
          name: line.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      }),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.salesSummary });
      onOpenChange(false);
      reset();
      toast.success(`Order ${order.orderNumber} created`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reset = () => {
    setLines([]);
    setCustomerName('');
    setCustomerPhone('');
    setAddress('');
    setCity('');
    setNote('');
    setShippingFee('0');
    setDiscount('0');
  };

  const addProduct = (productId: string) => {
    const product = products?.find((p) => p.id === productId);
    if (!product) return;

    setLines((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (existing) {
        return current.map((line) =>
          line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...current,
        { productId, name: product.name, quantity: 1, unitPrice: Number(product.price) },
      ];
    });
  };

  // Picking a known contact pre-fills the delivery details.
  React.useEffect(() => {
    if (!selectedContact) return;
    const contact = contacts?.find((c) => c.id === selectedContact);
    if (contact) {
      setCustomerName(contact.displayName);
      setCustomerPhone(contact.phone ?? '');
      setCity(contact.city ?? '');
    }
  }, [selectedContact, contacts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New order</DialogTitle>
          <DialogDescription>
            Add the items, then the delivery details. Stock is reduced for tracked products.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Items
            </p>

            <Select value="" onValueChange={addProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Add a product…" />
              </SelectTrigger>
              <SelectContent>
                {products?.length ? (
                  products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} · {formatCurrency(product.price, product.currency)}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No active products
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {lines.length ? (
              <div className="mt-2 space-y-1.5">
                {lines.map((line) => (
                  <div
                    key={line.productId}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">{line.name}</span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          setLines((current) =>
                            current
                              .map((l) =>
                                l.productId === line.productId
                                  ? { ...l, quantity: Math.max(0, l.quantity - 1) }
                                  : l,
                              )
                              .filter((l) => l.quantity > 0),
                          )
                        }
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          setLines((current) =>
                            current.map((l) =>
                              l.productId === line.productId ? { ...l, quantity: l.quantity + 1 } : l,
                            ),
                          )
                        }
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <span className="w-24 text-right text-sm font-medium tabular-nums">
                      {formatCurrency(line.unitPrice * line.quantity, currency)}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setLines((current) => current.filter((l) => l.productId !== line.productId))
                      }
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No items yet — choose a product above.
              </p>
            )}
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Link to a contact" className="sm:col-span-2">
              <Select value={selectedContact} onValueChange={setSelectedContact}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional — pick an existing customer" />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Customer name">
              <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            </FormField>
            <FormField label="Phone">
              <Input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
            </FormField>

            <FormField label="Delivery address" className="sm:col-span-2">
              <Input value={address} onChange={(event) => setAddress(event.target.value)} />
            </FormField>

            <FormField label="City">
              <Input value={city} onChange={(event) => setCity(event.target.value)} />
            </FormField>

            <FormField label={`Shipping (${currency})`}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={shippingFee}
                onChange={(event) => setShippingFee(event.target.value)}
              />
            </FormField>

            <FormField label={`Discount (${currency})`}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
              />
            </FormField>

            <FormField label="Note" className="sm:col-span-2">
              <Textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
            </FormField>
          </div>

          <div className="rounded-lg bg-secondary/60 p-3 text-sm">
            <Row label="Subtotal" value={formatCurrency(subtotal, currency)} />
            <Row label="Shipping" value={formatCurrency(Number(shippingFee) || 0, currency)} />
            <Row label="Discount" value={`− ${formatCurrency(Number(discount) || 0, currency)}`} />
            <Separator className="my-2" />
            <Row label="Total" value={formatCurrency(total, currency)} bold />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!lines.length}>
            <ShoppingCart className="h-4 w-4" />
            Create order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={bold ? 'font-semibold' : 'text-muted-foreground'}>{label}</span>
      <span className={`tabular-nums ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}
