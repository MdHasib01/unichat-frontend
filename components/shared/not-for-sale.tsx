'use client';

import Link from 'next/link';
import { ArrowLeft, Crown, Lock, Mail } from 'lucide-react';
import { PageContainer } from '@/components/layout/app-shell';
import { BrandName } from '@/components/brand-provider';
import { Button } from '@/components/ui/button';
import { Badge, Card } from '@/components/ui/primitives';
import { CROWN_SERVICES } from '@/lib/navigation';
import { LEGAL } from '@/lib/legal';

/**
 * Landing page for a crown-marked module (spec sections 29 and 48).
 *
 * The route stays reachable and does not break navigation, but the module has
 * no business functionality, no API calls and no fabricated data — just an
 * honest availability notice.
 */
export function NotForSale({ route }: { route: keyof typeof CROWN_SERVICES | string }) {
  const service = CROWN_SERVICES[route] ?? {
    title: 'Coming soon',
    description: 'This module is on the roadmap.',
  };

  return (
    <PageContainer className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <Card className="overflow-hidden">
        <div className="relative border-b border-border bg-gradient-to-br from-warning/10 via-card to-card px-6 py-10 text-center sm:px-10">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
            <Crown className="h-7 w-7" />
          </span>

          <Badge variant="warning" className="mb-3">
            <Lock className="h-3 w-3" />
            Not available for sale
          </Badge>

          <h1 className="text-2xl font-semibold tracking-tight">{service.title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{service.description}</p>
        </div>

        <div className="space-y-4 p-6 sm:p-8">
          <div className="rounded-lg border border-border bg-secondary/50 p-4 text-sm">
            <p className="font-medium">Why you can see this</p>
            <p className="mt-1 text-muted-foreground">
              <BrandName /> keeps upcoming modules visible in the sidebar so you know what is planned, but
              this one is not being sold yet and has no functionality in your workspace. Nothing here
              is connected to your data, and nothing is simulated to look like it works.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4 text-sm">
            <p className="font-medium">What you can use today</p>
            <p className="mt-1 text-muted-foreground">
              Your unified inbox, channel integrations, sales (orders, products, parcels), call
              records, AI training and insights are all fully available.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/inbox">Open inbox</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/ai-training/setup">AI setup</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/analytics">Insights</Link>
              </Button>
            </div>
          </div>

          <Button asChild className="w-full sm:w-auto">
            <a
              href={`mailto:${LEGAL.supportEmail}?subject=${encodeURIComponent(`Interested in ${service.title}`)}`}
            >
              <Mail className="h-4 w-4" />
              Register your interest
            </a>
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}
