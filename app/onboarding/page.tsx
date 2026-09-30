'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Clock,
  Globe,
  Instagram,
  Loader2,
  MessageCircle,
  PartyPopper,
  Plug,
} from 'lucide-react';
import { toast } from 'sonner';
import { get, patch, post } from '@/services/api';
import { BrandName } from '@/components/brand-provider';
import { queryKeys } from '@/lib/query-keys';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  Checkbox,
  FormField,
  Input,
  Label,
  Separator,
  Switch,
  Textarea,
} from '@/components/ui/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/overlays';
import { BrandWordmark } from '@/components/shared/brand';
import { cn } from '@/lib/utils';
import type { AvailableAccounts, BusinessHourRule, IntegrationsPayload } from '@/types';

const INDUSTRIES = [
  'Retail & e-commerce',
  'Food & beverage',
  'Health & wellness',
  'Education',
  'Professional services',
  'Travel & hospitality',
  'Real estate',
  'Technology',
  'Other',
];

const TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Madrid',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Africa/Lagos',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Dhaka',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_HOURS: BusinessHourRule[] = DAY_NAMES.map((_, day) => ({
  day,
  open: '09:00',
  close: '18:00',
  enabled: day >= 1 && day <= 5,
}));

interface WizardState {
  name: string;
  description: string;
  industry: string;
  website: string;
  timezone: string;
  businessHours: BusinessHourRule[];
}

const STEPS = [
  { id: 1, label: 'Business name' },
  { id: 2, label: 'What you do' },
  { id: 3, label: 'Industry' },
  { id: 4, label: 'Website' },
  { id: 5, label: 'Business hours' },
  { id: 6, label: 'Timezone' },
  { id: 7, label: 'Connect Meta' },
  { id: 8, label: 'Facebook Pages' },
  { id: 9, label: 'Instagram' },
  { id: 10, label: 'WhatsApp' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, refresh } = useSession();

  const [step, setStep] = React.useState(1);
  const [state, setState] = React.useState<WizardState>({
    name: '',
    description: '',
    industry: '',
    website: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    businessHours: DEFAULT_HOURS,
  });

  // Prefill from whatever the workspace already knows.
  React.useEffect(() => {
    const organization = session?.organization;
    if (!organization) return;
    setState((current) => ({
      name: organization.name || current.name,
      description: organization.description ?? current.description,
      industry: organization.industry ?? current.industry,
      website: organization.website ?? current.website,
      timezone: organization.timezone || current.timezone,
      businessHours: organization.businessHours?.length ? organization.businessHours : current.businessHours,
    }));
    if (organization.onboardingStep > 0 && organization.onboardingStep < 10) {
      setStep(Math.min(organization.onboardingStep + 1, 10));
    }
  }, [session?.organization]);

  const saveStep = useMutation({
    mutationFn: (payload: Record<string, unknown>) => post('/organization/onboarding', payload),
    onError: (error: Error) => toast.error(error.message),
  });

  const finish = useMutation({
    mutationFn: () =>
      post('/organization/onboarding', {
        name: state.name,
        description: state.description || null,
        industry: state.industry || null,
        website: state.website || null,
        timezone: state.timezone,
        businessHours: state.businessHours,
        complete: true,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      refresh();
      toast.success('Your workspace is ready');
      router.replace('/dashboard');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const goNext = () => {
    const payload: Record<string, unknown> = { step };
    if (step === 1) payload.name = state.name;
    if (step === 2) payload.description = state.description || null;
    if (step === 3) payload.industry = state.industry || null;
    if (step === 4) payload.website = state.website || null;
    if (step === 5) payload.businessHours = state.businessHours;
    if (step === 6) payload.timezone = state.timezone;

    saveStep.mutate(payload);
    setStep((current) => Math.min(current + 1, 10));
  };

  const canContinue =
    step === 1 ? state.name.trim().length >= 2 : step === 3 ? Boolean(state.industry) : true;

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <BrandWordmark />
          <span className="text-xs text-muted-foreground">
            Step {step} of {STEPS.length}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <StepProgress current={step} />

        <Card className="mt-6">
          <div className="p-6 sm:p-8">
            {step === 1 ? (
              <StepShell
                icon={Building2}
                title="What's your business called?"
                description="This is the name your team sees, and the name used in automated replies."
              >
                <FormField label="Business name" required>
                  <Input
                    value={state.name}
                    onChange={(event) => setState({ ...state, name: event.target.value })}
                    placeholder="Acme Marketing"
                    autoFocus
                  />
                </FormField>
              </StepShell>
            ) : null}

            {step === 2 ? (
              <StepShell
                icon={Building2}
                title="What does your business do?"
                description="A short description helps your AI assistant introduce you accurately to customers."
              >
                <FormField label="Business description" hint="One or two sentences is plenty.">
                  <Textarea
                    rows={4}
                    value={state.description}
                    onChange={(event) => setState({ ...state, description: event.target.value })}
                    placeholder="We sell handmade leather bags and ship worldwide from Lisbon."
                    autoFocus
                  />
                </FormField>
              </StepShell>
            ) : null}

            {step === 3 ? (
              <StepShell
                icon={Building2}
                title="Which industry are you in?"
                description="We use this to suggest sensible automations and knowledge topics."
              >
                <FormField label="Industry" required>
                  <Select
                    value={state.industry}
                    onValueChange={(value) => setState({ ...state, industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </StepShell>
            ) : null}

            {step === 4 ? (
              <StepShell
                icon={Globe}
                title="Where can customers find you?"
                description="Optional — but useful when the assistant needs to point someone to your site."
              >
                <FormField label="Website">
                  <Input
                    type="url"
                    value={state.website}
                    onChange={(event) => setState({ ...state, website: event.target.value })}
                    placeholder="https://yourbusiness.com"
                    autoFocus
                  />
                </FormField>
              </StepShell>
            ) : null}

            {step === 5 ? (
              <StepShell
                icon={Clock}
                title="When are you open?"
                description="Automations and the AI assistant can behave differently inside and outside these hours."
              >
                <BusinessHoursEditor
                  value={state.businessHours}
                  onChange={(businessHours) => setState({ ...state, businessHours })}
                />
              </StepShell>
            ) : null}

            {step === 6 ? (
              <StepShell
                icon={Clock}
                title="Which timezone should we use?"
                description="Response times, reports and business hours are all shown in this timezone."
              >
                <FormField label="Timezone">
                  <Select
                    value={state.timezone}
                    onValueChange={(value) => setState({ ...state, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set([state.timezone, ...TIMEZONES])).map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </StepShell>
            ) : null}

            {step >= 7 ? <ChannelSteps step={step} /> : null}
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-3 p-4 sm:px-8">
            <Button
              variant="ghost"
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              {step >= 7 && step < 10 ? (
                <Button variant="ghost" onClick={() => setStep(10)}>
                  Skip channels for now
                </Button>
              ) : null}

              {step < 10 ? (
                <Button onClick={goNext} disabled={!canContinue}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => finish.mutate()} loading={finish.isPending}>
                  <PartyPopper className="h-4 w-4" />
                  Finish setup
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StepProgress({ current }: { current: number }) {
  return (
    <div>
      <div className="flex items-center gap-1">
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              step.id <= current ? 'bg-primary' : 'bg-border',
            )}
          />
        ))}
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">
        {STEPS.find((s) => s.id === current)?.label}
      </p>
    </div>
  );
}

function StepShell({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function BusinessHoursEditor({
  value,
  onChange,
}: {
  value: BusinessHourRule[];
  onChange: (value: BusinessHourRule[]) => void;
}) {
  const update = (day: number, patchValue: Partial<BusinessHourRule>) => {
    onChange(value.map((rule) => (rule.day === day ? { ...rule, ...patchValue } : rule)));
  };

  return (
    <div className="space-y-2">
      {value.map((rule) => (
        <div
          key={rule.day}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2"
        >
          <Switch
            checked={rule.enabled}
            onCheckedChange={(enabled) => update(rule.day, { enabled })}
            aria-label={`${DAY_NAMES[rule.day]} open`}
          />
          <Label className="w-24 shrink-0 text-sm">{DAY_NAMES[rule.day]}</Label>

          {rule.enabled ? (
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={rule.open}
                onChange={(event) => update(rule.day, { open: event.target.value })}
                className="h-8 w-28"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="time"
                value={rule.close}
                onChange={(event) => update(rule.day, { close: event.target.value })}
                className="h-8 w-28"
              />
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Closed</span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Steps 7–10: connect Meta, then pick Pages, Instagram accounts and WhatsApp
 * numbers. In mock mode the connect button uses the local mock endpoint so the
 * whole flow is walkable without Meta credentials.
 */
function ChannelSteps({ step }: { step: number }) {
  const queryClient = useQueryClient();

  const { data: integrations } = useQuery({
    queryKey: queryKeys.integrations,
    queryFn: () => get<IntegrationsPayload>('/integrations'),
  });

  const [available, setAvailable] = React.useState<AvailableAccounts | null>(null);
  const [selectedPages, setSelectedPages] = React.useState<Record<string, boolean>>({});
  const [selectedInstagram, setSelectedInstagram] = React.useState<Record<string, boolean>>({});
  const [selectedWhatsApp, setSelectedWhatsApp] = React.useState<Record<string, boolean>>({});

  const connected = integrations?.meta?.status === 'CONNECTED';
  const mockMode = integrations?.mockMode ?? false;

  const connect = useMutation({
    mutationFn: async () => {
      if (mockMode) return post<AvailableAccounts>('/integrations/meta/mock-connect');
      const result = await post<{ url: string }>('/integrations/meta/connect');
      window.location.href = result.url;
      return null;
    },
    onSuccess: (result) => {
      if (result) {
        setAvailable(result);
        void queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
        toast.success('Demo channels are ready to select');
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const loadAccounts = useMutation({
    mutationFn: () => get<AvailableAccounts>('/integrations/meta/accounts'),
    onSuccess: setAvailable,
    onError: (error: Error) => toast.error(error.message),
  });

  const saveSelection = useMutation({
    mutationFn: () =>
      post('/integrations/meta/accounts', {
        pages: Object.entries(selectedPages)
          .filter(([, checked]) => checked)
          .map(([externalId]) => ({
            externalId,
            connectInstagram: Boolean(selectedInstagram[externalId]),
          })),
        whatsapp: Object.entries(selectedWhatsApp)
          .filter(([, checked]) => checked)
          .map(([externalId]) => {
            const number = available?.availableWhatsApp.find((w) => w.externalId === externalId);
            return { externalId, wabaId: number?.wabaId ?? '' };
          }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
      toast.success('Channels connected');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  React.useEffect(() => {
    if (connected && !available && step >= 8) loadAccounts.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, step]);

  if (step === 7) {
    return (
      <StepShell
        icon={Plug}
        title="Connect your Meta account"
        description="We use Meta's official APIs to receive and send messages. Your access tokens are encrypted and never leave the server."
      >
        {connected ? (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3.5 text-sm">
            <Check className="h-4 w-4 text-success" />
            <span>
              Connected as <strong>{integrations?.meta?.displayName}</strong>
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {mockMode ? (
              <div className="rounded-lg border border-dashed border-border bg-secondary/50 p-3.5 text-sm text-muted-foreground">
                <Badge variant="warning" className="mb-2">
                  Mock mode
                </Badge>
                <p>
                  No Meta app is configured, so <BrandName /> will connect demo channels instead. Every
                  other part of the product — inbox, automations, AI — works exactly the same.
                </p>
              </div>
            ) : null}

            <Button onClick={() => connect.mutate()} loading={connect.isPending}>
              <Plug className="h-4 w-4" />
              {mockMode ? 'Connect demo channels' : 'Continue with Meta'}
            </Button>
          </div>
        )}
      </StepShell>
    );
  }

  if (!connected) {
    return (
      <StepShell
        icon={Plug}
        title="Connect Meta first"
        description="Go back a step and connect your Meta account to choose which channels to bring into your inbox."
      >
        <p className="text-sm text-muted-foreground">
          You can also skip this for now and connect channels later from the Integrations page.
        </p>
      </StepShell>
    );
  }

  if (loadAccounts.isPending && !available) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your Meta accounts…
      </div>
    );
  }

  if (step === 8) {
    return (
      <StepShell
        icon={Plug}
        title="Choose your Facebook Pages"
        description="Messages sent to these Pages will arrive in your inbox."
      >
        <div className="space-y-2">
          {available?.availablePages.length ? (
            available.availablePages.map((page) => (
              <label
                key={page.externalId}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary"
              >
                <Checkbox
                  checked={Boolean(selectedPages[page.externalId])}
                  onCheckedChange={(checked) =>
                    setSelectedPages({ ...selectedPages, [page.externalId]: checked === true })
                  }
                />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{page.name}</span>
                  {page.category ? (
                    <span className="block text-xs text-muted-foreground">{page.category}</span>
                  ) : null}
                </span>
              </label>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No Pages were returned by Meta for this account.
            </p>
          )}
        </div>

        <Button
          className="mt-4"
          variant="outline"
          onClick={() => saveSelection.mutate()}
          loading={saveSelection.isPending}
          disabled={!Object.values(selectedPages).some(Boolean)}
        >
          Save selection
        </Button>
      </StepShell>
    );
  }

  if (step === 9) {
    const pagesWithInstagram = available?.availablePages.filter((p) => p.instagram) ?? [];

    return (
      <StepShell
        icon={Instagram}
        title="Connect Instagram accounts"
        description="Instagram Direct runs through the linked Facebook Page. It needs an Instagram professional account and Meta's instagram_manage_messages permission."
      >
        <div className="space-y-2">
          {pagesWithInstagram.length ? (
            pagesWithInstagram.map((page) => (
              <label
                key={page.externalId}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary"
              >
                <Checkbox
                  checked={Boolean(selectedInstagram[page.externalId])}
                  onCheckedChange={(checked) =>
                    setSelectedInstagram({ ...selectedInstagram, [page.externalId]: checked === true })
                  }
                />
                <span className="flex-1">
                  <span className="block text-sm font-medium">
                    {page.instagram?.name ?? page.instagram?.username}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    @{page.instagram?.username} · via {page.name}
                  </span>
                </span>
              </label>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              None of your Pages has a linked Instagram professional account.
            </p>
          )}
        </div>

        <Button
          className="mt-4"
          variant="outline"
          onClick={() => saveSelection.mutate()}
          loading={saveSelection.isPending}
          disabled={!Object.values(selectedInstagram).some(Boolean)}
        >
          Save selection
        </Button>
      </StepShell>
    );
  }

  return (
    <StepShell
      icon={MessageCircle}
      title="Connect WhatsApp Business"
      description="WhatsApp allows free-form replies within 24 hours of a customer's message; outside that window an approved template is required."
    >
      <div className="space-y-2">
        {available?.availableWhatsApp.length ? (
          available.availableWhatsApp.map((number) => (
            <label
              key={number.externalId}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary"
            >
              <Checkbox
                checked={Boolean(selectedWhatsApp[number.externalId])}
                onCheckedChange={(checked) =>
                  setSelectedWhatsApp({ ...selectedWhatsApp, [number.externalId]: checked === true })
                }
              />
              <span className="flex-1">
                <span className="block text-sm font-medium">{number.displayPhoneNumber}</span>
                <span className="block text-xs text-muted-foreground">{number.verifiedName}</span>
              </span>
            </label>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No WhatsApp Business numbers are available on this Meta account. You can add them later
            from Integrations.
          </p>
        )}
      </div>

      {Object.values(selectedWhatsApp).some(Boolean) ? (
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => saveSelection.mutate()}
          loading={saveSelection.isPending}
        >
          Save selection
        </Button>
      ) : null}
    </StepShell>
  );
}
