'use client';

import * as React from 'react';
import { Crown, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandName } from '@/components/brand-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlays';
import { Badge } from '@/components/ui/primitives';
import { CROWN_SERVICES } from '@/lib/navigation';

interface CrownDialogContextValue {
  open: (href: string) => void;
}

const CrownDialogContext = React.createContext<CrownDialogContextValue>({ open: () => {} });

/**
 * Availability dialog for crown-marked modules (spec sections 29 and 48).
 *
 * These services are deliberately visible but not for sale yet, so the dialog
 * explains that honestly instead of showing a mock product.
 */
export function CrownDialogProvider({ children }: { children: React.ReactNode }) {
  const [href, setHref] = React.useState<string | null>(null);
  const service = href ? CROWN_SERVICES[href] : null;

  const value = React.useMemo(() => ({ open: (target: string) => setHref(target) }), []);

  return (
    <CrownDialogContext.Provider value={value}>
      {children}

      <Dialog open={Boolean(service)} onOpenChange={(next) => !next && setHref(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
                <Crown className="h-4.5 w-4.5" />
              </span>
              <Badge variant="warning">
                <Lock className="h-3 w-3" />
                Not available for sale
              </Badge>
            </div>
            <DialogTitle>{service?.title}</DialogTitle>
            <DialogDescription>{service?.description}</DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border bg-secondary/60 p-3.5 text-sm text-muted-foreground">
            This module is part of the <BrandName /> roadmap but is not being sold yet, so it has no
            functionality in your workspace today. Everything else in your sidebar — inbox,
            integrations, sales, calls, AI training and insights — is fully available.
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHref(null)}>
              Close
            </Button>
            <Button asChild>
              <a href="mailto:sales@unichat.app?subject=Interested%20in%20an%20upcoming%20Unichat%20module">
                <Mail className="h-4 w-4" />
                Tell us you&apos;re interested
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CrownDialogContext.Provider>
  );
}

export function useCrownDialog() {
  return React.useContext(CrownDialogContext);
}
