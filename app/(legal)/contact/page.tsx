import type { Metadata } from 'next';
import Link from 'next/link';
import { LifeBuoy, Mail, Scale, ShieldCheck, Trash2 } from 'lucide-react';
import { LEGAL, PHONE_HREF } from '@/lib/legal';
import { getBrand } from '@/lib/brand-server';

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getBrand();
  return {
    title: 'Contact',
    description: `Contact ${LEGAL.operatorName} (${name}): proprietor ${LEGAL.proprietor}, postal address, phone, email and support hours.`,
  };
}

function mailto(address: string, subject: string) {
  return `mailto:${address}?subject=${encodeURIComponent(subject)}`;
}

const CHANNELS = [
  {
    icon: LifeBuoy,
    title: 'General support',
    body: `Help with your account, connecting channels, the inbox, automations or the AI assistant.`,
    email: LEGAL.supportEmail,
    subject: 'support',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy requests',
    body: 'Access, correct or export your personal information, or ask how we handle it.',
    email: LEGAL.privacyEmail,
    subject: 'privacy request',
    link: { href: '/privacy', label: 'Privacy Policy' },
  },
  {
    icon: Trash2,
    title: 'Data deletion',
    body: 'Delete your account, your workspace or the messaging data synced from Facebook, Instagram and WhatsApp.',
    email: LEGAL.privacyEmail,
    subject: 'data deletion request',
    link: { href: '/data-deletion', label: 'Deletion instructions' },
  },
  {
    icon: Scale,
    title: 'Legal inquiries',
    body: 'Questions about our terms, data processing agreements, or reports of abuse or policy violations.',
    email: LEGAL.legalEmail,
    subject: 'legal inquiry',
    link: { href: '/terms', label: 'Terms of Service' },
  },
];

export default async function ContactPage() {
  const brand = await getBrand();
  const P = brand.name;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">Contact</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Contact us</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Reach us by email or phone using the details below. Signed-in users can also email support
        from the Help page in the app.
      </p>

      <section
        aria-labelledby="business-details"
        className="mt-8 rounded-lg border border-border bg-card p-5 text-sm shadow-card"
      >
        <h2 id="business-details" className="text-base font-semibold text-foreground">
          Business details
        </h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-muted-foreground sm:grid-cols-[160px_1fr]">
          <dt className="font-medium text-foreground">Business name</dt>
          <dd>{LEGAL.operatorName}</dd>
          <dt className="font-medium text-foreground">Proprietor</dt>
          <dd>{LEGAL.proprietor}</dd>
          <dt className="font-medium text-foreground">Address</dt>
          <dd>{LEGAL.address}</dd>
          <dt className="font-medium text-foreground">Phone</dt>
          <dd>
            <a href={PHONE_HREF} className="text-primary hover:underline">
              {LEGAL.phone}
            </a>
          </dd>
          <dt className="font-medium text-foreground">Email</dt>
          <dd className="break-all">
            <a href={`mailto:${LEGAL.supportEmail}`} className="text-primary hover:underline">
              {LEGAL.supportEmail}
            </a>
          </dd>
          <dt className="font-medium text-foreground">Business hours</dt>
          <dd>{LEGAL.businessHours}</dd>
          <dt className="font-medium text-foreground">Website</dt>
          <dd className="break-all">
            <a href={brand.siteUrl} className="text-primary hover:underline">
              {brand.siteUrl}
            </a>
          </dd>
        </dl>
      </section>

      <h2 className="mt-10 text-base font-semibold text-foreground">What can we help with?</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((channel) => (
          <div key={channel.title} className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-card">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <channel.icon className="h-4 w-4" aria-hidden />
            </span>
            <h3 className="mt-3 text-base font-semibold text-foreground">{channel.title}</h3>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{channel.body}</p>
            <a
              href={mailto(channel.email, `${P} ${channel.subject}`)}
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

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        If you messaged a business that uses {P} and want your conversation deleted, please contact
        that business first. It controls that data. If you cannot reach it, email us and we will
        help.
      </p>
    </div>
  );
}
