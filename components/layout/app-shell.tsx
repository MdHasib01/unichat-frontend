'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { get } from '@/services/api';
import { queryKeys } from '@/lib/query-keys';
import { useSession } from '@/hooks/use-session';
import { RealtimeProvider } from '@/hooks/use-realtime';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/overlays';
import { CrownDialogProvider } from './crown-dialog';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import type { ConversationCounts } from '@/types';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isLoading, isError, can } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Unread badge on the Inbox item.
  const { data: counts } = useQuery({
    queryKey: queryKeys.conversationCounts,
    queryFn: () => get<ConversationCounts>('/conversations/counts'),
    enabled: Boolean(session) && can('conversations.read'),
    refetchInterval: 60_000,
  });

  React.useEffect(() => {
    if (isError) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isError, pathname, router]);

  // Onboarding must finish before the rest of the product is usable.
  React.useEffect(() => {
    if (
      session?.organization &&
      !session.organization.onboardingComplete &&
      !pathname.startsWith('/onboarding')
    ) {
      router.replace('/onboarding');
    }
  }, [session, pathname, router]);

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading your workspace</span>
      </div>
    );
  }

  return (
    <CrownDialogProvider>
      <RealtimeProvider enabled>
        <div className="flex h-screen overflow-hidden bg-background">
          <div className="hidden lg:block">
            <Sidebar unreadCount={counts?.unread ?? 0} />
          </div>

          {/* Mobile drawer (spec section 29: responsive sidebar). */}
          <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <DialogContent
              hideClose
              className="left-0 top-0 h-screen max-h-screen w-64 max-w-[80vw] translate-x-0 translate-y-0 overflow-hidden rounded-none border-l-0 p-0"
            >
              <DialogTitle className="sr-only">Navigation</DialogTitle>
              <Sidebar
                unreadCount={counts?.unread ?? 0}
                forceExpanded
                onNavigate={() => setMobileNavOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </RealtimeProvider>
    </CrownDialogProvider>
  );
}

/** Standard page frame: title, description, actions, then content. */
export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 ${className}`}>{children}</div>;
}
