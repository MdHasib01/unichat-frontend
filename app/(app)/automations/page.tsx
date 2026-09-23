'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Pencil, Plus, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, getWithMeta, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { timeAgo } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from '@/components/ui/primitives';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlays';
import { EmptyState, TableSkeleton } from '@/components/shared/states';
import { STATUS_VARIANTS } from '@/components/shared/data-table';
import { TRIGGER_LABELS, ACTION_LABELS } from '@/features/automations/labels';
import type { Automation, AutomationExecution } from '@/types';

export default function AutomationsPage() {
  const queryClient = useQueryClient();
  const { can } = useSession();
  const [deleting, setDeleting] = React.useState<Automation | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.automations,
    queryFn: () => get<Automation[]>('/automations'),
  });

  const { data: executions } = useQuery({
    queryKey: queryKeys.automationExecutions({ page: 1 }),
    queryFn: () => getWithMeta<AutomationExecution[]>('/automations/executions', { page: 1, pageSize: 8 }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      post(`/automations/${id}/toggle`, { isActive }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.automations }),
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del(`/automations/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.automations });
      setDeleting(null);
      toast.success('Automation deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Automations"
        description="Rules that greet, tag, route and follow up automatically, so your team only handles what needs a person."
        actions={
          can('automation.create') ? (
            <Button asChild>
              <Link href="/automations/new">
                <Plus className="h-4 w-4" />
                New automation
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {isLoading ? (
            <Card>
              <TableSkeleton rows={4} columns={3} />
            </Card>
          ) : !data?.length ? (
            <Card>
              <EmptyState
                icon={Zap}
                title="No automations yet"
                description="Start with a welcome message for first-time customers — it is the highest-impact rule most businesses add."
                action={
                  can('automation.create') ? (
                    <Button asChild>
                      <Link href="/automations/new">Create your first automation</Link>
                    </Button>
                  ) : null
                }
              />
            </Card>
          ) : (
            data.map((automation) => (
              <Card key={automation.id}>
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/automations/${automation.id}`}
                        className="font-semibold hover:text-primary hover:underline"
                      >
                        {automation.name}
                      </Link>
                      {automation.runOncePerContact ? (
                        <Badge variant="secondary">Once per customer</Badge>
                      ) : null}
                      {automation.platforms.length ? (
                        <Badge variant="muted">
                          {automation.platforms.map((p) => p.toLowerCase()).join(', ')}
                        </Badge>
                      ) : null}
                    </div>

                    {automation.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{automation.description}</p>
                    ) : null}

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-medium text-muted-foreground">When</span>
                      {automation.triggers.map((trigger) => (
                        <Badge key={trigger.id} variant="outline">
                          {TRIGGER_LABELS[trigger.type] ?? trigger.type}
                        </Badge>
                      ))}
                      <span className="ml-1 font-medium text-muted-foreground">then</span>
                      {automation.actions.slice(0, 4).map((action) => (
                        <Badge key={action.id} variant="secondary">
                          {ACTION_LABELS[action.type] ?? action.type}
                        </Badge>
                      ))}
                      {automation.actions.length > 4 ? (
                        <span className="text-muted-foreground">
                          +{automation.actions.length - 4} more
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Ran {automation.executionCount} time{automation.executionCount === 1 ? '' : 's'}
                      {automation.lastExecutedAt ? ` · last ${timeAgo(automation.lastExecutedAt)}` : ''}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      checked={automation.isActive}
                      onCheckedChange={(isActive) => toggle.mutate({ id: automation.id, isActive })}
                      disabled={!can('automation.update')}
                      aria-label={`${automation.isActive ? 'Pause' : 'Activate'} ${automation.name}`}
                    />
                    {can('automation.update') ? (
                      <Button asChild variant="ghost" size="icon-sm" aria-label="Edit">
                        <Link href={`/automations/${automation.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    ) : null}
                    {can('automation.delete') ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(automation)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent activity
            </CardTitle>
            <CardDescription>The last automations that ran in this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!executions?.data.length ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground">Nothing has run yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {executions.data.map((execution) => (
                  <div key={execution.id} className="flex items-center gap-2 px-5 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 truncate">{execution.automation.name}</span>
                    <Badge variant={STATUS_VARIANTS[execution.status] ?? 'secondary'} className="shrink-0">
                      {execution.status.toLowerCase()}
                    </Badge>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(execution.startedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.name}”?</DialogTitle>
            <DialogDescription>
              The rule stops running immediately. Its execution history is removed too.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleting && remove.mutate(deleting.id)}
              loading={remove.isPending}
            >
              Delete automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
