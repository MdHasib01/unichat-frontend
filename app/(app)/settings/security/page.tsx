'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileClock, Lock, ShieldCheck } from 'lucide-react';
import { getWithMeta } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { timeAgo, titleCase } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  UserAvatar,
} from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { EmptyState, TableSkeleton } from '@/components/shared/states';
import Link from 'next/link';

interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ip: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
}

const SECURITY_FACTS = [
  {
    title: 'Tenant isolation',
    description:
      'Every request resolves your organization from the server-side session, then checks your membership before any data is read. One workspace can never see another.',
  },
  {
    title: 'Encrypted channel credentials',
    description:
      'Meta access tokens are encrypted with AES-256-GCM before being stored and are never sent to your browser.',
  },
  {
    title: 'Verified webhooks',
    description:
      'Incoming Meta webhooks are rejected unless their signature matches your app secret.',
  },
  {
    title: 'Rotating sessions',
    description:
      'Refresh tokens rotate on every use and are stored only as hashes, so a database leak cannot be replayed.',
  },
];

export default function SecuritySettingsPage() {
  const { can } = useSession();
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auditLogs(page),
    queryFn: () => getWithMeta<AuditLog[]>('/audit-logs', { page, pageSize: 20 }),
    enabled: can('settings.manage'),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            How your workspace is protected
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {SECURITY_FACTS.map((fact) => (
            <div key={fact.title} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{fact.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{fact.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Your own sign-in
          </CardTitle>
          <CardDescription>
            Passwords and active sessions are managed on your personal account page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/account/security">Manage your password and sessions</Link>
          </Button>
        </CardContent>
      </Card>

      {can('settings.manage') ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileClock className="h-4 w-4 text-primary" />
              Audit log
            </CardTitle>
            <CardDescription>
              Everything your team changed in this workspace, newest first.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton rows={5} columns={3} />
            ) : !data?.data.length ? (
              <EmptyState title="Nothing logged yet" />
            ) : (
              <>
                <div className="divide-y divide-border">
                  {data.data.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                      {log.user ? (
                        <UserAvatar
                          name={`${log.user.firstName} ${log.user.lastName}`}
                          className="h-7 w-7"
                        />
                      ) : (
                        <span className="h-7 w-7 rounded-full bg-secondary" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          <span className="font-medium">
                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                          </span>{' '}
                          <span className="text-muted-foreground">
                            {titleCase(log.action.replace(/\./g, ' '))}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.entityType ? `${log.entityType} · ` : ''}
                          {log.ip ?? 'no IP recorded'}
                        </p>
                      </div>

                      <Badge variant="muted" className="shrink-0 font-mono text-2xs">
                        {log.action}
                      </Badge>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(log.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>

                {data.meta?.pagination && data.meta.pagination.totalPages > 1 ? (
                  <div className="flex items-center justify-between border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
                    <span>
                      Page {data.meta.pagination.page} of {data.meta.pagination.totalPages}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!data.meta.pagination.hasMore}
                        onClick={() => setPage(page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
