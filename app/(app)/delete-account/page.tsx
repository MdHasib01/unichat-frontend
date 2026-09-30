'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { get, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { LEGAL } from '@/lib/legal';
import { cn, formatDateTime } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { useBrand } from '@/components/brand-provider';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  FormField,
  Label,
  Textarea,
} from '@/components/ui/primitives';
import { TableSkeleton } from '@/components/shared/states';
import type { MemberRole } from '@/types';

type Scope = 'ACCOUNT' | 'WORKSPACE' | 'CONNECTED_DATA';
type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

interface DeletionRequest {
  id: string;
  reference: string;
  scope: Scope;
  status: Status;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  organization: { id: string; name: string } | null;
}

const SCOPES: Array<{ value: Scope; title: string; description: string; roles: MemberRole[] | null }> = [
  {
    value: 'ACCOUNT',
    title: 'My user account',
    description:
      'Deletes your profile, sign-in details, sessions and workspace memberships. Messages you sent stay in the workspace, no longer linked to you.',
    roles: null,
  },
  {
    value: 'WORKSPACE',
    title: 'This entire workspace',
    description:
      'Deletes the workspace and everything in it: connected accounts, conversations, messages, contacts, AI knowledge, automations, sales and call records, and team memberships.',
    roles: ['OWNER'],
  },
  {
    value: 'CONNECTED_DATA',
    title: 'Synchronized messaging data only',
    description:
      'Deletes all conversations, messages and contacts received from Facebook, Instagram, WhatsApp and website chat. Settings and team stay.',
    roles: ['OWNER', 'ADMIN'],
  },
];

const SCOPE_LABELS: Record<Scope, string> = {
  ACCOUNT: 'User account',
  WORKSPACE: 'Entire workspace',
  CONNECTED_DATA: 'Synchronized messaging data',
};

const STATUS_BADGES: Record<Status, { label: string; variant: 'warning' | 'default' | 'success' | 'destructive' | 'muted' }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  IN_PROGRESS: { label: 'In progress', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  CANCELLED: { label: 'Cancelled', variant: 'muted' },
};

export default function DeleteAccountPage() {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const brand = useBrand();
  const role = session?.role ?? null;

  const [scope, setScope] = React.useState<Scope>('ACCOUNT');
  const [reason, setReason] = React.useState('');
  const [confirmed, setConfirmed] = React.useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: queryKeys.deletionRequests,
    queryFn: () => get<DeletionRequest[]>('/account/deletion-requests'),
  });

  const open = requests?.find((r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS') ?? null;

  const submit = useMutation({
    mutationFn: () =>
      post<DeletionRequest>('/account/deletion-requests', { scope, reason: reason.trim() || null }),
    onSuccess: (request) => {
      setReason('');
      setConfirmed(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.deletionRequests });
      toast.success(`Request ${request.reference} received`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => post(`/account/deletion-requests/${id}/cancel`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.deletionRequests });
      toast.success('Deletion request cancelled');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const allowed = (roles: MemberRole[] | null) => roles === null || (role !== null && roles.includes(role));
  const workspaceName = session?.organization?.name;

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Delete account or data"
        description={`Ask ${brand.name} to permanently delete your account, your workspace, or the messaging data synced from connected platforms.`}
      />

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <TableSkeleton rows={2} columns={2} />
          </Card>
        ) : open ? (
          <Card className="border-warning/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Your request {open.reference} is {open.status === 'PENDING' ? 'pending' : 'in progress'}
              </CardTitle>
              <CardDescription>
                {SCOPE_LABELS[open.scope]}
                {open.organization ? ` · ${open.organization.name}` : ''} · submitted{' '}
                {formatDateTime(open.createdAt)}. We complete verified requests within{' '}
                {LEGAL.deletionDays} days and may email you at {session?.user.email} to confirm.
              </CardDescription>
            </CardHeader>
            {open.status === 'PENDING' ? (
              <CardContent>
                <Button variant="outline" size="sm" onClick={() => cancel.mutate(open.id)} loading={cancel.isPending}>
                  Cancel request
                </Button>
              </CardContent>
            ) : (
              <CardContent className="text-sm text-muted-foreground">
                This request is already being processed. To stop it, email{' '}
                <a href={`mailto:${LEGAL.privacyEmail}`} className="font-medium text-primary hover:underline">
                  {LEGAL.privacyEmail}
                </a>{' '}
                quoting {open.reference}.
              </CardContent>
            )}
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                Request deletion
              </CardTitle>
              <CardDescription>
                Deletion is permanent and cannot be undone. If you only want to stop syncing a
                Facebook Page, Instagram account or WhatsApp number, disconnect it from{' '}
                <Link href="/integrations" className="font-medium text-primary hover:underline">
                  Integrations
                </Link>{' '}
                instead.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <fieldset>
                <legend className="text-sm font-medium">What should we delete?</legend>
                <div className="mt-2 space-y-2">
                  {SCOPES.map((option) => {
                    const enabled = allowed(option.roles);
                    const selected = scope === option.value;
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          'flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors',
                          selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50',
                          !enabled && 'cursor-not-allowed opacity-60 hover:bg-transparent',
                        )}
                      >
                        <input
                          type="radio"
                          name="scope"
                          value={option.value}
                          checked={selected}
                          disabled={!enabled}
                          onChange={() => setScope(option.value)}
                          className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {option.title}
                            {option.value !== 'ACCOUNT' && workspaceName ? ` (${workspaceName})` : ''}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                            {option.description}
                          </span>
                          {!enabled ? (
                            <span className="mt-1 block text-xs font-medium text-muted-foreground">
                              {option.roles?.length === 1 ? 'Only the workspace owner' : 'Only a workspace owner or admin'} can
                              request this.
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {scope === 'ACCOUNT' && role === 'OWNER' ? (
                <div className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  <span>
                    You own {workspaceName ?? 'this workspace'}. If you are its only owner, we will contact you
                    about transferring ownership or deleting the workspace too before removing your account.
                  </span>
                </div>
              ) : null}

              <FormField label="Anything we should know? (optional)" hint="For example, which data matters most to you, or a date to act by.">
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={1000}
                  rows={3}
                />
              </FormField>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="confirm-deletion"
                  checked={confirmed}
                  onCheckedChange={(value) => setConfirmed(value === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="confirm-deletion" className="text-sm font-normal leading-snug">
                  I understand that the selected data will be permanently deleted and cannot be recovered.
                </Label>
              </div>

              <Button
                variant="destructive"
                onClick={() => submit.mutate()}
                loading={submit.isPending}
                disabled={!confirmed || !allowed(SCOPES.find((s) => s.value === scope)?.roles ?? null)}
              >
                Submit deletion request
              </Button>
            </CardContent>
          </Card>
        )}

        {requests && requests.some((r) => r.id !== open?.id) ? (
          <Card>
            <CardHeader>
              <CardTitle>Previous requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {requests
                  .filter((r) => r.id !== open?.id)
                  .map((request) => (
                    <div key={request.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm">
                      <span className="font-mono text-xs">{request.reference}</span>
                      <span className="text-muted-foreground">{SCOPE_LABELS[request.scope]}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(request.createdAt)}</span>
                      <Badge variant={STATUS_BADGES[request.status].variant} className="ml-auto">
                        {request.status === 'COMPLETED' ? <CheckCircle2 className="h-3 w-3" /> : null}
                        {STATUS_BADGES[request.status].label}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <p className="text-xs leading-relaxed text-muted-foreground">
          You can also request deletion by emailing{' '}
          <a href={`mailto:${LEGAL.privacyEmail}`} className="font-medium text-primary hover:underline">
            {LEGAL.privacyEmail}
          </a>
          . Read the{' '}
          <Link href="/data-deletion" className="font-medium text-primary hover:underline">
            Data Deletion Instructions
          </Link>{' '}
          for what is deleted and what we keep.
        </p>
      </div>
    </PageContainer>
  );
}
