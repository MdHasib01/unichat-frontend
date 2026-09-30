'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  ChevronDown,
  Inbox,
  LifeBuoy,
  Mail,
  Plug,
  Rocket,
  Search,
  ShoppingCart,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LEGAL } from '@/lib/legal';
import { useSession } from '@/hooks/use-session';
import { LegalFooter } from '@/components/legal/legal-footer';
import { useBrand } from '@/components/brand-provider';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui/primitives';

const GUIDES = [
  {
    icon: Rocket,
    title: 'Getting started',
    description: 'Set up your workspace, connect a channel and send your first reply.',
    steps: [
      'Finish onboarding so your workspace knows your business name, hours and timezone.',
      'Connect Meta from Integrations and pick the Pages, Instagram accounts and WhatsApp numbers you want.',
      'Invite your team and give each person a role that matches what they should be able to do.',
      'Add a welcome automation so first-time customers always get an answer.',
      'Teach the AI assistant your shipping, pricing and returns policies.',
    ],
    href: '/dashboard',
    cta: 'Open dashboard',
  },
  {
    icon: Plug,
    title: 'Integrations',
    description: 'Connecting Messenger, Instagram Direct and WhatsApp Business.',
    steps: [
      'All three channels run through one Meta connection — connect once, then choose accounts.',
      'Instagram Direct needs an Instagram professional account linked to a connected Facebook Page.',
      'WhatsApp allows free-form replies for 24 hours after a customer writes; outside that window an approved template is required.',
      'Some permissions need Meta app review. The Integrations page shows which ones rather than failing silently.',
      'If a channel shows an error, use Reconnect — the stored token may have expired.',
    ],
    href: '/integrations',
    cta: 'Manage channels',
  },
  {
    icon: Inbox,
    title: 'Using the inbox',
    description: 'Replying, assigning, tagging and resolving conversations.',
    steps: [
      'Filter by status, channel, assignment or tag using the controls above the conversation list.',
      'Press Enter to send and Shift+Enter for a new line.',
      'Use Note to leave something only your team can see — it is never sent to the customer.',
      'Assign a conversation to make it clear who is answering; the assignee gets a notification.',
      'Resolve a conversation when it is done. If the customer writes again it reopens automatically.',
    ],
    href: '/inbox',
    cta: 'Open inbox',
  },
  {
    icon: Bot,
    title: 'AI training',
    description: 'Teaching the assistant and deciding when it may answer.',
    steps: [
      'Add knowledge topics for shipping, pricing, returns, hours and your FAQs.',
      'The assistant answers only from what you add — it will not invent prices or policies.',
      'Set a confidence threshold. Below it, the assistant stays quiet and hands over to your team.',
      'Use the playground to test real customer questions before turning auto-reply on.',
      'Handoff keywords like "human" or "agent" pause the AI and alert your team immediately.',
    ],
    href: '/ai-training/setup',
    cta: 'Open AI setup',
  },
  {
    icon: Zap,
    title: 'Automations',
    description: 'Rules that handle the repetitive work for you.',
    steps: [
      'A rule is a trigger ("when this happens") plus actions ("then do this").',
      'Turn on "only once per customer" for welcome messages so returning customers are not greeted again.',
      'Use variables like {{first_name}} and {{business_name}} — they are filled in from the real customer.',
      'Add a Wait action to follow up later without keeping anyone waiting at their keyboard.',
      'Check the activity list to see exactly which rules ran and whether they succeeded.',
    ],
    href: '/automations',
    cta: 'Manage automations',
  },
  {
    icon: ShoppingCart,
    title: 'Sales',
    description: 'Orders, products and parcels next to the conversation.',
    steps: [
      'Add products first so orders can reference them and stock stays accurate.',
      'Create an order from a conversation to keep the customer history joined up.',
      'Add a parcel to an order to track it from created through to delivered.',
      'Import your product catalogue into the AI knowledge so the assistant can quote real prices.',
    ],
    href: '/sales/orders',
    cta: 'Open sales',
  },
  {
    icon: Users,
    title: 'Team and roles',
    description: 'Who can do what in your workspace.',
    steps: [
      'Owner has full control including billing. Admin has everything except billing.',
      'Manager can assign conversations, build automations and see analytics.',
      'Agent can reply to conversations and manage contacts.',
      'Roles are per workspace — someone can be an owner in one and an agent in another.',
    ],
    href: '/team',
    cta: 'Manage team',
  },
];

const FAQS = [
  {
    question: 'Can another business see my conversations?',
    answer:
      'No. Every request resolves your organization from the server-side session and checks your membership before any data is read. Conversations, customers, integrations, AI knowledge, automations and analytics are all scoped to one workspace and never combined.',
  },
  {
    question: 'Where are my Meta access tokens stored?',
    answer:
      'Encrypted with AES-256-GCM in your database. They are never sent to the browser and never written to the logs. Only the backend decrypts them, at the moment it calls Meta.',
  },
  {
    question: 'Why did my WhatsApp reply fail to send?',
    answer:
      'WhatsApp only allows free-form replies within 24 hours of the customer’s last message. Outside that window Meta requires an approved message template. The failure reason is shown on the message itself in the inbox.',
  },
  {
    question: 'Why is the AI not replying automatically?',
    answer:
      'Auto reply only runs when it is switched on, the conversation is not already assigned to a person, the AI mode for that conversation is Enabled, the reply limit has not been reached, and the answer clears your confidence threshold. The AI Setup page shows each of these settings.',
  },
  {
    question: 'What is mock mode?',
    answer:
      'When no Meta app credentials are configured, the app runs with demo channels so you can use the whole product — inbox, automations, AI, sales — without connecting a real Meta account. Set META_APP_ID, META_APP_SECRET and MOCK_MODE=false to go live.',
  },
  {
    question: 'Will a returning customer get the welcome message again?',
    answer:
      'Not if the automation has "only once per customer" turned on. Every automation run is recorded against the contact, so the welcome rule is skipped the second time.',
  },
  {
    question: 'Can I belong to more than one business?',
    answer:
      'Yes. Use the workspace switcher in the top bar. Switching changes the entire application context — inbox, customers, settings and analytics all come from the workspace you are in.',
  },
];

export default function HelpPage() {
  const { session } = useSession();
  const brand = useBrand();
  const [query, setQuery] = React.useState('');
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  const term = query.trim().toLowerCase();

  const guides = term
    ? GUIDES.filter(
        (guide) =>
          guide.title.toLowerCase().includes(term) ||
          guide.description.toLowerCase().includes(term) ||
          guide.steps.some((step) => step.toLowerCase().includes(term)),
      )
    : GUIDES;

  const faqs = term
    ? FAQS.filter(
        (faq) =>
          faq.question.toLowerCase().includes(term) || faq.answer.toLowerCase().includes(term),
      )
    : FAQS;

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Help centre"
        description={`How ${brand.name} works, and what to do when something is not behaving the way you expect.`}
      />

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the help centre…"
          className="h-11 pl-10"
        />
      </div>

      {guides.length === 0 && faqs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium">Nothing matched “{query}”</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different word, or contact support below.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {guides.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Card key={guide.title}>
                <CardHeader>
                  <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <CardTitle>{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {guide.steps.map((step, index) => (
                      <li key={index} className="flex gap-2.5 text-sm text-muted-foreground">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-2xs font-semibold text-foreground">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>

                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link href={guide.href}>
                      {guide.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {faqs.length ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Frequently asked questions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {faqs.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <div key={faq.question}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-secondary/50"
                      aria-expanded={open}
                    >
                      <span className="flex-1 text-sm font-medium">{faq.question}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                          open && 'rotate-180',
                        )}
                      />
                    </button>
                    {open ? (
                      <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-primary" />
            Still stuck?
          </CardTitle>
          <CardDescription>
            Send us the details and we will pick it up. Mentioning your workspace name helps us find
            it quickly.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <a
              href={`mailto:${LEGAL.supportEmail}?subject=${encodeURIComponent(
                `${brand.name} support — ${session?.organization?.name ?? 'workspace'}`,
              )}`}
            >
              <Mail className="h-4 w-4" />
              Email support
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings/security">Check your workspace security</Link>
          </Button>
        </CardContent>
      </Card>

      <LegalFooter className="mt-6" />
    </PageContainer>
  );
}
