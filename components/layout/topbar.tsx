'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Building2,
  Check,
  ChevronsUpDown,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { cn, initials, timeAgo } from '@/lib/utils';
import { get, getWithMeta, post } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Input,
  ScrollArea,
  Separator,
  Skeleton,
  UserAvatar,
} from '@/components/ui/primitives';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/overlays';
import { PlatformIcon } from '@/components/shared/platform';
import type { Conversation, Notification } from '@/types';

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/75 sm:px-4">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <OrganizationSwitcher />

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Organization switcher                                                       */
/* -------------------------------------------------------------------------- */

function OrganizationSwitcher() {
  const { session, switchOrganization, isSwitching } = useSession();
  const [open, setOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const active = session?.organization;
  const organizations = session?.organizations ?? [];

  if (!session) return <Skeleton className="h-9 w-44" />;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 max-w-[15rem] items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-sm font-medium transition-colors hover:bg-secondary"
            disabled={isSwitching}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
              {initials(active?.name)}
            </span>
            <span className="truncate">{active?.name ?? 'Select workspace'}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-72 p-1.5">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Workspaces
          </p>

          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            {organizations.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => {
                  if (org.id !== active?.id) switchOrganization(org.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-secondary',
                  org.id === active?.id && 'bg-secondary',
                )}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                  {initials(org.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{org.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {org.role.toLowerCase()} · {org.memberCount} member{org.memberCount === 1 ? '' : 's'}
                  </span>
                </span>
                {org.id === active?.id ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
              </button>
            ))}
          </div>

          <Separator className="my-1.5" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setCreateOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Create organization
          </button>
        </PopoverContent>
      </Popover>

      <CreateOrganizationDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function CreateOrganizationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = React.useState('');
  const { switchOrganization } = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => post<{ id: string }>('/organizations', { name }),
    onSuccess: (organization) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
      onOpenChange(false);
      setName('');
      switchOrganization(organization.id);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a workspace</DialogTitle>
          <DialogDescription>
            Each workspace has its own inbox, channels, customers, automations and team. Nothing is
            shared between them.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim().length >= 2) mutation.mutate();
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <label htmlFor="org-name" className="text-sm font-medium">
              Business name
            </label>
            <Input
              id="org-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Acme Marketing"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending} disabled={name.trim().length < 2}>
              <Building2 className="h-4 w-4" />
              Create workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Search                                                                      */
/* -------------------------------------------------------------------------- */

function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState('');
  const [debounced, setDebounced] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(timer);
  }, [term]);

  // Cmd/Ctrl+K opens search from anywhere in the app.
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () =>
      get<Conversation[]>('/conversations', { search: debounced, pageSize: 6, page: 1 }),
    enabled: open && debounced.length >= 2,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-1 hidden h-9 w-64 items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary md:flex xl:w-80"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search conversations…</span>
        <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-2xs font-medium">
          ⌘K
        </kbd>
      </button>

      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="h-4.5 w-4.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[12%] max-w-xl translate-y-0 gap-3 p-4" hideClose>
          <div className="flex items-center gap-2 rounded-lg border border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search customers, messages and conversations…"
              className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {debounced.length < 2 ? (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                Type at least two characters to search.
              </p>
            ) : isFetching ? (
              <div className="space-y-2 p-1">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.length ? (
              <div className="space-y-0.5">
                {data.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setTerm('');
                      router.push(`/inbox/${conversation.id}`);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-secondary"
                  >
                    <UserAvatar
                      name={conversation.contact.displayName}
                      src={conversation.contact.avatarUrl}
                      className="h-8 w-8"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {conversation.contact.displayName}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {conversation.lastMessagePreview ?? 'No messages yet'}
                      </span>
                    </span>
                    <PlatformIcon platform={conversation.platform} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                Nothing matched “{debounced}”.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                               */
/* -------------------------------------------------------------------------- */

function NotificationsMenu() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const { data } = useQuery({
    queryKey: queryKeys.notifications({ page: 1 }),
    queryFn: () => getWithMeta<Notification[]>('/notifications', { page: 1, pageSize: 12 }),
    refetchInterval: 60_000,
  });

  const markAll = useMutation({
    mutationFn: () => post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOne = useMutation({
    mutationFn: (id: string) => post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = (data?.meta?.unread as number | undefined) ?? 0;
  const notifications = data?.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative" aria-label="Notifications">
          <Bell className="h-4.5 w-4.5" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-2xs font-semibold text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              className="text-xs font-medium text-primary hover:underline"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const body = (
                  <div
                    className={cn(
                      'flex gap-2.5 px-3 py-2.5 transition-colors hover:bg-secondary',
                      !notification.readAt && 'bg-accent/40',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                        notification.readAt ? 'bg-transparent' : 'bg-primary',
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-snug">{notification.title}</span>
                      {notification.body ? (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {notification.body}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-2xs text-muted-foreground">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </span>
                  </div>
                );

                return notification.link ? (
                  <Link
                    key={notification.id}
                    href={notification.link}
                    onClick={() => {
                      setOpen(false);
                      if (!notification.readAt) markOne.mutate(notification.id);
                    }}
                    className="block"
                  >
                    {body}
                  </Link>
                ) : (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => !notification.readAt && markOne.mutate(notification.id)}
                    className="block w-full text-left"
                  >
                    {body}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/* Theme + profile                                                             */
/* -------------------------------------------------------------------------- */

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-8 w-8" />;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </Button>
  );
}

function ProfileMenu() {
  const { session, logout } = useSession();
  const user = session?.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ml-0.5 rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
          <UserAvatar
            name={user ? `${user.firstName} ${user.lastName}` : undefined}
            src={user?.avatarUrl}
            className="h-8 w-8"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="normal-case">
          <span className="block truncate text-sm font-medium text-foreground">
            {user ? `${user.firstName} ${user.lastName}`.trim() : 'Signed in'}
          </span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
          {session?.role ? (
            <Badge variant="secondary" className="mt-1.5 capitalize">
              {session.role.toLowerCase()}
            </Badge>
          ) : null}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/account/profile">
            <UserIcon className="h-4 w-4" />
            Your profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/business">
            <Settings className="h-4 w-4" />
            Workspace settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem destructive onSelect={() => logout()}>
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
