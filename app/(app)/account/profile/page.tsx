'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Building2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { patch } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';
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
  Skeleton,
  UserAvatar,
} from '@/components/ui/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/overlays';

const TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Africa/Lagos',
  'Asia/Dubai',
  'Asia/Dhaka',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { session, switchOrganization, refresh } = useSession();

  const [form, setForm] = React.useState({
    firstName: '',
    lastName: '',
    phone: '',
    avatarUrl: '',
    timezone: 'UTC',
  });

  React.useEffect(() => {
    if (!session?.user) return;
    setForm({
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      phone: session.user.phone ?? '',
      avatarUrl: session.user.avatarUrl ?? '',
      timezone: session.user.timezone,
    });
  }, [session?.user]);

  const save = useMutation({
    mutationFn: () =>
      patch('/me', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
        timezone: form.timezone,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
      refresh();
      toast.success('Profile updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!session?.user) return <Skeleton className="h-80 w-full" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
          <CardDescription>How you appear to your teammates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={`${form.firstName} ${form.lastName}`}
              src={form.avatarUrl || session.user.avatarUrl}
              className="h-16 w-16 text-lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{session.user.email}</p>
                {session.user.emailVerified ? (
                  <Badge variant="success" className="shrink-0">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="warning" className="shrink-0">
                    Unverified
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Member since {formatDate(session.user.createdAt)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="First name" required>
              <Input
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
              />
            </FormField>

            <FormField label="Last name">
              <Input
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
              />
            </FormField>

            <FormField label="Phone">
              <Input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="+1 555 0100"
              />
            </FormField>

            <FormField label="Timezone">
              <Select
                value={form.timezone}
                onValueChange={(timezone) => setForm({ ...form, timezone })}
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

            <FormField label="Avatar URL" className="sm:col-span-2">
              <Input
                type="url"
                value={form.avatarUrl}
                onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })}
                placeholder="https://example.com/you.jpg"
              />
            </FormField>
          </div>

          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!form.firstName.trim()}>
            <Save className="h-4 w-4" />
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Your workspaces
          </CardTitle>
          <CardDescription>
            You can belong to several businesses. Each one keeps its data entirely separate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {session.organizations.map((organization) => {
            const active = organization.id === session.organization?.id;
            return (
              <div
                key={organization.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                  {organization.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{organization.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {organization.role.toLowerCase()} · {organization.memberCount} member
                    {organization.memberCount === 1 ? '' : 's'}
                  </p>
                </div>
                {active ? (
                  <Badge variant="success">Current</Badge>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => switchOrganization(organization.id)}>
                    Switch
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
