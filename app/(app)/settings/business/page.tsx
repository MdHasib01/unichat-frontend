'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, Save, Tag as TagIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, patch, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Label,
  Skeleton,
  Switch,
  Textarea,
} from '@/components/ui/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/overlays';
import type { BusinessHourRule, Tag } from '@/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'BDT', 'INR', 'PKR', 'NGN', 'AED', 'SGD', 'JPY'];

const DEFAULT_HOURS: BusinessHourRule[] = DAY_NAMES.map((_, day) => ({
  day,
  open: '09:00',
  close: '18:00',
  enabled: day >= 1 && day <= 5,
}));

export default function BusinessSettingsPage() {
  const queryClient = useQueryClient();
  const { session, can, refresh } = useSession();
  const readOnly = !can('settings.manage');

  const [form, setForm] = React.useState({
    name: '',
    description: '',
    industry: '',
    website: '',
    timezone: 'UTC',
    currency: 'USD',
  });
  const [hours, setHours] = React.useState<BusinessHourRule[]>(DEFAULT_HOURS);

  React.useEffect(() => {
    const organization = session?.organization;
    if (!organization) return;
    setForm({
      name: organization.name,
      description: organization.description ?? '',
      industry: organization.industry ?? '',
      website: organization.website ?? '',
      timezone: organization.timezone,
      currency: organization.currency,
    });
    if (organization.businessHours?.length) setHours(organization.businessHours);
  }, [session?.organization]);

  const save = useMutation({
    mutationFn: () =>
      patch('/organization', {
        name: form.name.trim(),
        description: form.description.trim() || null,
        industry: form.industry.trim() || null,
        website: form.website.trim() || null,
        timezone: form.timezone,
        currency: form.currency,
        businessHours: hours,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
      refresh();
      toast.success('Settings saved');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!session?.organization) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Business details</CardTitle>
          <CardDescription>
            Used across the app, in automated replies and by your AI assistant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FormField label="Business name" required>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              disabled={readOnly}
            />
          </FormField>

          <FormField
            label="Description"
            hint="A short explanation of what you do — the assistant uses this to introduce you."
          >
            <Textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              disabled={readOnly}
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Industry">
              <Input
                value={form.industry}
                onChange={(event) => setForm({ ...form, industry: event.target.value })}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Website">
              <Input
                type="url"
                value={form.website}
                onChange={(event) => setForm({ ...form, website: event.target.value })}
                placeholder="https://yourbusiness.com"
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Timezone">
              <Select
                value={form.timezone}
                onValueChange={(timezone) => setForm({ ...form, timezone })}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set([form.timezone, ...TIMEZONES])).map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Currency">
              <Select
                value={form.currency}
                onValueChange={(currency) => setForm({ ...form, currency })}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set([form.currency, ...CURRENCIES])).map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Business hours
          </CardTitle>
          <CardDescription>
            Automations and the AI assistant can behave differently inside and outside these hours.
            They are evaluated in {form.timezone.replace(/_/g, ' ')}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {hours.map((rule) => (
            <div
              key={rule.day}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2"
            >
              <Switch
                checked={rule.enabled}
                onCheckedChange={(enabled) =>
                  setHours(hours.map((h) => (h.day === rule.day ? { ...h, enabled } : h)))
                }
                disabled={readOnly}
                aria-label={`${DAY_NAMES[rule.day]} open`}
              />
              <Label className="w-24 shrink-0 text-sm">{DAY_NAMES[rule.day]}</Label>

              {rule.enabled ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={rule.open}
                    onChange={(event) =>
                      setHours(
                        hours.map((h) => (h.day === rule.day ? { ...h, open: event.target.value } : h)),
                      )
                    }
                    disabled={readOnly}
                    className="h-8 w-28"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={rule.close}
                    onChange={(event) =>
                      setHours(
                        hours.map((h) => (h.day === rule.day ? { ...h, close: event.target.value } : h)),
                      )
                    }
                    disabled={readOnly}
                    className="h-8 w-28"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Closed</span>
              )}
            </div>
          ))}

          {!readOnly ? (
            <Button onClick={() => save.mutate()} loading={save.isPending} className="mt-2">
              <Save className="h-4 w-4" />
              Save settings
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Your role can view these settings but not change them.
            </p>
          )}
        </CardContent>
      </Card>

      <TagsCard readOnly={readOnly} />
    </div>
  );
}

function TagsCard({ readOnly }: { readOnly: boolean }) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState('#6366f1');

  const { data: tags } = useQuery({ queryKey: queryKeys.tags, queryFn: () => get<Tag[]>('/tags') });

  const create = useMutation({
    mutationFn: () => post('/tags', { name: name.trim(), color }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tags });
      setName('');
      toast.success('Tag created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del(`/tags/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tags });
      toast.success('Tag deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-primary" />
          Tags
        </CardTitle>
        <CardDescription>
          Label conversations and customers so your team can filter the inbox quickly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {tags?.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
            >
              {tag.name}
              <span className="opacity-60">
                {(tag._count?.conversations ?? 0) + (tag._count?.contacts ?? 0)}
              </span>
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() => remove.mutate(tag.id)}
                  className="opacity-60 transition-opacity hover:opacity-100"
                  aria-label={`Delete ${tag.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              ) : null}
            </span>
          ))}
          {!tags?.length ? <p className="text-sm text-muted-foreground">No tags yet.</p> : null}
        </div>

        {!readOnly ? (
          <div className="flex flex-wrap items-end gap-2">
            <FormField label="New tag" className="flex-1 min-w-[10rem]">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Wholesale"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && name.trim()) create.mutate();
                }}
              />
            </FormField>

            <FormField label="Colour">
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-9 w-14 cursor-pointer rounded-lg border border-input bg-card p-1"
              />
            </FormField>

            <Button onClick={() => create.mutate()} loading={create.isPending} disabled={!name.trim()}>
              <Plus className="h-4 w-4" />
              Add tag
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
