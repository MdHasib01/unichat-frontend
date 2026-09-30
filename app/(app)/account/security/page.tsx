'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, LogOut, Monitor, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatDateTime, timeAgo } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
} from '@/components/ui/primitives';
import { TableSkeleton } from '@/components/shared/states';

interface SessionRow {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
}

export default function AccountSecurityPage() {
  const queryClient = useQueryClient();
  const { logout } = useSession();

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');

  const { data: sessions, isLoading } = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: () => get<SessionRow[]>('/auth/sessions'),
  });

  const changePassword = useMutation({
    mutationFn: () => post('/auth/change-password', { currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      toast.success('Password updated — your other sessions were signed out');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => del(`/auth/sessions/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      toast.success('Session signed out');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const signOutEverywhere = useMutation({
    mutationFn: () => post('/auth/logout-all'),
    onSuccess: () => {
      toast.success('Signed out everywhere');
      window.location.href = '/login';
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const passwordValid =
    newPassword.length >= 10 &&
    /[a-z]/.test(newPassword) &&
    /[A-Z]/.test(newPassword) &&
    /[0-9]/.test(newPassword);
  const matches = newPassword === confirm;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Change your password
          </CardTitle>
          <CardDescription>
            Choosing a new password signs you out of every other device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FormField label="Current password" required>
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="New password"
              required
              error={newPassword && !passwordValid ? 'At least 10 characters, with upper, lower and a number' : undefined}
            >
              <Input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </FormField>

            <FormField
              label="Confirm new password"
              required
              error={confirm && !matches ? 'Both passwords must match' : undefined}
            >
              <Input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </FormField>
          </div>

          <Button
            onClick={() => changePassword.mutate()}
            loading={changePassword.isPending}
            disabled={!currentPassword || !passwordValid || !matches}
          >
            Update password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              Active sessions
            </CardTitle>
            <CardDescription>Devices currently signed in to your account.</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOutEverywhere.mutate()}
            loading={signOutEverywhere.isPending}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Sign out everywhere
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={2} columns={3} />
          ) : (
            <div className="divide-y divide-border">
              {sessions?.map((row) => (
                <div key={row.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <Monitor className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {describeUserAgent(row.userAgent)}
                      </p>
                      {row.current ? (
                        <Badge variant="success" className="shrink-0 text-2xs">
                          This device
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.ip ?? 'unknown IP'} · active {timeAgo(row.lastUsedAt)} · expires{' '}
                      {formatDateTime(row.expiresAt)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => (row.current ? logout() : revoke.mutate(row.id))}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {row.current ? 'Sign out' : 'Revoke'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              Delete your account
            </CardTitle>
            <CardDescription>
              Request permanent deletion of your account, your workspace or its synced messaging data.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/delete-account">Request deletion</Link>
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}

/** Turns a raw user-agent string into something a person can recognise. */
function describeUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device';

  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Safari\//.test(userAgent) && !/Chrome/.test(userAgent)
        ? 'Safari'
        : /Firefox\//.test(userAgent)
          ? 'Firefox'
          : 'Browser';

  const platform = /Windows/.test(userAgent)
    ? 'Windows'
    : /Macintosh|Mac OS/.test(userAgent)
      ? 'macOS'
      : /Android/.test(userAgent)
        ? 'Android'
        : /iPhone|iPad/.test(userAgent)
          ? 'iOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'Unknown OS';

  return `${browser} on ${platform}`;
}
