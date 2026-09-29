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
  /** Conversations whose customer is typing right now. */
  typingContacts: ReadonlySet<string>;
}

const RealtimeContext = React.createContext<RealtimeContextValue>({
  socket: null,
  connected: false,
  subscribeToConversation: () => {},
  unsubscribeFromConversation: () => {},
  sendTyping: () => {},
  typingContacts: new Set(),
});

const TYPING_THROTTLE_MS = 3_000;
const TYPING_VISIBLE_MS = 6_000;

/**
 * Where the Socket.IO server lives.
 *
 * In production Nginx routes /socket.io to the backend on the same origin. The
 * Next dev server only proxies /api (it cannot forward WebSocket upgrades), so
 * in development the browser connects to the backend directly. Auth cookies
 * still go along: they are host-only, and ports don't separate cookies.
 */
function socketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const port = process.env.NEXT_PUBLIC_BACKEND_PORT || '4000';
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }
  return '/';
}

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
  const lastTypingSent = React.useRef(new Map<string, number>());
  const typingTimers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [typingContacts, setTypingContacts] = React.useState<ReadonlySet<string>>(new Set());

  React.useEffect(() => {
    if (!enabled) return undefined;

    const socket = io(socketUrl(), {
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

    // Website visitors (and other channels that report it) typing.
    socket.on(REALTIME_EVENTS.TYPING, (payload: { conversationId: string; contact?: boolean }) => {
      if (!payload?.contact) return;
      const id = payload.conversationId;
      setTypingContacts((current) => (current.has(id) ? current : new Set(current).add(id)));
      clearTimeout(typingTimers.current.get(id));
      typingTimers.current.set(
        id,
        setTimeout(() => {
          setTypingContacts((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
        }, TYPING_VISIBLE_MS),
      );
    });

    // A new customer message ends their typing.
    socket.on(REALTIME_EVENTS.MESSAGE_CREATED, (message: Message) => {
      if (message.direction !== 'INBOUND') return;
      setTypingContacts((current) => {
        if (!current.has(message.conversationId)) return current;
        const next = new Set(current);
        next.delete(message.conversationId);
        return next;
      });
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
      sendTyping: (id) => {
        const now = Date.now();
        if (now - (lastTypingSent.current.get(id) ?? 0) < TYPING_THROTTLE_MS) return;
        lastTypingSent.current.set(id, now);
        socketRef.current?.emit('conversation:typing', id);
      },
      typingContacts,
    }),
    [connected, typingContacts],
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
