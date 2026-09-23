'use client';

import * as React from 'react';
import { Bell, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from '@/components/ui/primitives';

/**
 * Per-browser notification preferences.
 *
 * These control what this browser surfaces (toasts, desktop notifications).
 * The in-app notification feed itself is server-side and always records
 * everything, so nothing is lost when a preference is off.
 */
const PREFERENCE_KEY = 'unichat:notification-preferences';

interface Preferences {
  newMessage: boolean;
  assignedToMe: boolean;
  aiHandoff: boolean;
  integrationErrors: boolean;
  newOrders: boolean;
  desktop: boolean;
}

const DEFAULTS: Preferences = {
  newMessage: true,
  assignedToMe: true,
  aiHandoff: true,
  integrationErrors: true,
  newOrders: true,
  desktop: false,
};

const OPTIONS: Array<{ key: keyof Preferences; label: string; description: string }> = [
  {
    key: 'newMessage',
    label: 'New customer messages',
    description: 'A toast when a message arrives in this workspace.',
  },
  {
    key: 'assignedToMe',
    label: 'Conversations assigned to me',
    description: 'When a teammate hands you a conversation.',
  },
  {
    key: 'aiHandoff',
    label: 'AI handoffs',
    description: 'When the assistant pauses and asks for a person.',
  },
  {
    key: 'integrationErrors',
    label: 'Channel problems',
    description: 'When a connected channel stops delivering or sending.',
  },
  { key: 'newOrders', label: 'New orders', description: 'When an order is created in this workspace.' },
];

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = React.useState<Preferences>(DEFAULTS);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PREFERENCE_KEY);
      if (stored) setPreferences({ ...DEFAULTS, ...(JSON.parse(stored) as Partial<Preferences>) });
    } catch {
      /* storage may be unavailable */
    }
    setHydrated(true);
  }, []);

  const update = (key: keyof Preferences, value: boolean) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    try {
      window.localStorage.setItem(PREFERENCE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const requestDesktop = async (enabled: boolean) => {
    if (!enabled) {
      update('desktop', false);
      return;
    }
    if (typeof Notification === 'undefined') {
      toast.error('This browser does not support desktop notifications');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      update('desktop', true);
      toast.success('Desktop notifications enabled');
    } else {
      toast.error('Your browser blocked desktop notifications');
    }
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            What you get notified about
          </CardTitle>
          <CardDescription>
            These preferences apply to this browser. The notification list in the top bar always
            records everything, whatever you choose here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {OPTIONS.map((option) => (
            <label
              key={option.key}
              className="flex items-start justify-between gap-4 rounded-lg border border-border p-3"
            >
              <span>
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.description}</span>
              </span>
              <Switch
                checked={preferences[option.key]}
                onCheckedChange={(value) => update(option.key, value)}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desktop notifications</CardTitle>
          <CardDescription>
            Show a system notification even when Unichat is in a background tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
            <span>
              <span className="block text-sm font-medium">Enable desktop notifications</span>
              <span className="block text-xs text-muted-foreground">
                Your browser will ask for permission once.
              </span>
            </span>
            <Switch checked={preferences.desktop} onCheckedChange={requestDesktop} />
          </label>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Email notifications are delivered by the notification worker once an SMTP provider is
            configured on the server. Until then, notifications appear in the app and in this
            browser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
