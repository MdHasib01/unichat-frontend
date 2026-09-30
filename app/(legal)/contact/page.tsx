import type { Metadata } from 'next';
import Link from 'next/link';
import { LifeBuoy, Mail, Scale, ShieldCheck, Trash2 } from 'lucide-react';
import { LegalValue } from '@/components/legal/placeholder';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contact ${LEGAL.productName} for support, privacy, data deletion and legal questions.`,
};

const P = LEGAL.productName;

function mailto(address: string, subject: string) {
  return `mailto:${address}?subject=${encodeURIComponent(subject)}`;
}

const CHANNELS = [
  {
    icon: LifeBuoy,
    title: 'General support',
    body: `Help with your account, connecting channels, the inbox, automations or the AI assistant.`,
    email: LEGAL.supportEmail,
    subject: `${P} support`,
  },
  {
    icon: ShieldCheck,
    title: 'Privacy requests',
    body: 'Access, correct or export your personal information, or ask how we handle it.',
    email: LEGAL.privacyEmail,
    subject: `${P} privacy request`,
    link: { href: '/privacy', label: 'Privacy Policy' },
  },
  {
    icon: Trash2,
    title: 'Data deletion',
    body: 'Delete your account, your workspace or the messaging data synced from Facebook, Instagram and WhatsApp.',
    email: LEGAL.privacyEmail,
    subject: `${P} data deletion request`,
    link: { href: '/data-deletion', label: 'Deletion instructions' },
  },
  {
    icon: Scale,
    title: 'Legal inquiries',
    body: 'Questions about our terms, data processing agreements, or reports of abuse or policy violations.',
    email: LEGAL.legalEmail,
    subject: `${P} legal inquiry`,
    link: { href: '/terms', label: 'Terms of Service' },
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">Legal</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Contact us</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Choose the topic that best fits your question. We reply by email. Signed-in users can also email support from the Help page in the app.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((channel) => (
          <div key={channel.title} className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-card">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <channel.icon className="h-4 w-4" aria-hidden />
            </span>
            <h2 className="mt-3 text-base font-semibold text-foreground">{channel.title}</h2>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{channel.body}</p>
            <a
              href={mailto(channel.email, channel.subject)}
              className="mt-4 inline-flex items-center gap-1.5 break-all text-sm font-medium text-primary hover:underline"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {channel.email}
            </a>
            {channel.link ? (
              <Link href={channel.link.href} className="mt-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline">
                {channel.link.label} →
              </Link>
            ) : null}
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-lg border border-border bg-card p-5 text-sm shadow-card">
        <h2 className="text-base font-semibold text-foreground">Operator</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-muted-foreground sm:grid-cols-[180px_1fr]">
          <dt className="font-medium text-foreground">Service</dt>
          <dd>{P}</dd>
          <dt className="font-medium text-foreground">Operated by</dt>
          <dd>{LEGAL.operatorName}</dd>
          <dt className="font-medium text-foreground">Registration</dt>
          <dd>
            <LegalValue value={LEGAL.registrationNumber} label="LEGAL FORM AND REGISTRATION NUMBER" />
          </dd>
          <dt className="font-medium text-foreground">Postal address</dt>
          <dd>
            <LegalValue value={LEGAL.registeredAddress} label="REGISTERED ADDRESS" />
          </dd>
          <dt className="font-medium text-foreground">Website</dt>
          <dd className="break-all">
            <a href={LEGAL.siteUrl} className="text-primary hover:underline">
              {LEGAL.siteUrl}
            </a>
          </dd>
        </dl>
      </section>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        If you messaged a business that uses {P} and want your conversation deleted, please contact
        that business first. It controls that data. If you cannot reach it, email us and we will
        help.
      </p>
    </div>
  );
}
