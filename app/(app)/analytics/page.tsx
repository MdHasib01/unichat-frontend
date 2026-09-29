'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Bot, CheckCircle2, Clock, MessageSquare, Users, Zap } from 'lucide-react';
import { get } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatDuration, formatNumber } from '@/lib/utils';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Skeleton,
  UserAvatar,
} from '@/components/ui/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/overlays';
import { PlatformBadge } from '@/components/shared/platform';
import { CardGridSkeleton, EmptyState } from '@/components/shared/states';
import type { InsightsPayload } from '@/types';

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: '#1877f2',
  INSTAGRAM: '#d62976',
  WHATSAPP: '#25d366',
  WEBCHAT: '#4f46e5',
};

export default function InsightsPage() {
  const [days, setDays] = React.useState(30);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.insights(days),
    queryFn: () => get<InsightsPayload>('/analytics', { days }),
  });

  return (
    <PageContainer>
      <PageHeader
        title="Insights"
        description="How your team and your assistant are handling customer conversations. These numbers cover this workspace only."
        actions={
          <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {isLoading || !data ? (
        <div className="space-y-4">
          <CardGridSkeleton />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={MessageSquare}
              label="Conversations"
              value={formatNumber(data.overview.newConversations)}
              hint={`${formatNumber(data.overview.openConversations)} open now`}
            />
            <Stat
              icon={CheckCircle2}
              label="Resolved"
              value={formatNumber(data.overview.resolvedConversations)}
              hint={`${formatNumber(data.overview.messagesSent)} replies sent`}
            />
            <Stat
              icon={Clock}
              label="Avg. first response"
              value={
                data.overview.averageResponseSeconds
                  ? formatDuration(data.overview.averageResponseSeconds)
                  : '—'
              }
              hint="From customer message to first reply"
            />
            <Stat
              icon={Bot}
              label="AI resolution rate"
              value={`${data.overview.aiResolutionRate}%`}
              hint={`${formatNumber(data.overview.aiMessages)} AI replies · ${data.overview.aiHandoffs} handoffs`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Conversations over time</CardTitle>
                <CardDescription>New versus resolved, day by day.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.series} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value: string) => value.slice(5)}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        minTickGap={20}
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
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="conversations"
                        name="New"
                        stroke="hsl(243 75% 59%)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="resolved"
                        name="Resolved"
                        stroke="hsl(142 71% 40%)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="ai"
                        name="AI replies"
                        stroke="hsl(38 92% 50%)"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By channel</CardTitle>
                <CardDescription>Where the volume comes from.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.platforms}
                      layout="vertical"
                      margin={{ top: 0, right: 8, bottom: 0, left: 8 }}
                    >
                      <XAxis type="number" hide allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="platform"
                        tickLine={false}
                        axisLine={false}
                        width={70}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        tickFormatter={(value: string) =>
                          value.charAt(0) + value.slice(1).toLowerCase()
                        }
                      />
                      <RechartsTooltip
                        cursor={{ fill: 'hsl(var(--secondary))' }}
                        contentStyle={{
                          borderRadius: 10,
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--popover))',
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="conversations" name="Conversations" radius={[0, 6, 6, 0]}>
                        {data.platforms.map((entry) => (
                          <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 space-y-2">
                  {data.platforms.map((platform) => (
                    <div key={platform.platform} className="flex items-center justify-between text-sm">
                      <PlatformBadge platform={platform.platform} />
                      <span className="tabular-nums text-muted-foreground">
                        {formatNumber(platform.messages)} messages
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Team activity
                </CardTitle>
                <CardDescription>Who is carrying the conversation load.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {data.agents.length === 0 ? (
                  <EmptyState title="No team activity yet" />
                ) : (
                  <div className="divide-y divide-border">
                    {[...data.agents]
                      .sort((a, b) => b.assigned - a.assigned)
                      .map((agent) => (
                        <div key={agent.user.id} className="flex items-center gap-3 px-5 py-3">
                          <UserAvatar
                            name={`${agent.user.firstName} ${agent.user.lastName}`}
                            src={agent.user.avatarUrl}
                            className="h-8 w-8"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {agent.user.firstName} {agent.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {agent.assigned} assigned · {agent.resolved} resolved ·{' '}
                              {agent.messagesSent} replies
                            </p>
                          </div>
                          <div className="w-24 shrink-0">
                            <Progress value={agent.resolutionRate} />
                            <p className="mt-1 text-right text-2xs text-muted-foreground">
                              {agent.resolutionRate}%
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Automation performance
                </CardTitle>
                <CardDescription>How your rules performed in this period.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {data.automations.length === 0 ? (
                  <EmptyState title="No automations yet" description="Create a rule to see it here." />
                ) : (
                  <div className="divide-y divide-border">
                    {data.automations.map((automation) => (
                      <div key={automation.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{automation.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {automation.runs} run{automation.runs === 1 ? '' : 's'}
                            {automation.failed > 0 ? ` · ${automation.failed} failed` : ''}
                          </p>
                        </div>
                        <Badge variant={automation.isActive ? 'success' : 'muted'}>
                          {automation.isActive ? 'Active' : 'Paused'}
                        </Badge>
                        <span className="w-12 text-right text-sm font-semibold tabular-nums">
                          {automation.successRate}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}
