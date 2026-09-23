'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Filter, Search, X } from 'lucide-react';
import { get, getWithMeta } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { cn, formatListTime, truncate } from '@/lib/utils';
import { Badge, Input, Skeleton, UserAvatar } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/overlays';
import { PlatformDot } from '@/components/shared/platform';
import { EmptyState } from '@/components/shared/states';
import type { Conversation, ConversationCounts, ConversationStatus, MessagingPlatform, Tag } from '@/types';

export interface InboxFilters {
  status: ConversationStatus | 'all';
  platform: MessagingPlatform | 'all';
  assignment: 'all' | 'me' | 'unassigned';
  tagId?: string;
  search: string;
}

export const DEFAULT_FILTERS: InboxFilters = {
  status: 'OPEN',
  platform: 'all',
  assignment: 'all',
  search: '',
};

const STATUS_TABS: Array<{ value: ConversationStatus | 'all'; label: string; countKey?: keyof ConversationCounts }> = [
  { value: 'OPEN', label: 'Open', countKey: 'OPEN' },
  { value: 'PENDING', label: 'Pending', countKey: 'PENDING' },
  { value: 'RESOLVED', label: 'Resolved', countKey: 'RESOLVED' },
  { value: 'all', label: 'All', countKey: 'total' },
];

export function ConversationList({
  filters,
  onFiltersChange,
}: {
  filters: InboxFilters;
  onFiltersChange: (filters: InboxFilters) => void;
}) {
  const params = useParams<{ conversationId?: string }>();
  const activeId = params?.conversationId;

  const [searchInput, setSearchInput] = React.useState(filters.search);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) onFiltersChange({ ...filters, search: searchInput });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters, onFiltersChange]);

  const queryParams = {
    status: filters.status === 'all' ? undefined : filters.status,
    platform: filters.platform === 'all' ? undefined : filters.platform,
    assignment: filters.assignment === 'all' ? undefined : filters.assignment,
    tagId: filters.tagId,
    search: filters.search || undefined,
    page: 1,
    pageSize: 40,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.conversations(queryParams),
    queryFn: () => getWithMeta<Conversation[]>('/conversations', queryParams),
    refetchInterval: 45_000,
  });

  const { data: counts } = useQuery({
    queryKey: queryKeys.conversationCounts,
    queryFn: () => get<ConversationCounts>('/conversations/counts'),
  });

  const { data: tags } = useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => get<Tag[]>('/tags'),
  });

  const conversations = data?.data ?? [];
  const activeTag = tags?.find((t) => t.id === filters.tagId);
  const hasExtraFilters = filters.platform !== 'all' || filters.assignment !== 'all' || Boolean(filters.tagId);

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border bg-card">
      <div className="shrink-0 space-y-2.5 border-b border-border p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search conversations"
              className="h-8 pl-8 text-sm"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={hasExtraFilters ? 'default' : 'outline'}
                size="icon-sm"
                aria-label="Filter conversations"
              >
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Channel</DropdownMenuLabel>
              {(['all', 'FACEBOOK', 'INSTAGRAM', 'WHATSAPP'] as const).map((platform) => (
                <DropdownMenuItem
                  key={platform}
                  onSelect={() => onFiltersChange({ ...filters, platform })}
                  className={cn(filters.platform === platform && 'bg-secondary')}
                >
                  {platform === 'all' ? 'All channels' : platform.charAt(0) + platform.slice(1).toLowerCase()}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Assignment</DropdownMenuLabel>
              {(
                [
                  { value: 'all', label: 'Everyone' },
                  { value: 'me', label: 'Assigned to me' },
                  { value: 'unassigned', label: 'Unassigned' },
                ] as const
              ).map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => onFiltersChange({ ...filters, assignment: option.value })}
                  className={cn(filters.assignment === option.value && 'bg-secondary')}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}

              {tags?.length ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Tag</DropdownMenuLabel>
                  <DropdownMenuItem onSelect={() => onFiltersChange({ ...filters, tagId: undefined })}>
                    Any tag
                  </DropdownMenuItem>
                  {tags.slice(0, 8).map((tag) => (
                    <DropdownMenuItem
                      key={tag.id}
                      onSelect={() => onFiltersChange({ ...filters, tagId: tag.id })}
                      className={cn(filters.tagId === tag.id && 'bg-secondary')}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </DropdownMenuItem>
                  ))}
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count = tab.countKey && counts ? counts[tab.countKey] : undefined;
            const active = filters.status === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onFiltersChange({ ...filters, status: tab.value })}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary',
                )}
              >
                {tab.label}
                {typeof count === 'number' ? (
                  <span className="tabular-nums opacity-70">{count}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {hasExtraFilters ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.platform !== 'all' ? (
              <FilterChip
                label={filters.platform.charAt(0) + filters.platform.slice(1).toLowerCase()}
                onClear={() => onFiltersChange({ ...filters, platform: 'all' })}
              />
            ) : null}
            {filters.assignment !== 'all' ? (
              <FilterChip
                label={filters.assignment === 'me' ? 'Mine' : 'Unassigned'}
                onClear={() => onFiltersChange({ ...filters, assignment: 'all' })}
              />
            ) : null}
            {activeTag ? (
              <FilterChip
                label={activeTag.name}
                onClear={() => onFiltersChange({ ...filters, tagId: undefined })}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex gap-3 p-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-2/5" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            title="No conversations here"
            description={
              filters.search
                ? `Nothing matched “${filters.search}”.`
                : 'When a customer messages a connected channel, the conversation lands here.'
            }
          />
        ) : (
          <ul>
            {conversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeId}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-2xs font-medium">
      {label}
      <button type="button" onClick={onClear} className="text-muted-foreground hover:text-foreground">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function ConversationRow({ conversation, active }: { conversation: Conversation; active: boolean }) {
  const assignee = conversation.assignments[0]?.assignee;
  const unread = conversation.unreadCount > 0;

  return (
    <li>
      <Link
        href={`/inbox/${conversation.id}`}
        className={cn(
          'flex gap-3 border-b border-border px-3 py-2.5 transition-colors',
          active ? 'bg-accent' : 'hover:bg-secondary/60',
        )}
      >
        <div className="relative shrink-0">
          <UserAvatar name={conversation.contact.displayName} src={conversation.contact.avatarUrl} />
          <span className="absolute -bottom-0.5 -right-0.5">
            <PlatformDot platform={conversation.platform} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className={cn('truncate text-sm', unread ? 'font-semibold' : 'font-medium')}>
              {conversation.contact.displayName}
            </p>
            <span className="ml-auto shrink-0 text-2xs text-muted-foreground">
              {formatListTime(conversation.lastMessageAt)}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-2">
            <p
              className={cn(
                'min-w-0 flex-1 truncate text-xs',
                unread ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {truncate(conversation.lastMessagePreview, 60) || 'No messages yet'}
            </p>
            {unread ? (
              <Badge className="h-4 min-w-4 shrink-0 justify-center px-1 text-2xs tabular-nums">
                {conversation.unreadCount}
              </Badge>
            ) : null}
          </div>

          {(conversation.tags.length > 0 || assignee || conversation.status === 'RESOLVED') ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {conversation.status === 'RESOLVED' ? (
                <Badge variant="success" className="h-4 px-1.5 text-2xs">
                  Resolved
                </Badge>
              ) : null}
              {conversation.tags.slice(0, 2).map(({ tag }) => (
                <span
                  key={tag.id}
                  className="rounded-full px-1.5 py-0.5 text-2xs font-medium"
                  style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              {assignee ? (
                <span className="ml-auto flex items-center gap-1 text-2xs text-muted-foreground">
                  <UserAvatar
                    name={`${assignee.firstName} ${assignee.lastName}`}
                    src={assignee.avatarUrl}
                    className="h-4 w-4"
                  />
                  {assignee.firstName}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
