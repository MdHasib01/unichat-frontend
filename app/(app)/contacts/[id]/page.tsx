'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Mail, MapPin, MessageSquare, Phone, Save, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, patch, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils';
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
  Skeleton,
  Textarea,
  UserAvatar,
} from '@/components/ui/primitives';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/overlays';
import { PlatformBadge } from '@/components/shared/platform';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { STATUS_VARIANTS } from '@/components/shared/data-table';
import type { ContactDetail, Tag } from '@/types';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = useSession();

  const [note, setNote] = React.useState('');
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [form, setForm] = React.useState<Record<string, string>>({});

  const { data: contact, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.contact(id),
    queryFn: () => get<ContactDetail>(`/contacts/${id}`),
  });

  const { data: tags } = useQuery({ queryKey: queryKeys.tags, queryFn: () => get<Tag[]>('/tags') });

  React.useEffect(() => {
    if (!contact) return;
    setForm({
      firstName: contact.firstName ?? '',
      lastName: contact.lastName ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      city: contact.city ?? '',
      country: contact.country ?? '',
    });
  }, [contact]);

  const save = useMutation({
    mutationFn: () =>
      patch(`/contacts/${id}`, {
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        displayName: `${form.firstName} ${form.lastName}`.trim() || contact?.displayName,
        email: form.email || null,
        phone: form.phone || null,
        city: form.city || null,
        country: form.country || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.contact(id) });
      toast.success('Contact updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addNote = useMutation({
    mutationFn: () => post(`/contacts/${id}/notes`, { body: note.trim() }),
    onSuccess: () => {
      setNote('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.contact(id) });
      toast.success('Note saved');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setTags = useMutation({
    mutationFn: (tagIds: string[]) => post(`/contacts/${id}/tags`, { tagIds }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.contact(id) }),
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: () => del(`/contacts/${id}`),
    onSuccess: () => {
      toast.success('Contact deleted');
      router.push('/contacts');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isError) {
    return (
      <PageContainer>
        <ErrorState title="Contact not found" onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  if (isLoading || !contact) {
    return (
      <PageContainer>
        <Skeleton className="h-32 w-full" />
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </PageContainer>
    );
  }

  const currentTagIds = contact.tags.map((t) => t.tag.id);
  const readOnly = !can('contacts.update');

  return (
    <PageContainer>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/contacts">
          <ArrowLeft className="h-4 w-4" />
          All contacts
        </Link>
      </Button>

      <Card className="mb-4">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <UserAvatar
            name={contact.displayName}
            src={contact.avatarUrl}
            className="h-16 w-16 text-lg"
          />

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">{contact.displayName}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {contact.email ? (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {contact.email}
                </span>
              ) : null}
              {contact.phone ? (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {contact.phone}
                </span>
              ) : null}
              {contact.city || contact.country ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {[contact.city, contact.country].filter(Boolean).join(', ')}
                </span>
              ) : null}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {contact.identifiers.map((identifier) => (
                <PlatformBadge key={identifier.id} platform={identifier.platform} />
              ))}
              {contact.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}

              {!readOnly ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 px-2 text-2xs">
                      Edit tags
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-56 p-1">
                    <div className="max-h-60 space-y-0.5 overflow-y-auto">
                      {tags?.map((tag) => {
                        const applied = currentTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() =>
                              setTags.mutate(
                                applied
                                  ? currentTagIds.filter((tid) => tid !== tag.id)
                                  : [...currentTagIds, tag.id],
                              )
                            }
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary"
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="flex-1 truncate">{tag.name}</span>
                            {applied ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {contact.conversations[0] ? (
              <Button asChild variant="outline">
                <Link href={`/inbox/${contact.conversations[0].id}`}>
                  <MessageSquare className="h-4 w-4" />
                  Open conversation
                </Link>
              </Button>
            ) : null}
            {!readOnly ? (
              <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} aria-label="Delete contact">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {contact.conversations.length === 0 ? (
                <EmptyState title="No conversations" description="This contact has not messaged you yet." />
              ) : (
                <div className="divide-y divide-border">
                  {contact.conversations.map((conversation) => (
                    <Link
                      key={conversation.id}
                      href={`/inbox/${conversation.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/50"
                    >
                      <PlatformBadge platform={conversation.platform} />
                      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                        {conversation.lastMessagePreview ?? 'No messages'}
                      </span>
                      <Badge variant={STATUS_VARIANTS[conversation.status] ?? 'secondary'} className="shrink-0">
                        {conversation.status.toLowerCase()}
                      </Badge>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(conversation.lastMessageAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {contact.orders.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {contact.orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/sales/orders/${order.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/50"
                    >
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm font-medium">{order.orderNumber}</span>
                      <Badge variant={STATUS_VARIANTS[order.status] ?? 'secondary'}>
                        {order.status.toLowerCase()}
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(order.total, order.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(order.placedAt)}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!readOnly ? (
                <div className="space-y-2">
                  <Textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add a note for your team…"
                    rows={2}
                  />
                  {note.trim() ? (
                    <Button size="sm" onClick={() => addNote.mutate()} loading={addNote.isPending}>
                      Save note
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {contact.contactNotes.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                contact.contactNotes.map((item) => (
                  <div key={item.id} className="rounded-lg bg-secondary/60 p-3">
                    <p className="text-sm leading-relaxed">{item.body}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {item.author ? `${item.author.firstName} ${item.author.lastName} · ` : ''}
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="First name">
                <Input
                  value={form.firstName ?? ''}
                  onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                  disabled={readOnly}
                />
              </FormField>
              <FormField label="Last name">
                <Input
                  value={form.lastName ?? ''}
                  onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                  disabled={readOnly}
                />
              </FormField>
            </div>

            <FormField label="Email">
              <Input
                type="email"
                value={form.email ?? ''}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Phone">
              <Input
                value={form.phone ?? ''}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                disabled={readOnly}
              />
            </FormField>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="City">
                <Input
                  value={form.city ?? ''}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                  disabled={readOnly}
                />
              </FormField>
              <FormField label="Country">
                <Input
                  value={form.country ?? ''}
                  onChange={(event) => setForm({ ...form, country: event.target.value })}
                  disabled={readOnly}
                />
              </FormField>
            </div>

            {!readOnly ? (
              <Button onClick={() => save.mutate()} loading={save.isPending} className="w-full">
                <Save className="h-4 w-4" />
                Save changes
              </Button>
            ) : null}

            <p className="pt-1 text-xs text-muted-foreground">
              First seen {formatDate(contact.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {contact.displayName}?</DialogTitle>
            <DialogDescription>
              This permanently removes the contact along with their conversations, messages and
              notes. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => remove.mutate()} loading={remove.isPending}>
              Delete contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
