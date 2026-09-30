'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

/**
 * Sends a signed-in visitor from the public home page to the app.
 *
 * Uses fetch directly: the shared API client redirects to /login on a 401,
 * which would make the public page unreachable for signed-out visitors.
 */
export function SignedInRedirect({ to = '/dashboard' }: { to?: string }) {
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;

    const signedIn = async () => {
      const me = await fetch('/api/me', { credentials: 'include' });
      if (me.ok) return true;
      if (me.status !== 401) return false;
      // The 1-hour access cookie may have lapsed while the refresh cookie is
      // still valid — try one silent refresh before deciding.
      const refreshed = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      return refreshed.ok;
    };

    signedIn()
      .then((ok) => {
        if (ok && !cancelled) router.replace(to);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [router, to]);

  return null;
}
