'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ConversationList, DEFAULT_FILTERS, type InboxFilters } from '@/features/inbox/conversation-list';

/**
 * Three-pane inbox (spec section 16).
 *
 * On desktop the list is always visible beside the thread. On mobile the list
 * is the index page and opening a conversation replaces it.
 */
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ conversationId?: string }>();
  const hasConversation = Boolean(params?.conversationId);

  const [filters, setFilters] = React.useState<InboxFilters>(DEFAULT_FILTERS);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <div
        className={cn(
          'w-full shrink-0 md:w-80 lg:w-[22rem]',
          hasConversation ? 'hidden md:block' : 'block',
        )}
      >
        <ConversationList filters={filters} onFiltersChange={setFilters} />
      </div>

      <div className={cn('min-w-0 flex-1', hasConversation ? 'block' : 'hidden md:block')}>
        {children}
      </div>
    </div>
  );
}
