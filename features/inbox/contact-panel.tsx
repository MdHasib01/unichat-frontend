'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Check,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  ShoppingBag,
  Tag as TagIcon,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { get, patch, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { cn, formatCurrency, formatDate, timeAgo } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Badge, Separator, Textarea, UserAvatar } from '@/components/ui/primitives';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/overlays';
import { PlatformBadge } from '@/components/shared/platform';
import type { AiMode, ContactDetail, ConversationDetail, MiniUser, Tag } from '@/types';

export function ContactPanel({ conversation }: { conversation: ConversationDetail }) {
  const queryClient = useQueryClient();
  const { can } = useSession();
  const contact = conversation.contact;

  const { data: fullContact } = useQuery({
    queryKey: queryKeys.contact(contact.id),
    queryFn: () => get<ContactDetail>(`/contacts/${contact.id}`),
  });

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents,
    queryFn: () => get<Array<MiniUser & { role: string }>>('/team/agents'),
    enabled: can('conversations.assign'),
  });

  const { data: tags } = useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => get<Tag[]>('/tags'),
  });

  const assignee = conversation.assignments[0]?.assignee ?? null;

  const assign = useMutation({
    mutationFn: (assigneeId: string | null) =>
      post(`/conversations/${conversation.id}/assign`, { assigneeId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversation.id) });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Assignment updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setTags = useMutation({
    mutationFn: (tagIds: string[]) => post(`/conversations/${conversation.id}/tags`, { tagIds }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversation.id) });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setAiMode = useMutation({
    mutationFn: (aiMode: AiMode) => patch(`/conversations/${conversation.id}`, { aiMode }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversation.id) });
      toast.success('AI mode updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const currentTagIds = conversation.tags.map((t) => t.tag.id);

  const toggleTag = (tagId: string) => {
    const next = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];
    setTags.mutate(next);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto border-l border-border bg-card">
      <div className="flex flex-col items-center gap-2 border-b border-border px-4 py-5 text-center">
        <UserAvatar
          name={contact.displayName}
          src={contact.avatarUrl}
          className="h-16 w-16 text-base"
        />
        <div>
          <p className="font-semibold">{contact.displayName}</p>
          <div className="mt-1.5 flex justify-center">
            <PlatformBadge platform={conversation.platform} />
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-1">
          <Link href={`/contacts/${contact.id}`}>
            Full profile
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <Section title="Details">
        <DetailRow icon={Mail} label="Email" value={contact.email} />
        <DetailRow icon={Phone} label="Phone" value={contact.phone} />
        <DetailRow
          icon={MapPin}
          label="Location"
          value={[contact.city, contact.country].filter(Boolean).join(', ') || null}
        />
        <DetailRow
          icon={MessageSquare}
          label="First seen"
          value={formatDate(contact.createdAt)}
        />
      </Section>

      <Separator />

      <Section title="Assigned to">
        {can('conversations.assign') ? (
          <Select
            value={assignee?.id ?? 'unassigned'}
            onValueChange={(value) => assign.mutate(value === 'unassigned' ? null : value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {agents?.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.firstName} {agent.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : assignee ? (
          <div className="flex items-center gap-2">
            <UserAvatar
              name={`${assignee.firstName} ${assignee.lastName}`}
              src={assignee.avatarUrl}
              className="h-7 w-7"
            />
            <span className="text-sm">
              {assignee.firstName} {assignee.lastName}
            </span>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <UserPlus className="h-3.5 w-3.5" />
            Nobody yet
          </p>
        )}
      </Section>

      <Separator />

      <Section
        title="Tags"
        action={
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Edit tags">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1">
              <p className="px-2 py-1.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                Apply tags
              </p>
              <div className="max-h-56 space-y-0.5 overflow-y-auto">
                {tags?.map((tag) => {
                  const applied = currentTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary"
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="flex-1 truncate">{tag.name}</span>
                      {applied ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        }
      >
        {conversation.tags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {conversation.tags.map(({ tag }) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
                title="Remove tag"
              >
                {tag.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <TagIcon className="h-3.5 w-3.5" />
            No tags yet
          </p>
        )}
      </Section>

      <Separator />

      <Section title="AI assistant">
        <div className="space-y-2">
          <Select
            value={conversation.aiMode}
            onValueChange={(value) => setAiMode.mutate(value as AiMode)}
            disabled={!can('ai.manage') && !can('conversations.reply')}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ENABLED">Enabled — may answer automatically</SelectItem>
              <SelectItem value="PAUSED">Paused — a person is handling this</SelectItem>
              <SelectItem value="DISABLED">Off for this conversation</SelectItem>
            </SelectContent>
          </Select>

          {conversation.aiSessions[0] ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Bot className="h-3.5 w-3.5" />
              {conversation.aiSessions[0].replyCount} AI repl
              {conversation.aiSessions[0].replyCount === 1 ? 'y' : 'ies'}
              {conversation.aiSessions[0].handedOff ? ' · handed to the team' : ''}
            </p>
          ) : null}
        </div>
      </Section>

      <Separator />

      <NotesSection contactId={contact.id} notes={fullContact?.contactNotes ?? []} />

      {fullContact?.orders.length ? (
        <>
          <Separator />
          <Section title="Recent orders">
            <div className="space-y-2">
              {fullContact.orders.slice(0, 4).map((order) => (
                <Link
                  key={order.id}
                  href={`/sales/orders/${order.id}`}
                  className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 transition-colors hover:bg-secondary"
                >
                  <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{order.orderNumber}</span>
                    <span className="block text-2xs text-muted-foreground">
                      {formatDate(order.placedAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums">
                    {formatCurrency(order.total, order.currency)}
                  </span>
                </Link>
              ))}
            </div>
          </Section>
        </>
      ) : null}

      {fullContact && fullContact.conversations.length > 1 ? (
        <>
          <Separator />
          <Section title="Conversation history">
            <div className="space-y-1.5">
              {fullContact.conversations
                .filter((c) => c.id !== conversation.id)
                .slice(0, 5)
                .map((item) => (
                  <Link
                    key={item.id}
                    href={`/inbox/${item.id}`}
                    className="block rounded-lg border border-border px-2.5 py-2 transition-colors hover:bg-secondary"
                  >
                    <div className="flex items-center gap-2">
                      <PlatformBadge platform={item.platform} className="text-2xs" />
                      <span className="ml-auto text-2xs text-muted-foreground">
                        {timeAgo(item.lastMessageAt)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.lastMessagePreview ?? 'No messages'}
                    </p>
                  </Link>
                ))}
            </div>
          </Section>
        </>
      ) : null}
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-2 py-1">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-2xs text-muted-foreground">{label}</p>
        <p className={cn('truncate text-sm', !value && 'text-muted-foreground')}>{value || '—'}</p>
      </div>
    </div>
  );
}

function NotesSection({
  contactId,
  notes,
}: {
  contactId: string;
  notes: ContactDetail['contactNotes'];
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = React.useState('');

  const addNote = useMutation({
    mutationFn: () => post(`/contacts/${contactId}/notes`, { body: body.trim() }),
    onSuccess: () => {
      setBody('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.contact(contactId) });
      toast.success('Note saved');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Section title="Customer notes">
      <div className="space-y-2">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add a note about this customer…"
          rows={2}
          className="min-h-[52px] text-sm"
        />
        {body.trim() ? (
          <Button size="sm" onClick={() => addNote.mutate()} loading={addNote.isPending}>
            Save note
          </Button>
        ) : null}

        {notes.slice(0, 5).map((note) => (
          <div key={note.id} className="rounded-lg bg-secondary/60 px-2.5 py-2">
            <p className="text-xs leading-relaxed">{note.body}</p>
            <p className="mt-1 text-2xs text-muted-foreground">
              {note.author ? `${note.author.firstName} ${note.author.lastName} · ` : ''}
              {timeAgo(note.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
