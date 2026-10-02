/**
 * Facts the legal pages rely on, kept in one place so they stay consistent.
 *
 * The business identity below must match the documents given to Meta for
 * Business Verification character for character — do not reword it, and do
 * not override it per environment.
 *
 * A value of `null` is information nobody has supplied yet. The pages render
 * it as a highlighted placeholder rather than guessing.
 *
 * The product name, logo and site address depend on the visitor's domain and
 * live in lib/brand.ts — use useBrand() / getBrand() for those.
 */
const BUSINESS_EMAIL = 'support@repliva.site';

export const LEGAL = {
  /** The business that operates the service and acts as data controller — the same for every brand. */
  operatorName: 'Repliva',
  /** Sole proprietor of the business. */
  proprietor: 'Md. Hasibuzzaman',
  address: 'Noapara, Abhaynagar, Jashore 7460, Bangladesh',
  phone: '+8801411573437',
  businessHours: 'Open 24/7. Email support is monitored daily; we aim to reply within 24 hours.',

  /** One mailbox handles support, privacy and legal requests. */
  supportEmail: BUSINESS_EMAIL,
  privacyEmail: BUSINESS_EMAIL,
  legalEmail: BUSINESS_EMAIL,

  /** Shown as "Last updated" on every policy. Change it whenever a policy changes. */
  lastUpdated: '3 October 2026',

  /** How long we allow ourselves to complete a verified deletion request. */
  deletionDays: 30,
  /** How quickly an emailed request is acknowledged. */
  acknowledgeHours: 24,

  governingLaw: 'the laws of Bangladesh' as string | null,
  jurisdictionCourts: 'the courts of Jashore, Bangladesh' as string | null,

  /** The company hosting the servers and database. */
  hostingProvider: 'Database Mart (databasemart.com)' as string | null,
  /** Where the servers are; reads as "Our servers are located in …". */
  hostingRegion: 'the United States' as string | null,
} as const;

/** "tel:" link for LEGAL.phone. */
export const PHONE_HREF = `tel:${LEGAL.phone}`;

/**
 * Legal facts still missing. Every one shows as a visible [PLACEHOLDER] on the
 * public pages, and Meta's reviewers reject policies with placeholders — so a
 * production build says so loudly.
 */
export const LEGAL_MISSING = (
  [
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
  { label: 'Pricing', href: '/pricing' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Data Deletion', href: '/data-deletion' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Acceptable Use', href: '/acceptable-use' },
  { label: 'Meta Integration', href: '/meta-integration' },
  { label: 'Contact', href: '/contact' },
];
