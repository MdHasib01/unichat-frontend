'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { get, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import type { SessionPayload } from '@/types';

interface SessionContextValue {
  session: SessionPayload | null;
  isLoading: boolean;
  isError: boolean;
  /** Permission check backed by the server-resolved permission list. */
  can: (permission: string) => boolean;
  switchOrganization: (organizationId: string) => void;
  isSwitching: boolean;
  logout: () => void;
  refresh: () => void;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.session,
    queryFn: () => get<SessionPayload>('/me'),
    retry: false,
    staleTime: 60_000,
  });

  const switchMutation = useMutation({
    mutationFn: (organizationId: string) => post('/organizations/switch', { organizationId }),
    onSuccess: async () => {
      // The whole cache belongs to the previous tenant, so drop all of it.
      queryClient.clear();
      await refetch();
      router.refresh();
      toast.success('Workspace switched');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const logoutMutation = useMutation({
    mutationFn: () => post('/auth/logout'),
    onSettled: () => {
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  const value = React.useMemo<SessionContextValue>(() => {
    const permissions = new Set(data?.permissions ?? []);
    return {
      session: data ?? null,
      isLoading,
      isError,
      can: (permission: string) => permissions.has(permission),
      switchOrganization: (id: string) => switchMutation.mutate(id),
      isSwitching: switchMutation.isPending,
      logout: () => logoutMutation.mutate(),
      refresh: () => void refetch(),
    };
  }, [data, isLoading, isError, switchMutation, logoutMutation, refetch]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = React.useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside <SessionProvider>');
  return context;
}

/** Convenience hook for permission-gated UI. */
export function usePermission(permission?: string): boolean {
  const { can } = useSession();
  return permission ? can(permission) : true;
}
