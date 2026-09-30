import Link from 'next/link';
import { Bot, Inbox, ShieldCheck, Users, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LegalValue } from '@/components/legal/placeholder';
import { SignedInRedirect } from '@/components/legal/signed-in-redirect';
import { LEGAL } from '@/lib/legal';

/**
 * Public home page. Meta's Business Verification and App Review both visit
 * the website URL, so it describes the business plainly — what the product
 * does, who runs it and how to reach them — with no invented claims.
 */

const P = LEGAL.productName;

const FEATURES = [
  {
    icon: Inbox,
    title: 'One shared inbox',
    body: 'Messages sent to your Facebook Page, Instagram Professional account, WhatsApp Business number and website chat arrive in one place, and your replies go back through the same channel.',
  },
  {
    icon: Workflow,
    title: 'Automations',
    body: 'Rules that greet new customers, tag and assign conversations, and follow up when a conversation goes quiet, all within each platform’s messaging rules.',
  },
  {
    icon: Bot,
    title: 'Optional AI assistant',
    body: 'Suggests or sends replies based only on the knowledge you give it. You decide whether it answers automatically, and you can switch it off per conversation.',
  },
  {
    icon: Users,
    title: 'Built for teams',
    body: 'Assign conversations, leave internal notes, keep contact history, orders and call records next to each customer, and control access with roles.',
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <SignedInRedirect />

      <section className="py-6 text-center sm:py-12">
        <h1 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          One inbox for every customer conversation
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {P} brings Facebook Messenger, Instagram Direct, WhatsApp Business and your website chat
          into a single shared inbox, so your team can answer every customer quickly without switching
          apps.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Create a workspace</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="features" className="mt-6">
        <h2 id="features" className="sr-only">
          Features
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-border bg-card p-5 shadow-card">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-4 w-4" aria-hidden />
              </span>
              <h3 className="mt-3 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-lg border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">Your accounts, your control</h2>
            <p className="mt-1">
              You connect only the Facebook Pages, Instagram accounts and WhatsApp numbers you manage,
              through Meta’s official APIs, and you can disconnect them at any time. We use the access
              you grant only to run your inbox, and we never sell your data or use it for advertising.
              Read our <Link href="/meta" className="font-medium text-primary hover:underline">Meta Integration Disclosure</Link>,{' '}
              <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link> and{' '}
              <Link href="/data-deletion" className="font-medium text-primary hover:underline">Data Deletion Instructions</Link>.
            </p>
            <p className="mt-2 text-xs">
              {P} is an independent product and is not affiliated with or endorsed by Meta Platforms, Inc.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">About {LEGAL.operatorName}</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            {P} is built and operated by {LEGAL.operatorName}.
          </p>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            <LegalValue value={LEGAL.registeredAddress} label="REGISTERED ADDRESS" />
          </p>
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Support, privacy and data deletion:{' '}
            <a href={`mailto:${LEGAL.supportEmail}`} className="font-medium text-primary hover:underline">
              {LEGAL.supportEmail}
            </a>
          </p>
          <p className="mt-2">
            <Link href="/contact" className="font-medium text-primary hover:underline">
              All contact options →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
