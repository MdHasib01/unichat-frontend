'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Link2,
  Plug,
  PlugZap,
  RefreshCw,
  Send,
  ShieldAlert,
  Unplug,
} from 'lucide-react';
import { toast } from 'sonner';
import { get, post, del } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatDateTime, timeAgo } from '@/lib/utils';
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
  Checkbox,
  FormField,
  Input,
  Separator,
  Skeleton,
  Textarea,
} from '@/components/ui/primitives';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/overlays';
import { PlatformIcon, PLATFORM_META } from '@/components/shared/platform';
import { EmptyState } from '@/components/shared/states';
import { STATUS_VARIANTS } from '@/components/shared/data-table';
import { WebsiteChatCard } from '@/features/webchat/website-chat-card';
import type { AvailableAccounts, IntegrationsPayload, SocialAccount } from '@/types';

export default function IntegrationsPage() {
  return (
    <React.Suspense fallback={null}>
      <IntegrationsContent />
    </React.Suspense>
  );
}

function IntegrationsContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { can } = useSession();

  const [selectOpen, setSelectOpen] = React.useState(false);
  const [simulateOpen, setSimulateOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.integrations,
    queryFn: () => get<IntegrationsPayload>('/integrations'),
  });

  // Surface the outcome of the Meta redirect.
  React.useEffect(() => {
    const error = searchParams.get('error');
    const connected = searchParams.get('connected');
    if (error) toast.error(decodeURIComponent(error));
    if (connected) {
      toast.success('Meta connected — choose the channels to bring in');
      setSelectOpen(true);
      void queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
    }
  }, [searchParams, queryClient]);

  const connect = useMutation({
    mutationFn: async () => {
      if (data?.mockMode) return post<AvailableAccounts>('/integrations/meta/mock-connect');
      const result = await post<{ url: string }>('/integrations/meta/connect');
      window.location.href = result.url;
      return null;
    },
    onSuccess: (result) => {
      if (result) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
        setSelectOpen(true);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const disconnectMeta = useMutation({
    mutationFn: () => del('/integrations/meta'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
      toast.success('Meta disconnected');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const manage = can('integrations.manage');
  const connected = data?.meta?.status === 'CONNECTED';

  return (
    <PageContainer>
      <PageHeader
        title="Integrations"
        description="Connect the channels your customers already use. Access tokens are encrypted at rest and never sent to your browser."
        actions={
          manage ? (
            connected ? (
              <>
                {data?.mockMode ? (
                  <Button variant="outline" onClick={() => setSimulateOpen(true)}>
                    <Send className="h-4 w-4" />
                    Simulate a message
                  </Button>
                ) : null}
                <Button variant="outline" onClick={() => setSelectOpen(true)}>
                  <Plug className="h-4 w-4" />
                  Add channels
                </Button>
              </>
            ) : (
              <Button onClick={() => connect.mutate()} loading={connect.isPending}>
                <PlugZap className="h-4 w-4" />
                {data?.mockMode ? 'Connect demo channels' : 'Connect Meta'}
              </Button>
            )
          ) : null
        }
      />

      {data?.mockMode ? (
        <Card className="mb-4 border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="text-sm">
              <p className="font-medium">Mock mode is on</p>
              <p className="mt-0.5 text-muted-foreground">
                No Meta app credentials are configured, so Unichat uses demo channels. Sending and
                receiving run through the same pipeline as production — only the transport is
                simulated. Set <code className="font-mono text-xs">META_APP_ID</code>,{' '}
                <code className="font-mono text-xs">META_APP_SECRET</code> and{' '}
                <code className="font-mono text-xs">MOCK_MODE=false</code> to go live.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Meta
                  {connected ? (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="muted">Not connected</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {data?.meta
                    ? `${data.meta.displayName ?? 'Meta account'} · connected ${timeAgo(data.meta.createdAt)}`
                    : 'Facebook Messenger, Instagram Direct and WhatsApp Business all run through one Meta connection.'}
                </CardDescription>
              </div>

              {connected && manage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => disconnectMeta.mutate()}
                  loading={disconnectMeta.isPending}
                >
                  <Unplug className="h-4 w-4" />
                  Disconnect
                </Button>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-3">
              {data?.meta?.lastError ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p className="font-medium">Meta reported a problem</p>
                    <p className="text-muted-foreground">{data.meta.lastError}</p>
                  </div>
                </div>
              ) : null}

              {data?.meta?.tokenExpiresAt ? (
                <p className="text-xs text-muted-foreground">
                  Access token valid until {formatDateTime(data.meta.tokenExpiresAt)}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                {Object.entries(data?.capabilities ?? {}).map(([key, capability]) => (
                  <div key={key} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    {capability.note ? (
                      <p className="mt-1 text-xs text-muted-foreground">{capability.note}</p>
                    ) : null}
                    {capability.requiresReview.length ? (
                      <p className="mt-2 flex items-start gap-1 text-2xs text-muted-foreground">
                        <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
                        Needs Meta approval for: {capability.requiresReview.join(', ')}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected channels</CardTitle>
              <CardDescription>
                Messages sent to these accounts arrive in your Unichat inbox.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!data?.accounts.length ? (
                <EmptyState
                  icon={Plug}
                  title="No channels connected"
                  description="Connect Meta and choose the Pages, Instagram accounts and WhatsApp numbers you want in Unichat."
                  action={
                    manage ? (
                      <Button onClick={() => connect.mutate()} loading={connect.isPending}>
                        {data?.mockMode ? 'Connect demo channels' : 'Connect Meta'}
                      </Button>
                    ) : null
                  }
                />
              ) : (
                <div className="divide-y divide-border">
                  {data.accounts.map((account) => (
                    <ChannelRow key={account.id} account={account} canManage={manage} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <WebsiteChatCard canManage={manage} />

          <WebhookActivity />
        </div>
      )}

      <SelectChannelsDialog open={selectOpen} onOpenChange={setSelectOpen} />
      <SimulateDialog
        open={simulateOpen}
        onOpenChange={setSimulateOpen}
        accounts={data?.accounts.filter((a) => a.isActive) ?? []}
      />
    </PageContainer>
  );
}

function ChannelRow({ account, canManage }: { account: SocialAccount; canManage: boolean }) {
  const queryClient = useQueryClient();

  const disconnect = useMutation({
    mutationFn: () => del(`/integrations/accounts/${account.id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
      toast.success(`${account.name} disconnected`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reconnect = useMutation({
    mutationFn: () => post(`/integrations/accounts/${account.id}/reconnect`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
      toast.success(`${account.name} reconnected`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3.5">
      <PlatformIcon platform={account.platform} className="h-9 w-9" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{account.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {PLATFORM_META[account.platform].label}
          {account.username ? ` · @${account.username}` : ''}
          {account.phoneNumber ? ` · ${account.phoneNumber}` : ''}
          {' · '}
          {account._count.conversations} conversation{account._count.conversations === 1 ? '' : 's'}
        </p>
        {account.lastError ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-destructive">
            <AlertTriangle className="h-3 w-3" />
            {account.lastError}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={STATUS_VARIANTS[account.status] ?? 'secondary'}>
          {account.status.toLowerCase()}
        </Badge>
        {account.subscribed ? (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Webhooks on
          </Badge>
        ) : null}

        {canManage ? (
          account.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => disconnect.mutate()}
              loading={disconnect.isPending}
            >
              <Unplug className="h-3.5 w-3.5" />
              Disconnect
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => reconnect.mutate()} loading={reconnect.isPending}>
              <RefreshCw className="h-3.5 w-3.5" />
              Reconnect
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}

function SelectChannelsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [pages, setPages] = React.useState<Record<string, boolean>>({});
  const [instagram, setInstagram] = React.useState<Record<string, boolean>>({});
  const [whatsapp, setWhatsapp] = React.useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.metaAccounts,
    queryFn: () => get<AvailableAccounts>('/integrations/meta/accounts'),
    enabled: open,
  });

  const save = useMutation({
    mutationFn: () =>
      post('/integrations/meta/accounts', {
        pages: Object.entries(pages)
          .filter(([, checked]) => checked)
          .map(([externalId]) => ({ externalId, connectInstagram: Boolean(instagram[externalId]) })),
        whatsapp: Object.entries(whatsapp)
          .filter(([, checked]) => checked)
          .map(([externalId]) => ({
            externalId,
            wabaId: data?.availableWhatsApp.find((w) => w.externalId === externalId)?.wabaId ?? '',
          })),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
      onOpenChange(false);
      toast.success('Channels connected');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const nothingSelected =
    !Object.values(pages).some(Boolean) && !Object.values(whatsapp).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose your channels</DialogTitle>
          <DialogDescription>
            Pick which Meta accounts should deliver messages into this workspace.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Facebook Pages
              </p>
              <div className="space-y-2">
                {data?.availablePages.length ? (
                  data.availablePages.map((page) => (
                    <div key={page.externalId} className="rounded-lg border border-border p-3">
                      <label className="flex cursor-pointer items-center gap-2.5">
                        <Checkbox
                          checked={Boolean(pages[page.externalId])}
                          onCheckedChange={(checked) =>
                            setPages({ ...pages, [page.externalId]: checked === true })
                          }
                        />
                        <span className="flex-1">
                          <span className="block text-sm font-medium">{page.name}</span>
                          {page.category ? (
                            <span className="block text-xs text-muted-foreground">{page.category}</span>
                          ) : null}
                        </span>
                      </label>

                      {page.instagram ? (
                        <label className="mt-2 flex cursor-pointer items-center gap-2.5 border-t border-border pt-2 pl-6">
                          <Checkbox
                            checked={Boolean(instagram[page.externalId])}
                            onCheckedChange={(checked) =>
                              setInstagram({ ...instagram, [page.externalId]: checked === true })
                            }
                          />
                          <span className="text-xs">
                            Also connect Instagram{' '}
                            <span className="text-muted-foreground">@{page.instagram.username}</span>
                          </span>
                        </label>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No Pages available.</p>
                )}
              </div>
            </div>

            {data?.availableWhatsApp.length ? (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    WhatsApp Business numbers
                  </p>
                  <div className="space-y-2">
                    {data.availableWhatsApp.map((number) => (
                      <label
                        key={number.externalId}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-3"
                      >
                        <Checkbox
                          checked={Boolean(whatsapp[number.externalId])}
                          onCheckedChange={(checked) =>
                            setWhatsapp({ ...whatsapp, [number.externalId]: checked === true })
                          }
                        />
                        <span className="flex-1">
                          <span className="block text-sm font-medium">{number.displayPhoneNumber}</span>
                          <span className="block text-xs text-muted-foreground">{number.verifiedName}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={nothingSelected}>
            <Link2 className="h-4 w-4" />
            Connect selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Mock-mode helper: pushes a message through the real webhook → worker →
 * inbox pipeline so the whole flow is demonstrable without Meta.
 */
function SimulateDialog({
  open,
  onOpenChange,
  accounts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: SocialAccount[];
}) {
  const [socialAccountId, setSocialAccountId] = React.useState('');
  const [senderName, setSenderName] = React.useState('Demo customer');
  const [text, setText] = React.useState('Hi! Do you ship internationally?');

  React.useEffect(() => {
    if (!socialAccountId && accounts[0]) setSocialAccountId(accounts[0].id);
  }, [accounts, socialAccountId]);

  const simulate = useMutation({
    mutationFn: () =>
      post('/integrations/simulate-inbound', { socialAccountId, senderName, text }),
    onSuccess: () => {
      onOpenChange(false);
      toast.success('Message queued — open the inbox to watch it arrive');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Simulate an inbound message</DialogTitle>
          <DialogDescription>
            This builds a real webhook payload and runs it through the same worker pipeline as a
            live Meta message — including automations and the AI assistant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FormField label="Channel">
            <Select value={socialAccountId} onValueChange={setSocialAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a channel" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Customer name">
            <Input value={senderName} onChange={(event) => setSenderName(event.target.value)} />
          </FormField>

          <FormField label="Message">
            <Textarea rows={3} value={text} onChange={(event) => setText(event.target.value)} />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => simulate.mutate()}
            loading={simulate.isPending}
            disabled={!socialAccountId || !text.trim()}
          >
            <Send className="h-4 w-4" />
            Send to inbox
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WebhookActivity() {
  const { data } = useQuery({
    queryKey: queryKeys.webhookEvents(1),
    queryFn: () => get<Array<{ id: string; platform: string; status: string; receivedAt: string; error: string | null }>>(
      '/integrations/webhook-events',
      { page: 1, pageSize: 8 },
    ),
  });

  if (!data?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent webhook activity</CardTitle>
        <CardDescription>The last events Meta delivered to this workspace.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {data.map((event) => (
            <div key={event.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
              <Badge variant={STATUS_VARIANTS[event.status] ?? 'secondary'} className="shrink-0">
                {event.status.toLowerCase()}
              </Badge>
              <span className="text-muted-foreground">{event.platform?.toLowerCase() ?? 'meta'}</span>
              {event.error ? (
                <span className="min-w-0 flex-1 truncate text-xs text-destructive">{event.error}</span>
              ) : (
                <span className="flex-1" />
              )}
              <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(event.receivedAt)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
