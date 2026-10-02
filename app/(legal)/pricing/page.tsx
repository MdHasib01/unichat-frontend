import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LEGAL } from '@/lib/legal';
import { getBrand } from '@/lib/brand-server';

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getBrand();
  return {
    title: 'Pricing',
    description: `${name} is free during beta. Paid plans will be announced in advance, before anyone is charged.`,
  };
}

/** Only what a workspace can actually use today — no invented tiers or prices. */
const INCLUDED = [
  'Shared inbox for Facebook Messenger, Instagram Direct, WhatsApp Business and website chat',
  'Team members with roles, assignments and internal notes',
  'Automations that reply inside customer conversations',
  'Optional AI assistant that answers from your own business knowledge',
  'Contacts, orders, products and call records next to each conversation',
];

export default async function PricingPage() {
  const { name: P } = await getBrand();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">Pricing</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Free during beta</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {P} is in beta, and every workspace can use it free of charge. We do not ask for payment
        details.
      </p>

      <section className="mt-8 rounded-lg border border-border bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-base font-semibold text-foreground">What the beta includes</h2>
        <ul className="mt-4 space-y-2.5">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Fair-use limits apply during beta, such as a monthly allowance of automatic AI replies. Your
          workspace’s current allowance is shown under Settings → Billing.
        </p>
        <Button asChild className="mt-6">
          <Link href="/register">Create a workspace</Link>
        </Button>
      </section>

      <section className="mt-8 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">Paid plans</h2>
        <p className="mt-2">
          Paid plans will be announced in advance. Before any plan becomes paid, we will publish its
          price on this page and notify workspace owners. Nobody is charged without first choosing a
          paid plan.
        </p>
        <p className="mt-2">
          Questions? Email{' '}
          <a href={`mailto:${LEGAL.supportEmail}`} className="font-medium text-primary hover:underline">
            {LEGAL.supportEmail}
          </a>{' '}
          or see our <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>.
        </p>
      </section>
    </div>
  );
}
