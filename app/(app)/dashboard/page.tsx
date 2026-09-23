'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock,
  Inbox,
  MessageSquare,
  Plug,
  ShoppingCart,
  Users,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { get } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { useSession } from '@/hooks/use-session';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton, UserAvatar } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { PlatformBadge, PlatformIcon, PLATFORM_META } from '@/components/shared/platform';
import { CardGridSkeleton, EmptyState, ErrorState } from '@/components/shared/states';
import { cn, formatCurrency, formatDuration, formatListTime, formatNumber } from '@/lib/utils';
import type { DashboardPayload } from '@/types';

export default function DashboardPage() {
  const { session } = useSession();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => get<DashboardPayload>('/dashboard'),
  });

  const firstName = session?.user.firstName ?? 'there';

  return (
    <PageContainer>
      <PageHeader
        title={`Good to see you, ${firstName}`}
        description={`Here's what has been happening in ${session?.organization?.name ?? 'your workspace'} over the last 30 days.`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/integrations">
                <Plug className="h-4 w-4" />
                Channels
              </Link>
            </Button>
            <Button asChild>
              <Link href="/inbox">
                <Inbox className="h-4 w-4" />
                Open inbox
              </Link>
            </Button>
          </>
        }
      />

      {isError ? (
        <ErrorState description="We could not load your dashboard." onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <div className="space-y-4">
          <CardGridSkeleton />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          <StatGrid data={data} />

          <div className="grid gap-4 lg:grid-cols-3">
            <ConversationChart data={data} />
            <ChannelMix data={data} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <RecentConversations data={data} />
            <div className="space-y-4">
              <ConnectedChannels data={data} />
              <SalesSnapshot data={data} />
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function StatGrid({ data }: { data: DashboardPayload }) {
  const stats = [
    {
      label: 'New conversations',
      value: formatNumber(data.overview.newConversations),
      change: data.trends.conversations,
      icon: MessageSquare,
      hint: `${formatNumber(data.overview.openConversations)} still open`,
    },
    {
      label: 'Messages handled',
      value: formatNumber(data.overview.messagesReceived + data.overview.messagesSent),
      change: data.trends.messages,
      icon: Inbox,
      hint: `${formatNumber(data.overview.messagesReceived)} in · ${formatNumber(data.overview.messagesSent)} out`,
    },
    {
      label: 'Avg. first response',
      value: data.overview.averageResponseSeconds
        ? formatDuration(data.overview.averageResponseSeconds)
        : '—',
      change: data.trends.responseTime,
      icon: Clock,
      hint: 'Time to the first human or AI reply',
    },
    {
      label: 'Resolved',
      value: formatNumber(data.overview.resolvedConversations),
      change: data.trends.resolved,
      icon: CheckCircle2,
      hint: `${data.overview.aiResolutionRate}% handled by AI without handoff`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const positive = stat.change >= 0;
        return (
          <Card key={stat.label} className="p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{stat.value}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {stat.change !== 0 ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-medium',
                    positive ? 'text-success' : 'text-destructive',
                  )}
                >
                  {positive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(stat.change)}%
                </span>
              ) : null}
              <span className="truncate text-muted-foreground">{stat.hint}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ConversationChart({ data }: { data: DashboardPayload }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Conversation volume</CardTitle>
          <p className="text-sm text-muted-foreground">Messages in and out over the last 14 days</p>
        </div>
        <Badge variant="secondary">
          <Bot className="h-3 w-3" />
          {formatNumber(data.overview.aiMessages)} AI replies
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="inbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(243 75% 59%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(243 75% 59%)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="outbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 71% 40%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(142 71% 40%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) => value.slice(5)}
                tickLine={false}
                axisLine={false}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--popover))',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="inbound"
                name="Received"
                stroke="hsl(243 75% 59%)"
                strokeWidth={2}
                fill="url(#inbound)"
              />
              <Area
                type="monotone"
                dataKey="outbound"
                name="Sent"
                stroke="hsl(142 71% 40%)"
                strokeWidth={2}
                fill="url(#outbound)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ChannelMix({ data }: { data: DashboardPayload }) {
  const chartData = data.platforms
    .filter((p) => p.conversations > 0)
    .map((p) => ({
      name: PLATFORM_META[p.platform].label,
      value: p.conversations,
      platform: p.platform,
    }));

  const COLORS: Record<string, string> = {
    FACEBOOK: '#1877f2',
    INSTAGRAM: '#d62976',
    WHATSAPP: '#25d366',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where customers reach you</CardTitle>
        <p className="text-sm text-muted-foreground">Conversations by channel</p>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <EmptyState
            icon={Plug}
            title="No conversations yet"
            description="Connect a channel to start receiving messages."
            action={
              <Button asChild size="sm">
                <Link href="/integrations">Connect a channel</Link>
              </Button>
            }
            className="py-8"
          />
        ) : (
          <>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={44}
                    outerRadius={66}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.platform} fill={COLORS[entry.platform]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--popover))',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 space-y-2">
              {data.platforms.map((platform) => (
                <div key={platform.platform} className="flex items-center justify-between text-sm">
                  <PlatformBadge platform={platform.platform} />
                  <span className="tabular-nums text-muted-foreground">
                    {formatNumber(platform.conversations)} chats · {formatNumber(platform.messages)} msgs
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RecentConversations({ data }: { data: DashboardPayload }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Latest conversations</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/inbox">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {data.recentConversations.length === 0 ? (
          <EmptyState
            title="Your inbox is empty"
            description="Once a customer messages one of your connected channels, the conversation appears here."
          />
        ) : (
          <div className="divide-y divide-border">
            {data.recentConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/inbox/${conversation.id}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/60"
              >
                <div className="relative">
                  <UserAvatar
                    name={conversation.contact.displayName}
                    src={conversation.contact.avatarUrl}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <PlatformIcon platform={conversation.platform} className="h-4 w-4 rounded" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{conversation.contact.displayName}</p>
                    {conversation.unreadCount > 0 ? (
                      <Badge className="h-4 px-1.5 text-2xs">{conversation.unreadCount}</Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {conversation.lastMessagePreview ?? 'No messages yet'}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatListTime(conversation.lastMessageAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConnectedChannels({ data }: { data: DashboardPayload }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Connected channels</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/integrations">Manage</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.channels.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            No channels connected yet.{' '}
            <Link href="/integrations" className="font-medium text-primary hover:underline">
              Connect one
            </Link>
            .
          </p>
        ) : (
          data.channels.map((channel) => (
            <div key={channel.id} className="flex items-center gap-2.5">
              <PlatformIcon platform={channel.platform} />
              <span className="min-w-0 flex-1 truncate text-sm">{channel.name}</span>
              <Badge variant={channel.isActive ? 'success' : 'muted'}>
                {channel.isActive ? 'Live' : 'Off'}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SalesSnapshot({ data }: { data: DashboardPayload }) {
  const currency = 'USD';
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Sales (30 days)</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/sales/orders">Open</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <Row
          icon={ShoppingCart}
          label="Orders"
          value={formatNumber(data.sales.orders30d)}
          hint={`${data.sales.pendingOrders} pending`}
        />
        <Row icon={Zap} label="Revenue" value={formatCurrency(data.sales.revenue30d, currency)} />
        <Row
          icon={Users}
          label="New contacts"
          value={formatNumber(data.overview.newContacts)}
        />
      </CardContent>
    </Card>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof ShoppingCart;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      {hint ? <span className="text-xs text-muted-foreground">· {hint}</span> : null}
    </div>
  );
}
