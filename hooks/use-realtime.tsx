'use client';

import * as React from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import type { Conversation, Message, Notification } from '@/types';

const REALTIME_EVENTS = {
  MESSAGE_CREATED: 'message:created',
  MESSAGE_UPDATED: 'message:updated',
  CONVERSATION_CREATED: 'conversation:created',
  CONVERSATION_UPDATED: 'conversation:updated',
  CONVERSATION_ASSIGNED: 'conversation:assigned',
  NOTIFICATION_CREATED: 'notification:created',
  INTEGRATION_UPDATED: 'integration:updated',
  TYPING: 'conversation:typing',
} as const;

interface RealtimeContextValue {
  socket: Socket | null;
  connected: boolean;
  subscribeToConversation: (conversationId: string) => void;
  unsubscribeFromConversation: (conversationId: string) => void;
  sendTyping: (conversationId: string) => void;
}

const RealtimeContext = React.createContext<RealtimeContextValue>({
  socket: null,
  connected: false,
  subscribeToConversation: () => {},
  unsubscribeFromConversation: () => {},
  sendTyping: () => {},
});

/**
 * Keeps the inbox live (spec section 30). The socket authenticates with the
 * same cookies as the REST API and only receives events for the active
 * organization — rooms are joined server-side.
 */
export function RealtimeProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = React.useState(false);
  const socketRef = React.useRef<Socket | null>(null);

  React.useEffect(() => {
    if (!enabled) return undefined;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;
    const socket = io(url ?? '/', {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on(REALTIME_EVENTS.MESSAGE_CREATED, (message: Message) => {
      // Append to the open thread without a refetch so the message appears
      // the instant it lands.
      queryClient.setQueryData<Message[]>(queryKeys.messages(message.conversationId), (current) => {
        if (!current) return current;
        if (current.some((m) => m.id === message.id)) return current;
        return [...current, message];
      });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversationCounts });
    });

    socket.on(REALTIME_EVENTS.MESSAGE_UPDATED, (message: Message) => {
      queryClient.setQueryData<Message[]>(queryKeys.messages(message.conversationId), (current) =>
        current?.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
      );
    });

    socket.on(REALTIME_EVENTS.CONVERSATION_UPDATED, (conversation: Partial<Conversation> & { id: string }) => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversation.id) });
    });

    socket.on(REALTIME_EVENTS.CONVERSATION_CREATED, () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversationCounts });
    });

    socket.on(REALTIME_EVENTS.CONVERSATION_ASSIGNED, () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    socket.on(REALTIME_EVENTS.NOTIFICATION_CREATED, (notification: Notification) => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast(notification.title, { description: notification.body ?? undefined });
    });

    socket.on(REALTIME_EVENTS.INTEGRATION_UPDATED, () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, queryClient]);

  const value = React.useMemo<RealtimeContextValue>(
    () => ({
      socket: socketRef.current,
      connected,
      subscribeToConversation: (id) => socketRef.current?.emit('conversation:subscribe', id),
      unsubscribeFromConversation: (id) => socketRef.current?.emit('conversation:unsubscribe', id),
      sendTyping: (id) => socketRef.current?.emit('conversation:typing', id),
    }),
    [connected],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeContextValue {
  return React.useContext(RealtimeContext);
}

/** Joins/leaves the conversation room for the thread currently on screen. */
export function useConversationSubscription(conversationId?: string) {
  const { socket, subscribeToConversation, unsubscribeFromConversation } = useRealtime();

  React.useEffect(() => {
    if (!conversationId || !socket) return undefined;
    subscribeToConversation(conversationId);
    return () => unsubscribeFromConversation(conversationId);
  }, [conversationId, socket, subscribeToConversation, unsubscribeFromConversation]);
}
