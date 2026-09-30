/**
 * Facts the legal pages rely on, kept in one place so they stay consistent.
 *
 * A value of `null` is information nobody has supplied yet. The pages render
 * it as a highlighted placeholder rather than guessing — fill these in before
 * going live (see docs/meta-app-review.md).
 */
export const LEGAL = {
  /** The service name used across the legal pages. */
  productName: 'Repliva',
  /** The business that operates the service and acts as data controller. */
  operatorName: 'Repliva',

  siteUrl: (process.env.NEXT_PUBLIC_APP_URL || 'https://repliva.site').replace(/\/$/, ''),

  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@repliva.site',
  privacyEmail:
    process.env.NEXT_PUBLIC_PRIVACY_EMAIL ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    'support@repliva.site',
  legalEmail:
    process.env.NEXT_PUBLIC_LEGAL_EMAIL ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    'support@repliva.site',

  /** Shown as "Last updated" on every policy. Change it whenever a policy changes. */
  lastUpdated: '1 October 2026',

  /** How long we allow ourselves to complete a verified deletion request. */
  deletionDays: 30,

  // --- Not yet provided --------------------------------------------------
  /** Legal form and registration, e.g. "Repliva Ltd, company no. 12345678". */
  registrationNumber: null as string | null,
  /** Registered postal address. */
  registeredAddress: null as string | null,
  /** e.g. "the laws of England and Wales". */
  governingLaw: null as string | null,
  /** e.g. "the courts of London, England". */
  jurisdictionCourts: null as string | null,
  /** The company hosting the servers and database, e.g. "Hetzner Online GmbH". */
  hostingProvider: null as string | null,
  /** Where the servers are, e.g. "Germany (EU)". */
  hostingRegion: null as string | null,
  /** EU/UK representative or DPO, if one is required for your business. */
  dataProtectionContact: null as string | null,
} as const;

export interface LegalLink {
  label: string;
  href: string;
}

/** Footer links, in display order. Every href is a public route. */
export const LEGAL_LINKS: LegalLink[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Data Deletion', href: '/data-deletion' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Acceptable Use', href: '/acceptable-use' },
  { label: 'Meta Integration', href: '/meta' },
  { label: 'Contact', href: '/contact' },
];
