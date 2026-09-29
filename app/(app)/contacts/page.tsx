'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { get, getWithMeta, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, timeAgo } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge, FormField, Input, UserAvatar } from '@/components/ui/primitives';
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
import { DataTable, useDebounced, type Column } from '@/components/shared/data-table';
import { PlatformIcon } from '@/components/shared/platform';
import type { Contact, MessagingPlatform, Tag } from '@/types';

export default function ContactsPage() {
  const router = useRouter();
  const { can } = useSession();

  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [platform, setPlatform] = React.useState<MessagingPlatform | 'all'>('all');
  const [tagId, setTagId] = React.useState<string>('all');
  const [createOpen, setCreateOpen] = React.useState(false);

  const debouncedSearch = useDebounced(search);

  const params = {
    page,
    pageSize: 25,
    search: debouncedSearch || undefined,
    platform: platform === 'all' ? undefined : platform,
    tagId: tagId === 'all' ? undefined : tagId,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.contacts(params),
    queryFn: () => getWithMeta<Contact[]>('/contacts', params),
  });

  const { data: tags } = useQuery({ queryKey: queryKeys.tags, queryFn: () => get<Tag[]>('/tags') });

  // A filter change invalidates the current page number.
  React.useEffect(() => setPage(1), [debouncedSearch, platform, tagId]);

  const columns: Array<Column<Contact>> = [
    {
      key: 'name',
      header: 'Customer',
      cell: (contact) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={contact.displayName} src={contact.avatarUrl} className="h-8 w-8" />
          <div className="min-w-0">
            <p className="truncate font-medium">{contact.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {contact.email || contact.phone || 'No contact details'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'channels',
      header: 'Channels',
      cell: (contact) => (
        <div className="flex gap-1">
          {contact.identifiers.length ? (
            contact.identifiers.map((identifier) => (
              <PlatformIcon key={identifier.id} platform={identifier.platform} />
            ))
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      cell: (contact) =>
        contact.tags.length ? (
          <div className="flex flex-wrap gap-1">
            {contact.tags.slice(0, 3).map(({ tag }) => (
              <span
                key={tag.id}
                className="rounded-full px-2 py-0.5 text-2xs font-medium"
                style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: 'conversations',
      header: 'Chats',
      cell: (contact) => (
        <span className="tabular-nums text-muted-foreground">{contact._count?.conversations ?? 0}</span>
      ),
      className: 'w-20',
    },
    {
      key: 'location',
      header: 'Location',
      cell: (contact) => (
        <span className="text-muted-foreground">
          {[contact.city, contact.country].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'lastContacted',
      header: 'Last contact',
      cell: (contact) => (
        <span className="text-xs text-muted-foreground">
          {contact.lastContactedAt ? timeAgo(contact.lastContactedAt) : formatDate(contact.createdAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: '',
      cell: (contact) =>
        contact.isBlocked ? (
          <Badge variant="destructive" className="text-2xs">
            Blocked
          </Badge>
        ) : null,
      className: 'w-24',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Contacts"
        description="Every customer who has messaged your business, across all connected channels."
        actions={
          can('contacts.update') ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Add contact
            </Button>
          ) : null
        }
      />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(contact) => contact.id}
        isLoading={isLoading}
        onRowClick={(contact) => router.push(`/contacts/${contact.id}`)}
        pagination={data?.meta?.pagination}
        onPageChange={setPage}
        search={{ value: search, onChange: setSearch, placeholder: 'Search by name, email or phone' }}
        emptyTitle="No contacts yet"
        emptyDescription="Contacts are created automatically the first time someone messages one of your channels."
        toolbar={
          <>
            <Select value={platform} onValueChange={(value) => setPlatform(value as typeof platform)}>
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="All channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                <SelectItem value="FACEBOOK">Messenger</SelectItem>
                <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                <SelectItem value="WEBCHAT">Website</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tagId} onValueChange={setTagId}>
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="All tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {tags?.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <CreateContactDialog open={createOpen} onOpenChange={setCreateOpen} />
    </PageContainer>
  );
}

function CreateContactDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({ firstName: '', lastName: '', email: '', phone: '' });

  const mutation = useMutation({
    mutationFn: () =>
      post<Contact>('/contacts', {
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        displayName: `${form.firstName} ${form.lastName}`.trim() || form.email || form.phone,
        email: form.email || null,
        phone: form.phone || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setForm({ firstName: '', lastName: '', email: '', phone: '' });
      onOpenChange(false);
      toast.success('Contact created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const valid = Boolean(form.firstName.trim() || form.email.trim() || form.phone.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a contact</DialogTitle>
          <DialogDescription>
            Useful for customers you met elsewhere. Contacts from your channels are created for you.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="First name">
            <Input
              value={form.firstName}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
              autoFocus
            />
          </FormField>
          <FormField label="Last name">
            <Input
              value={form.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            />
          </FormField>
          <FormField label="Email" className="sm:col-span-2">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </FormField>
          <FormField label="Phone" className="sm:col-span-2">
            <Input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+1 555 0100"
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!valid}>
            <Users className="h-4 w-4" />
            Create contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
