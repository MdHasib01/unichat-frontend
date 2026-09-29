'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ImageUp,
  KeyRound,
  MessageCircle,
  MessageSquareText,
  CircleHelp,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiPost, del, get, patch, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { cn, timeAgo } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';
import { PageContainer } from '@/components/layout/app-shell';
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
  Label,
  Skeleton,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
import { ErrorState } from '@/components/shared/states';
import { WidgetPreview, type PreviewDraft } from './widget-preview';
import type { ChatWidget, PreChatField, PreChatMode } from '@/types';

type Draft = PreviewDraft & { name: string; isActive: boolean; allowedDomains: string };

function toDraft(widget: ChatWidget): Draft {
  return {
    name: widget.name,
    isActive: widget.isActive,
    allowedDomains: widget.allowedDomains.join('\n'),
    position: widget.position,
    offsetX: widget.offsetX,
    offsetY: widget.offsetY,
    primaryColor: widget.primaryColor,
    logoUrl: widget.logoUrl,
    launcherIcon: widget.launcherIcon,
    title: widget.title,
    subtitle: widget.subtitle,
    welcomeMessage: widget.welcomeMessage,
    inputPlaceholder: widget.inputPlaceholder,
    offlineMessage: widget.offlineMessage,
    showBranding: widget.showBranding,
    preChatMode: widget.preChatMode,
    preChatFields: widget.preChatFields,
  };
}

const COLOR_SWATCHES = ['#4f46e5', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#111827'];

const LAUNCHER_ICONS: Array<{ value: ChatWidget['launcherIcon']; label: string; icon: typeof MessageCircle }> = [
  { value: 'chat', label: 'Chat', icon: MessageCircle },
  { value: 'message', label: 'Message', icon: MessageSquareText },
  { value: 'help', label: 'Help', icon: CircleHelp },
];

const FIELD_LABELS: Record<PreChatField, string> = { name: 'Name', email: 'Email', phone: 'Phone' };

export function WidgetSettings({ widgetId }: { widgetId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can, session } = useSession();
  const manage = can('integrations.manage');

  const { data: widget, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.widget(widgetId),
    queryFn: () => get<ChatWidget>(`/integrations/webchat/${widgetId}`),
  });

  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [previewView, setPreviewView] = React.useState<'chat' | 'form'>('chat');
  const [previewOnline, setPreviewOnline] = React.useState(true);
  const [previewOpen, setPreviewOpen] = React.useState(true);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [confirmRotate, setConfirmRotate] = React.useState(false);

  React.useEffect(() => {
    if (widget) setDraft(toDraft(widget));
  }, [widget]);

  const dirty = Boolean(widget && draft && JSON.stringify(toDraft(widget)) !== JSON.stringify(draft));

  const update = (patchDraft: Partial<Draft>) => setDraft((current) => (current ? { ...current, ...patchDraft } : current));

  const onSaved = (saved: ChatWidget, message: string) => {
    queryClient.setQueryData(queryKeys.widget(widgetId), saved);
    void queryClient.invalidateQueries({ queryKey: queryKeys.widgets });
    toast.success(message);
  };

  const save = useMutation({
    mutationFn: () => {
      const { allowedDomains, ...rest } = draft!;
      return patch<ChatWidget>(`/integrations/webchat/${widgetId}`, {
        ...rest,
        subtitle: rest.subtitle?.trim() || null,
        welcomeMessage: rest.welcomeMessage?.trim() || null,
        offlineMessage: rest.offlineMessage?.trim() || null,
        allowedDomains: allowedDomains
          .split(/[\n,]/)
          .map((d) => d.trim())
          .filter(Boolean),
      });
    },
    onSuccess: (saved) => onSaved(saved, 'Website chat saved — open widgets update instantly'),
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const response = await apiPost<ChatWidget>(`/integrations/webchat/${widgetId}/logo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (saved) => {
      update({ logoUrl: saved.logoUrl });
      onSaved(saved, 'Logo uploaded');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rotate = useMutation({
    mutationFn: () => post<ChatWidget>(`/integrations/webchat/${widgetId}/rotate-key`),
    onSuccess: (saved) => {
      setConfirmRotate(false);
      onSaved(saved, 'New key issued — update the snippet on your website');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: () => del(`/integrations/webchat/${widgetId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.widgets });
      toast.success('Website chat removed. Past conversations stay in your inbox.');
      router.push('/integrations');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isError) {
    return (
      <PageContainer>
        <ErrorState title="Could not load this website chat" onRetry={() => void refetch()} />
      </PageContainer>
    );
  }

  if (isLoading || !widget || !draft) {
    return (
      <PageContainer>
        <Skeleton className="mb-4 h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <Skeleton className="h-[520px]" />
          <Skeleton className="h-[640px]" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/integrations"
            className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Integrations
          </Link>
          <h1 className="flex items-center gap-2 truncate text-xl font-semibold tracking-tight">
            {widget.name}
            {widget.lastSeenAt ? (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3" />
                Installed
              </Badge>
            ) : (
              <Badge variant="warning">Not installed</Badge>
            )}
          </h1>
        </div>
        {manage ? (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={draft.isActive} onCheckedChange={(isActive) => update({ isActive })} />
              {draft.isActive ? 'On' : 'Off'}
            </label>
            <Button variant="outline" disabled={!dirty} onClick={() => setDraft(toDraft(widget))}>
              Discard
            </Button>
            <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!dirty}>
              Save changes
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Tabs defaultValue={widget.lastSeenAt ? 'appearance' : 'install'}>
          <TabsList>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="prechat">Pre-chat form</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="install">Install</TabsTrigger>
          </TabsList>

          <fieldset disabled={!manage} className="contents">
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Look</CardTitle>
                  <CardDescription>Match your brand. Text on the colour switches between dark and light automatically.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField label="Colour">
                    <div className="flex flex-wrap items-center gap-2">
                      {COLOR_SWATCHES.map((color) => (
                        <button
                          key={color}
                          type="button"
                          aria-label={`Use ${color}`}
                          onClick={() => update({ primaryColor: color })}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition',
                            draft.primaryColor.toLowerCase() === color && 'ring-2 ring-foreground',
                          )}
                          style={{ backgroundColor: color }}
                        >
                          {draft.primaryColor.toLowerCase() === color ? <Check className="h-4 w-4 text-white" /> : null}
                        </button>
                      ))}
                      <input
                        type="color"
                        value={draft.primaryColor}
                        onChange={(e) => update({ primaryColor: e.target.value })}
                        className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
                        aria-label="Custom colour"
                      />
                      <Input
                        value={draft.primaryColor}
                        onChange={(e) => update({ primaryColor: e.target.value })}
                        className="h-8 w-28 font-mono text-xs"
                        maxLength={7}
                      />
                    </div>
                  </FormField>

                  <FormField label="Logo" hint="PNG, JPG or WebP, up to 1 MB. Shown in the chat header — and on the launcher if you pick “Logo”.">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-white"
                        style={{ backgroundColor: draft.primaryColor }}
                      >
                        {draft.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={draft.logoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <MessageCircle className="h-5 w-5" />
                        )}
                      </span>
                      <Button asChild variant="outline" size="sm" disabled={uploadLogo.isPending}>
                        <label className="cursor-pointer">
                          <ImageUp className="h-4 w-4" />
                          {uploadLogo.isPending ? 'Uploading…' : 'Upload'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadLogo.mutate(file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </Button>
                      {draft.logoUrl ? (
                        <Button variant="ghost" size="sm" onClick={() => update({ logoUrl: null, launcherIcon: draft.launcherIcon === 'logo' ? 'chat' : draft.launcherIcon })}>
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </FormField>

                  <FormField label="Launcher icon">
                    <div className="flex flex-wrap gap-2">
                      {LAUNCHER_ICONS.map(({ value, label, icon: Icon }) => (
                        <ChoiceButton key={value} active={draft.launcherIcon === value} onClick={() => update({ launcherIcon: value })}>
                          <Icon className="h-4 w-4" />
                          {label}
                        </ChoiceButton>
                      ))}
                      <ChoiceButton
                        active={draft.launcherIcon === 'logo'}
                        disabled={!draft.logoUrl}
                        onClick={() => update({ launcherIcon: 'logo' })}
                      >
                        <ImageUp className="h-4 w-4" />
                        Logo
                      </ChoiceButton>
                    </div>
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField label="Position" className="sm:col-span-1">
                      <Select value={draft.position} onValueChange={(position) => update({ position: position as Draft['position'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BOTTOM_RIGHT">Bottom right</SelectItem>
                          <SelectItem value="BOTTOM_LEFT">Bottom left</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Side spacing (px)">
                      <Input
                        type="number"
                        min={0}
                        max={200}
                        value={draft.offsetX}
                        onChange={(e) => update({ offsetX: clamp(e.target.valueAsNumber) })}
                      />
                    </FormField>
                    <FormField label="Bottom spacing (px)">
                      <Input
                        type="number"
                        min={0}
                        max={200}
                        value={draft.offsetY}
                        onChange={(e) => update({ offsetY: clamp(e.target.valueAsNumber) })}
                      />
                    </FormField>
                  </div>

                  <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 text-sm">
                    <span>
                      <span className="font-medium">Show “Powered by Unichat”</span>
                      <span className="block text-xs text-muted-foreground">A small line under the chat panel.</span>
                    </span>
                    <Switch checked={draft.showBranding} onCheckedChange={(showBranding) => update({ showBranding })} />
                  </label>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Text</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Name in Unichat" required hint="Only your team sees this.">
                    <Input value={draft.name} maxLength={80} onChange={(e) => update({ name: e.target.value })} />
                  </FormField>
                  <FormField label="Header title" required>
                    <Input value={draft.title} maxLength={60} onChange={(e) => update({ title: e.target.value })} />
                  </FormField>
                  <FormField label="Subtitle when online">
                    <Input value={draft.subtitle ?? ''} maxLength={120} onChange={(e) => update({ subtitle: e.target.value })} />
                  </FormField>
                  <FormField label="Message box placeholder" required>
                    <Input value={draft.inputPlaceholder} maxLength={80} onChange={(e) => update({ inputPlaceholder: e.target.value })} />
                  </FormField>
                  <FormField label="Welcome message" className="sm:col-span-2" hint="Shown as the first message. Leave empty to skip.">
                    <Textarea rows={2} value={draft.welcomeMessage ?? ''} maxLength={500} onChange={(e) => update({ welcomeMessage: e.target.value })} />
                  </FormField>
                  <FormField label="Away message" className="sm:col-span-2" hint="Shown outside the business hours set in Settings → Business.">
                    <Textarea rows={2} value={draft.offlineMessage ?? ''} maxLength={500} onChange={(e) => update({ offlineMessage: e.target.value })} />
                  </FormField>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prechat">
              <Card>
                <CardHeader>
                  <CardTitle>Pre-chat form</CardTitle>
                  <CardDescription>
                    Ask visitors to introduce themselves before chatting. Their details are saved on the
                    contact in Unichat.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(
                      [
                        { value: 'OFF', title: 'Off', text: 'Visitors chat right away, anonymously.' },
                        { value: 'OPTIONAL', title: 'Optional', text: 'Asked first, but they can skip it.' },
                        { value: 'REQUIRED', title: 'Required', text: 'They must fill it in before chatting.' },
                      ] as Array<{ value: PreChatMode; title: string; text: string }>
                    ).map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => {
                          update({ preChatMode: mode.value });
                          setPreviewView(mode.value === 'OFF' ? 'chat' : 'form');
                        }}
                        className={cn(
                          'rounded-lg border p-3 text-left transition-colors',
                          draft.preChatMode === mode.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary',
                        )}
                      >
                        <p className="text-sm font-medium">{mode.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{mode.text}</p>
                      </button>
                    ))}
                  </div>

                  {draft.preChatMode !== 'OFF' ? (
                    <FormField label="Fields to ask for">
                      <div className="flex flex-wrap gap-4">
                        {(Object.keys(FIELD_LABELS) as PreChatField[]).map((field) => (
                          <label key={field} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={draft.preChatFields.includes(field)}
                              onCheckedChange={(checked) =>
                                update({
                                  preChatFields: checked
                                    ? (Object.keys(FIELD_LABELS) as PreChatField[]).filter(
                                        (f) => f === field || draft.preChatFields.includes(f),
                                      )
                                    : draft.preChatFields.filter((f) => f !== field),
                                })
                              }
                            />
                            {FIELD_LABELS[field]}
                          </label>
                        ))}
                      </div>
                    </FormField>
                  ) : null}
                  {draft.preChatMode !== 'OFF' && draft.preChatFields.length === 0 ? (
                    <p className="text-xs text-warning">Pick at least one field, or turn the form off.</p>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Allowed websites</CardTitle>
                  <CardDescription>
                    Limit which websites can load this chat. Leave empty to allow any site. One domain per
                    line — <code className="font-mono text-xs">*.example.com</code> covers all subdomains and
                    example.com itself.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={5}
                    value={draft.allowedDomains}
                    onChange={(e) => update({ allowedDomains: e.target.value })}
                    placeholder={'example.com\n*.example.com'}
                    className="font-mono text-sm"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    The widget key is public — it ships inside your website. This list stops other sites from
                    embedding your chat; visitor messages are also rate limited.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </fieldset>

          <TabsContent value="install" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add it to your website</CardTitle>
                <CardDescription>
                  Paste this just before <code className="font-mono text-xs">&lt;/body&gt;</code> on every page —
                  or in your site builder’s “custom code” / footer scripts setting (WordPress, Shopify, Webflow,
                  Wix all have one).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <CodeBlock code={widget.snippet} />
                <div className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
                  {widget.lastSeenAt ? (
                    <>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>
                        Working — last loaded on <strong>{widget.lastSeenOrigin ?? 'your website'}</strong>{' '}
                        {timeAgo(widget.lastSeenAt)}.
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      Waiting for the first visit. Open your website after adding the snippet — this turns green
                      within a minute.
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Control it from your own code (optional)</CardTitle>
                <CardDescription>For single-page apps or custom “Chat with us” buttons.</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  code={`// Open, close or toggle the chat
Unichat('open');
Unichat('close');

// Hide the bubble on pages where you don't want it
Unichat('hide');

// Already know who the visitor is? Skip the pre-chat form.
Unichat('identify', { name: 'Jane Doe', email: 'jane@example.com' });`}
                />
              </CardContent>
            </Card>

            {manage ? (
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle>Danger zone</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setConfirmRotate(true)}>
                    <KeyRound className="h-4 w-4" />
                    Issue a new key
                  </Button>
                  <Button variant="outline" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="h-4 w-4" />
                    Delete website chat
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>

        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Live preview</Label>
            <div className="flex flex-wrap gap-1">
              <ChoiceButton small active={previewOpen && previewView === 'chat'} onClick={() => { setPreviewOpen(true); setPreviewView('chat'); }}>
                Chat
              </ChoiceButton>
              <ChoiceButton
                small
                active={previewOpen && previewView === 'form'}
                disabled={draft.preChatMode === 'OFF'}
                onClick={() => { setPreviewOpen(true); setPreviewView('form'); }}
              >
                Form
              </ChoiceButton>
              <ChoiceButton small active={!previewOpen} onClick={() => setPreviewOpen(false)}>
                Closed
              </ChoiceButton>
              <ChoiceButton small active={!previewOnline} onClick={() => setPreviewOnline((v) => !v)}>
                Away
              </ChoiceButton>
            </div>
          </div>
          <WidgetPreview
            draft={draft}
            businessName={session?.organization?.name ?? ''}
            view={draft.preChatMode === 'OFF' ? 'chat' : previewView}
            online={previewOnline}
            open={previewOpen}
          />
        </div>
      </div>

      <Dialog open={confirmRotate} onOpenChange={setConfirmRotate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue a new key?</DialogTitle>
            <DialogDescription>
              The current snippet stops working immediately. Replace it on your website with the new one.
              Visitors keep their chat history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRotate(false)}>
              Cancel
            </Button>
            <Button onClick={() => rotate.mutate()} loading={rotate.isPending}>
              Issue new key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{widget.name}”?</DialogTitle>
            <DialogDescription>
              The chat disappears from your website. Conversations it started stay in your inbox.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => remove.mutate()} loading={remove.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function clamp(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(200, Math.max(0, Math.round(value)));
}

function ChoiceButton({
  active,
  small,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean; small?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        small ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary',
        className,
      )}
      {...props}
    />
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 pr-12 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute right-1.5 top-1.5"
        aria-label="Copy"
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          toast.success('Copied');
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
