'use client';

import { SessionProvider } from '@/hooks/use-session';

// Onboarding needs the session (to prefill the workspace) but not the app
// shell — the sidebar is not useful before setup is finished.
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
