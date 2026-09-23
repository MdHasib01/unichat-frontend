'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Mail, MoreVertical, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, post, patch } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, timeAgo } from '@/lib/utils';
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
  UserAvatar,
} from '@/components/ui/primitives';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/overlays';
import { EmptyState, TableSkeleton } from '@/components/shared/states';
import { STATUS_VARIANTS } from '@/components/shared/data-table';
import type { Invitation, MemberRole, TeamMember } from '@/types';

const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  OWNER: 'Full control, including billing and deleting the workspace.',
  ADMIN: 'Everything except billing — settings, team, integrations and AI.',
  MANAGER: 'Assign conversations, build automations, see analytics and manage sales.',
  AGENT: 'Reply to conversations, manage contacts and read the essentials.',
};

const ROLE_ORDER: MemberRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'AGENT'];

export function TeamManager() {
  const queryClient = useQueryClient();
  const { can, session } = useSession();
  const manage = can('team.manage');

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<TeamMember | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: queryKeys.team,
    queryFn: () => get<TeamMember[]>('/team'),
  });

  const { data: invitations } = useQuery({
    queryKey: queryKeys.invitations,
    queryFn: () => get<Invitation[]>('/team/invitations'),
    enabled: can('team.read'),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: MemberRole }) => patch(`/team/${id}`, { role }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.team });
      toast.success('Role updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      patch(`/team/${id}`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.team });
      toast.success('Member updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMember = useMutation({
    mutationFn: (id: string) => del(`/team/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.team });
      setRemoving(null);
      toast.success('Member removed');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revokeInvite = useMutation({
    mutationFn: (id: string) => del(`/team/invitations/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.invitations });
      toast.success('Invitation revoked');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {members?.length ?? 0} member{members?.length === 1 ? '' : 's'} in{' '}
          {session?.organization?.name}
        </p>
        {manage ? (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite someone
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Each person&apos;s role decides what they can see and do in this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={3} columns={3} />
          ) : !members?.length ? (
            <EmptyState title="No team members" />
          ) : (
            <div className="divide-y divide-border">
              {members.map((member) => {
                const isSelf = member.user.id === session?.user.id;
                return (
                  <div key={member.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <UserAvatar
                      name={`${member.user.firstName} ${member.user.lastName}`}
                      src={member.user.avatarUrl}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/team/${member.id}`}
                          className="truncate text-sm font-medium hover:text-primary hover:underline"
                        >
                          {member.user.firstName} {member.user.lastName}
                        </Link>
                        {isSelf ? (
                          <Badge variant="secondary" className="text-2xs">
                            You
                          </Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.user.email}
                        {member.user.lastLoginAt ? ` · last seen ${timeAgo(member.user.lastLoginAt)}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {member.activeConversations} open
                    </div>

                    <Badge variant={STATUS_VARIANTS[member.status] ?? 'secondary'}>
                      {member.status.toLowerCase()}
                    </Badge>

                    {manage && !isSelf ? (
                      <Select
                        value={member.role}
                        onValueChange={(role) => updateRole.mutate({ id: member.id, role: role as MemberRole })}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_ORDER.map((role) => (
                            <SelectItem key={role} value={role} className="capitalize">
                              {role.toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="capitalize">
                        {member.role.toLowerCase()}
                      </Badge>
                    )}

                    {manage && !isSelf ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Member actions">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/team/${member.id}`}>View activity</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              updateStatus.mutate({
                                id: member.id,
                                status: member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                              })
                            }
                          >
                            {member.status === 'ACTIVE' ? 'Suspend access' : 'Restore access'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem destructive onSelect={() => setRemoving(member)}>
                            <Trash2 className="h-4 w-4" />
                            Remove from workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {invitations?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>These people have been invited but have not joined yet.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited as {invitation.role.toLowerCase()} · expires{' '}
                      {formatDate(invitation.expiresAt)}
                    </p>
                  </div>
                  {manage ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => revokeInvite.mutate(invitation.id)}
                      aria-label="Revoke invitation"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            What each role can do
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {ROLE_ORDER.map((role) => (
            <div key={role} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium capitalize">{role.toLowerCase()}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <Dialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Remove {removing?.user.firstName} {removing?.user.lastName}?
            </DialogTitle>
            <DialogDescription>
              They lose access to this workspace immediately. Their conversations are unassigned so
              nothing is left orphaned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => removing && removeMember.mutate(removing.id)}
              loading={removeMember.isPending}
            >
              Remove member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<MemberRole>('AGENT');
  const [inviteUrl, setInviteUrl] = React.useState<string | null>(null);

  const invite = useMutation({
    mutationFn: () => post<{ inviteUrl?: string }>('/team/invitations', { email: email.trim(), role }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.invitations });
      setEmail('');
      // Outside production the API returns the link so the flow works before
      // email delivery is configured.
      if (result?.inviteUrl) setInviteUrl(result.inviteUrl);
      else onOpenChange(false);
      toast.success('Invitation sent');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const close = () => {
    setInviteUrl(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            They get access to this workspace only — never to your other workspaces.
          </DialogDescription>
        </DialogHeader>

        {inviteUrl ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-border bg-secondary/50 p-3">
              <p className="text-xs font-medium">Invitation link</p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{inviteUrl}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteUrl);
                  toast.success('Link copied');
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Email delivery is not configured in this environment, so share this link directly.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <FormField label="Email address" required>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@business.com"
                autoFocus
              />
            </FormField>

            <FormField label="Role" hint={ROLE_DESCRIPTIONS[role]}>
              <Select value={role} onValueChange={(value) => setRole(value as MemberRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_ORDER.map((option) => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {inviteUrl ? 'Done' : 'Cancel'}
          </Button>
          {!inviteUrl ? (
            <Button
              onClick={() => invite.mutate()}
              loading={invite.isPending}
              disabled={!email.includes('@')}
            >
              <Mail className="h-4 w-4" />
              Send invitation
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
