'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Bot,
  Check,
  CheckCheck,
  Clock,
  Download,
  FileText,
  MapPin,
  StickyNote,
  Zap,
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { get } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { cn, formatDateTime } from '@/lib/utils';
import { Badge, Skeleton, Tooltip, UserAvatar } from '@/components/ui/primitives';
import { EmptyState } from '@/components/shared/states';
import type { Attachment, Message } from '@/types';

export function MessageThread({ conversationId }: { conversationId: string }) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: () => get<Message[]>(`/conversations/${conversationId}/messages`, { limit: 60 }),
  });

  const messages = React.useMemo(() => data ?? [], [data]);

  // Stick to the newest message as the thread grows (including live arrivals).
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length > 30 ? 'auto' : 'smooth' });
  }, [messages.length, conversationId]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className={cn('flex', index % 2 ? 'justify-end' : 'justify-start')}>
            <Skeleton className={cn('h-14 rounded-2xl', index % 2 ? 'w-52' : 'w-64')} />
          </div>
        ))}
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex-1">
        <EmptyState
          title="No messages yet"
          description="Send the first message to start this conversation."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4 sm:px-6">
      {messages.map((message, index) => {
        const previous = messages[index - 1];
        const showDate =
          !previous || !isSameDay(new Date(previous.createdAt), new Date(message.createdAt));

        return (
          <React.Fragment key={message.id}>
            {showDate ? <DateDivider date={message.createdAt} /> : null}
            <MessageBubble message={message} previous={previous} />
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

function DateDivider({ date }: { date: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
        {format(new Date(date), 'EEEE, d MMMM')}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function MessageBubble({ message, previous }: { message: Message; previous?: Message }) {
  const outbound = message.direction === 'OUTBOUND';
  const isNote = message.isInternal || message.type === 'NOTE';
  const isAI = message.senderType === 'AI';
  const isAutomation = message.senderType === 'AUTOMATION';

  // Group consecutive messages from the same sender.
  const grouped =
    previous &&
    previous.senderType === message.senderType &&
    previous.isInternal === message.isInternal &&
    new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() < 3 * 60 * 1000;

  if (isNote) {
    return (
      <div className="flex justify-center py-1">
        <div className="bubble bubble-note max-w-xl">
          <div className="mb-1 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-warning">
            <StickyNote className="h-3 w-3" />
            Internal note
            {message.user ? (
              <span className="font-normal normal-case tracking-normal text-muted-foreground">
                · {message.user.firstName} {message.user.lastName}
              </span>
            ) : null}
          </div>
          <p>{message.body}</p>
          <p className="mt-1 text-2xs text-muted-foreground">
            {format(new Date(message.createdAt), 'HH:mm')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2', outbound ? 'justify-end' : 'justify-start', grouped ? 'mt-0.5' : 'mt-3')}>
      {!outbound && !grouped ? (
        <UserAvatar
          name={message.contact?.displayName}
          src={message.contact?.avatarUrl}
          className="mt-auto h-7 w-7"
        />
      ) : !outbound ? (
        <span className="w-7 shrink-0" />
      ) : null}

      <div className={cn('flex flex-col gap-1', outbound ? 'items-end' : 'items-start')}>
        {!grouped && outbound && (isAI || isAutomation) ? (
          <Badge variant={isAI ? 'default' : 'secondary'} className="h-4 px-1.5 text-2xs">
            {isAI ? <Bot className="h-2.5 w-2.5" /> : <Zap className="h-2.5 w-2.5" />}
            {isAI ? 'AI assistant' : 'Automation'}
            {message.aiConfidence != null ? (
              <span className="opacity-70">· {Math.round(message.aiConfidence * 100)}%</span>
            ) : null}
          </Badge>
        ) : null}

        {message.body ? (
          <div className={cn('bubble', outbound ? (isAI ? 'bubble-ai' : 'bubble-out') : 'bubble-in')}>
            {message.body}
          </div>
        ) : null}

        {message.attachments?.length ? (
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((attachment, index) => (
              <AttachmentPreview key={index} attachment={attachment} />
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-1.5 px-1 text-2xs text-muted-foreground">
          <Tooltip content={formatDateTime(message.createdAt)}>
            <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
          </Tooltip>

          {outbound ? <DeliveryStatus message={message} /> : null}

          {message.user && !isAI && !isAutomation ? (
            <span className="truncate">· {message.user.firstName}</span>
          ) : null}
        </div>

        {message.status === 'FAILED' && message.errorMessage ? (
          <p className="flex max-w-sm items-start gap-1 px-1 text-2xs text-destructive">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            {message.errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DeliveryStatus({ message }: { message: Message }) {
  switch (message.status) {
    case 'QUEUED':
      return (
        <Tooltip content="Queued for delivery">
          <Clock className="h-3 w-3" />
        </Tooltip>
      );
    case 'SENT':
      return (
        <Tooltip content="Sent">
          <Check className="h-3 w-3" />
        </Tooltip>
      );
    case 'DELIVERED':
      return (
        <Tooltip content="Delivered">
          <CheckCheck className="h-3 w-3" />
        </Tooltip>
      );
    case 'READ':
      return (
        <Tooltip content="Read">
          <CheckCheck className="h-3 w-3 text-primary" />
        </Tooltip>
      );
    case 'FAILED':
      return (
        <Tooltip content="Failed to send">
          <AlertCircle className="h-3 w-3 text-destructive" />
        </Tooltip>
      );
    default:
      return null;
  }
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (attachment.type === 'image') {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="block">
        {/* Remote media comes from provider CDNs, so a plain img avoids
            brittle remote-pattern configuration. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.name ?? 'Attachment'}
          className="max-h-60 max-w-xs rounded-xl border border-border object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  if (attachment.type === 'video') {
    return (
      <video controls className="max-h-60 max-w-xs rounded-xl border border-border" preload="metadata">
        <source src={attachment.url} type={attachment.mimeType} />
      </video>
    );
  }

  if (attachment.type === 'audio') {
    return <audio controls src={attachment.url} className="h-9 max-w-xs" preload="metadata" />;
  }

  if (attachment.type === 'location') {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-secondary"
      >
        <MapPin className="h-4 w-4 text-primary" />
        {attachment.name ?? 'Shared location'}
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="flex max-w-xs items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-secondary"
    >
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{attachment.name ?? 'Attachment'}</span>
      <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </a>
  );
}
