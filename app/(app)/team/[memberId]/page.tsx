'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Inbox, Mail, MessageSquare, ShieldCheck } from 'lucide-react';
import { get } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, timeAgo, titleCase } from '@/lib/utils';
import { PageContainer } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  UserAvatar,
} from '@/components/ui/primitives';
import { ErrorState } from '@/components/shared/states';
import { STATUS_VARIANTS } from '@/components/shared/data-table';
import type { MemberRole, MemberStatus } from '@/types';

interface MemberDetail {
  id: string;
  role: MemberRole;
  status: MemberStatus;
  title: string | null;
  createdAt: string;
  permissions: string[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
    timezone: string;
    lastLoginAt: string | null;
    createdAt: string;
  };
  stats: { activeConversations: number; resolved: number; messagesSent: number };
}

export default function TeamMemberPage() {
  const { memberId } = useParams<{ memberId: string }>();

  const { data: member, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.teamMember(memberId),
    queryFn: () => get<MemberDetail>(`/team/${memberId}`),
  });

  if (isError) {
    return (
      <PageContainer>
        <ErrorState title="Team member not found" onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  if (isLoading || !member) {
    return (
      <PageContainer>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="mt-4 h-64 w-full" />
      </PageContainer>
    );
  }

  // Group permissions by their feature prefix so the list is readable.
  const grouped = member.permissions.reduce<Record<string, string[]>>((acc, permission) => {
    const [group, action] = permission.split('.');
    acc[group] = [...(acc[group] ?? []), action];
    return acc;
  }, {});

  return (
    <PageContainer className="max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/team">
          <ArrowLeft className="h-4 w-4" />
          All team members
        </Link>
      </Button>

      <Card className="mb-4">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <UserAvatar
            name={`${member.user.firstName} ${member.user.lastName}`}
            src={member.user.avatarUrl}
            className="h-16 w-16 text-lg"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {member.user.firstName} {member.user.lastName}
              </h1>
              <Badge variant="outline" className="capitalize">
                {member.role.toLowerCase()}
              </Badge>
              <Badge variant={STATUS_VARIANTS[member.status] ?? 'secondary'}>
                {member.status.toLowerCase()}
              </Badge>
            </div>

            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {member.user.email}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Joined {formatDate(member.createdAt)}
              {member.user.lastLoginAt ? ` · last signed in ${timeAgo(member.user.lastLoginAt)}` : ''}
            </p>
          </div>
        </div>
      </Card>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat icon={Inbox} label="Open conversations" value={member.stats.activeConversations} />
        <Stat icon={CheckCircle2} label="Resolved" value={member.stats.resolved} />
        <Stat icon={MessageSquare} label="Replies sent" value={member.stats.messagesSent} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Permissions
          </CardTitle>
          <CardDescription>
            What the {member.role.toLowerCase()} role grants in this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {Object.entries(grouped).map(([group, actions]) => (
            <div key={group} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{titleCase(group)}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {actions.map((action) => (
                  <Badge key={action} variant="secondary" className="text-2xs">
                    {action.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Inbox;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}
