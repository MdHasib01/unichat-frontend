'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, CreditCard, Info, Users } from 'lucide-react';
import { get } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, formatNumber } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Skeleton,
} from '@/components/ui/primitives';
import { STATUS_VARIANTS } from '@/components/shared/data-table';

interface OrganizationDetail {
  id: string;
  name: string;
  subscription: {
    plan: string;
    status: string;
    seats: number;
    messageQuota: number;
    aiReplyQuota: number;
    currentPeriodStart: string;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
  } | null;
  _count: { members: number; contacts: number; conversations: number; socialAccounts: number };
}

const PLAN_FEATURES: Record<string, string[]> = {
  FREE: ['1 connected channel', 'Unified inbox', 'Basic automations'],
  STARTER: ['1 connected channel', 'Unified inbox', 'Automations', 'AI suggestions'],
  GROWTH: ['All three channels', 'Automations', 'AI auto-reply', 'Sales and insights'],
  ENTERPRISE: ['Everything in Growth', 'Priority support', 'Custom retention', 'Dedicated onboarding'],
};

export default function BillingPage() {
  const { can } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.organization,
    queryFn: () => get<OrganizationDetail>('/organization'),
  });

  if (isLoading || !data) return <Skeleton className="h-80 w-full" />;

  const subscription = data.subscription;
  const seatsUsed = data._count.members;
  const seatPercent = subscription ? Math.min(100, (seatsUsed / subscription.seats) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Your plan
            </CardTitle>
            <CardDescription>What this workspace is subscribed to.</CardDescription>
          </div>
          {subscription ? (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="capitalize">
                {subscription.plan.toLowerCase()}
              </Badge>
              <Badge variant={STATUS_VARIANTS[subscription.status] ?? 'secondary'}>
                {subscription.status.toLowerCase()}
              </Badge>
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric
                  label="Billing period"
                  value={
                    subscription.currentPeriodEnd
                      ? `until ${formatDate(subscription.currentPeriodEnd)}`
                      : 'open-ended'
                  }
                />
                <Metric label="Seats" value={`${seatsUsed} of ${subscription.seats}`} />
                <Metric
                  label="Trial"
                  value={
                    subscription.trialEndsAt
                      ? `ends ${formatDate(subscription.trialEndsAt)}`
                      : 'not on trial'
                  }
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Seats used
                  </span>
                  <span className="tabular-nums">
                    {seatsUsed} / {subscription.seats}
                  </span>
                </div>
                <Progress value={seatPercent} />
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium">Included in {subscription.plan.toLowerCase()}</p>
                <ul className="mt-2 space-y-1.5">
                  {(PLAN_FEATURES[subscription.plan] ?? []).map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No subscription record was found for this workspace.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace usage</CardTitle>
          <CardDescription>What you have in this workspace right now.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <Metric label="Team members" value={formatNumber(data._count.members)} />
          <Metric label="Connected channels" value={formatNumber(data._count.socialAccounts)} />
          <Metric label="Contacts" value={formatNumber(data._count.contacts)} />
          <Metric label="Conversations" value={formatNumber(data._count.conversations)} />
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-medium">Payments are not connected in this deployment</p>
            <p className="mt-0.5 text-muted-foreground">
              Your plan, seats and quotas are tracked here, but no payment provider is wired up yet,
              so nothing is charged. {can('billing.manage')
                ? 'As the owner, you will be able to manage payment details here once a provider is configured.'
                : 'Only the workspace owner can manage billing.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}
