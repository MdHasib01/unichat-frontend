/**
 * Facts the legal pages rely on, kept in one place so they stay consistent.
 *
 * The facts depend on the visitor's domain, like the brand (lib/brand.ts):
 *
 * - Repliva (repliva.site and every other host) shows the full business
 *   identity. It must match the documents given to Meta for Business
 *   Verification character for character — do not reword it, and do not
 *   override it per environment.
 * - Unichat (its own domain) shows no personal or Repliva details at all: no
 *   proprietor, address, phone, hours or email. Those fields are `null`, and
 *   every page leaves out whatever is missing.
 *
 * The values live in lib/brand-server.ts, which only server code can import,
 * so one brand's details never ship in the JavaScript sent to the other
 * domain. Read them with getLegal() on the server or useLegal() on the client.
 */
export interface Legal {
  /** The business that operates the service and acts as data controller. */
  operatorName: string;
  /** Sole proprietor of the business. */
  proprietor: string | null;
  address: string | null;
  phone: string | null;
  businessHours: string | null;

  /** One mailbox handles support, privacy and legal requests. */
  supportEmail: string | null;
  privacyEmail: string | null;
  legalEmail: string | null;

  /** Shown as "Last updated" on every policy. Change it whenever a policy changes. */
  lastUpdated: string;
  /** How long we allow ourselves to complete a verified deletion request. */
  deletionDays: number;
  /** How quickly an emailed request is acknowledged. */
  acknowledgeHours: number;

  governingLaw: string;
  jurisdictionCourts: string;
  /** The company hosting the servers and database. */
  hostingProvider: string;
  /** Where the servers are; reads as "Our servers are located in …". */
  hostingRegion: string;
}

/** "tel:" link for a phone number. */
export function phoneHref(phone: string): string {
  return `tel:${phone}`;
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
