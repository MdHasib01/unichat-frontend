/**
 * Facts the legal pages rely on, kept in one place so they stay consistent.
 *
 * A value of `null` is information nobody has supplied yet. The pages render
 * it as a highlighted placeholder rather than guessing — fill these in before
 * going live (see docs/meta-app-review.md).
 *
 * The product name, logo and site address depend on the visitor's domain and
 * live in lib/brand.ts — use useBrand() / getBrand() for those.
 */
export const LEGAL = {
  /** The business that operates the service and acts as data controller — the same for every brand. */
  operatorName: 'Repliva',

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

  /** Registered postal address — must match the documents given to Meta. */
  registeredAddress: 'Noapara, Abhaynagar, Jashore, PO: 7460, Bangladesh' as string | null,
  governingLaw: 'the laws of Bangladesh' as string | null,
  jurisdictionCourts: 'the courts of Jashore, Bangladesh' as string | null,

  /** The company hosting the servers and database. */
  hostingProvider: 'Database Mart (databasemart.com)' as string | null,
  /** Where the servers are; reads as "Our servers are located in …". */
  hostingRegion: 'the United States' as string | null,

  // --- Not yet provided --------------------------------------------------
  /** Legal form and registration, e.g. "Repliva Ltd, company no. 12345678". */
  registrationNumber: null as string | null,
} as const;

/**
 * Legal facts still missing. Every one shows as a visible [PLACEHOLDER] on the
 * public pages, and Meta's reviewers reject policies with placeholders — so a
 * production build says so loudly.
 */
export const LEGAL_MISSING = (
  [
    'registrationNumber',
    'registeredAddress',
    'governingLaw',
    'jurisdictionCourts',
    'hostingProvider',
    'hostingRegion',
  ] as const
).filter((key) => LEGAL[key] === null);

if (process.env.NODE_ENV === 'production' && LEGAL_MISSING.length && typeof window === 'undefined') {
  console.warn(
    `[legal] frontend/lib/legal.ts is missing: ${LEGAL_MISSING.join(', ')}. ` +
      'The legal pages show placeholders until these are set — fill them before Meta App Review.',
  );
}

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
