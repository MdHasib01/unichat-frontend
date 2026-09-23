'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  MoreVertical,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { get, patch, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { useConversationSubscription } from '@/hooks/use-realtime';
import { Button } from '@/components/ui/button';
import { Badge, Skeleton, UserAvatar } from '@/components/ui/primitives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/overlays';
import { PlatformBadge } from '@/components/shared/platform';
import { ErrorState } from '@/components/shared/states';
import { MessageThread } from '@/features/inbox/message-thread';
import { Composer } from '@/features/inbox/composer';
import { ContactPanel } from '@/features/inbox/contact-panel';
import type { ConversationDetail, ConversationStatus } from '@/types';

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const queryClient = useQueryClient();
  const { can } = useSession();
  const [profileOpen, setProfileOpen] = React.useState(true);

  // Join the conversation's realtime room while it is on screen.
  useConversationSubscription(conversationId);

  const { data: conversation, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: () => get<ConversationDetail>(`/conversations/${conversationId}`),
  });

  const markRead = useMutation({
    mutationFn: () => post(`/conversations/${conversationId}/read`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversationCounts });
    },
  });

  const updateStatus = useMutation({
    mutationFn: (status: ConversationStatus) => patch(`/conversations/${conversationId}`, { status }),
    onSuccess: (_data, status) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(status === 'RESOLVED' ? 'Conversation resolved' : 'Conversation reopened');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Opening a thread clears its unread badge.
  React.useEffect(() => {
    if (conversation && conversation.unreadCount > 0) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, conversation?.unreadCount]);

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <ErrorState
          title="We couldn't open this conversation"
          description="It may have been deleted, or it belongs to another workspace."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading || !conversation) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center gap-3 border-b border-border px-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex-1 space-y-4 p-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const resolved = conversation.status === 'RESOLVED';
  const channelInactive = conversation.socialAccount && !conversation.socialAccount.isActive;

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col bg-secondary/30">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3 sm:px-4">
          <Button asChild variant="ghost" size="icon-sm" className="md:hidden">
            <Link href="/inbox" aria-label="Back to conversations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <UserAvatar
            name={conversation.contact.displayName}
            src={conversation.contact.avatarUrl}
            className="h-8 w-8"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{conversation.contact.displayName}</p>
            <div className="flex items-center gap-2">
              <PlatformBadge platform={conversation.platform} className="text-2xs" />
              {resolved ? (
                <Badge variant="success" className="h-4 text-2xs">
                  Resolved
                </Badge>
              ) : null}
              {conversation.aiMode === 'PAUSED' ? (
                <Badge variant="warning" className="h-4 text-2xs">
                  AI paused
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {can('conversations.resolve') ? (
              <Button
                variant={resolved ? 'outline' : 'success'}
                size="sm"
                onClick={() => updateStatus.mutate(resolved ? 'OPEN' : 'RESOLVED')}
                loading={updateStatus.isPending}
              >
                {resolved ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Reopen</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Resolve</span>
                  </>
                )}
              </Button>
            ) : null}

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setProfileOpen((current) => !current)}
              className="hidden xl:inline-flex"
              aria-label={profileOpen ? 'Hide customer profile' : 'Show customer profile'}
            >
              {profileOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Conversation actions">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={() => updateStatus.mutate('PENDING')}>
                  Mark as pending
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => markRead.mutate()}>Mark as read</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/contacts/${conversation.contact.id}`}>Open customer profile</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {channelInactive ? (
          <div className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs">
            <Trash2 className="h-3.5 w-3.5 text-warning" />
            The channel this conversation arrived on is disconnected, so replies cannot be delivered.{' '}
            <Link href="/integrations" className="font-medium text-primary hover:underline">
              Reconnect it
            </Link>
          </div>
        ) : null}

        <MessageThread conversationId={conversationId} />

        <Composer
          conversationId={conversationId}
          aiEnabled={conversation.aiMode !== 'DISABLED'}
          disabled={!can('conversations.reply') || Boolean(channelInactive)}
          disabledReason={
            !can('conversations.reply')
              ? 'Your role cannot reply to conversations.'
              : 'Reconnect this channel before replying.'
          }
        />
      </div>

      <div className={cn('hidden w-80 shrink-0 xl:block', !profileOpen && 'xl:hidden')}>
        <ContactPanel conversation={conversation} />
      </div>
    </div>
  );
}
