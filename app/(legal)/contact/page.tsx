import type { Metadata } from 'next';
import Link from 'next/link';
import { LifeBuoy, Mail, Scale, ShieldCheck, Trash2 } from 'lucide-react';
import { phoneHref } from '@/lib/legal';
import { getBrand, getLegal } from '@/lib/brand-server';

export async function generateMetadata(): Promise<Metadata> {
  const [{ name }, legal] = await Promise.all([getBrand(), getLegal()]);
  return {
    title: 'Contact',
    description: legal.proprietor
      ? `Contact ${legal.operatorName} (${name}): proprietor ${legal.proprietor}, postal address, phone, email and support hours.`
      : `How to get help with ${name}, and how to request deletion of your data.`,
  };
}

function mailto(address: string, subject: string) {
  return `mailto:${address}?subject=${encodeURIComponent(subject)}`;
}

export default async function ContactPage() {
  const [brand, legal] = await Promise.all([getBrand(), getLegal()]);
  const P = brand.name;
  const { supportEmail, privacyEmail, legalEmail, phone } = legal;

  const channels =
    supportEmail && privacyEmail && legalEmail
      ? [
          {
            icon: LifeBuoy,
            title: 'General support',
            body: `Help with your account, connecting channels, the inbox, automations or the AI assistant.`,
            email: supportEmail,
            subject: 'support',
          },
          {
            icon: ShieldCheck,
            title: 'Privacy requests',
            body: 'Access, correct or export your personal information, or ask how we handle it.',
            email: privacyEmail,
            subject: 'privacy request',
            link: { href: '/privacy', label: 'Privacy Policy' },
          },
          {
            icon: Trash2,
            title: 'Data deletion',
            body: 'Delete your account, your workspace or the messaging data synced from Facebook, Instagram and WhatsApp.',
            email: privacyEmail,
            subject: 'data deletion request',
            link: { href: '/data-deletion', label: 'Deletion instructions' },
          },
          {
            icon: Scale,
            title: 'Legal inquiries',
            body: 'Questions about our terms, data processing agreements, or reports of abuse or policy violations.',
            email: legalEmail,
            subject: 'legal inquiry',
            link: { href: '/terms', label: 'Terms of Service' },
          },
        ]
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">Contact</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Contact us</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {channels
          ? 'Reach us by email or phone using the details below. Signed-in users can also email support from the Help page in the app.'
          : `Signed-in users can find guides on the Help page in the app, and can request deletion of their account or data from the Delete account page.`}
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
          <dd>{legal.operatorName}</dd>
          {legal.proprietor ? (
            <>
              <dt className="font-medium text-foreground">Proprietor</dt>
              <dd>{legal.proprietor}</dd>
            </>
          ) : null}
          {legal.address ? (
            <>
              <dt className="font-medium text-foreground">Address</dt>
              <dd>{legal.address}</dd>
            </>
          ) : null}
          {phone ? (
            <>
              <dt className="font-medium text-foreground">Phone</dt>
              <dd>
                <a href={phoneHref(phone)} className="text-primary hover:underline">
                  {phone}
                </a>
              </dd>
            </>
          ) : null}
          {supportEmail ? (
            <>
              <dt className="font-medium text-foreground">Email</dt>
              <dd className="break-all">
                <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
                  {supportEmail}
                </a>
              </dd>
            </>
          ) : null}
          {legal.businessHours ? (
            <>
              <dt className="font-medium text-foreground">Business hours</dt>
              <dd>{legal.businessHours}</dd>
            </>
          ) : null}
          <dt className="font-medium text-foreground">Website</dt>
          <dd className="break-all">
            <a href={brand.siteUrl} className="text-primary hover:underline">
              {brand.siteUrl}
            </a>
          </dd>
        </dl>
      </section>

      {channels ? (
        <>
          <h2 className="mt-10 text-base font-semibold text-foreground">What can we help with?</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {channels.map((channel) => (
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
        </>
      ) : (
        <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
          <li>
            <Link href="/data-deletion" className="font-medium text-primary hover:underline">
              Data Deletion Instructions →
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              Privacy Policy →
            </Link>
          </li>
        </ul>
      )}

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        If you messaged a business that uses {P} and want your conversation deleted, please contact
        that business first. It controls that data.
        {channels ? ' If you cannot reach it, email us and we will help.' : null}
      </p>
    </div>
  );
}
