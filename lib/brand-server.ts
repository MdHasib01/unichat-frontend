import { headers } from 'next/headers';
import { brandForHost, type Brand, type BrandId } from './brand';
import type { Legal } from './legal';

/**
 * The brand for the current request, for server components and metadata.
 * Reading headers makes the route render per request, which is required —
 * the same URL must look different on each domain.
 */
export async function getBrand(): Promise<Brand> {
  const h = await headers();
  return brandForHost(h.get('x-forwarded-host') ?? h.get('host'));
}

// --- Legal facts per brand (see the Legal interface in lib/legal.ts) -------
// They live here, not in lib/legal.ts: this module imports next/headers, so
// Next.js refuses to bundle it for the browser. Client components get the
// current brand's facts through BrandProvider instead, and the Repliva
// identity never reaches pages served on the Unichat domain.

const BUSINESS_EMAIL = 'support@repliva.site';

const REPLIVA_LEGAL: Legal = {
  operatorName: 'Repliva',
  proprietor: 'Md. Hasibuzzaman',
  address: 'Noapara, Abhaynagar, Jashore 7460, Bangladesh',
  phone: '+8801411573437',
  businessHours: 'Open 24/7. Email support is monitored daily; we aim to reply within 24 hours.',

  supportEmail: BUSINESS_EMAIL,
  privacyEmail: BUSINESS_EMAIL,
  legalEmail: BUSINESS_EMAIL,

  lastUpdated: '3 October 2026',
  deletionDays: 30,
  acknowledgeHours: 24,

  governingLaw: 'the laws of Bangladesh',
  jurisdictionCourts: 'the courts of Jashore, Bangladesh',
  hostingProvider: 'Database Mart (databasemart.com)',
  hostingRegion: 'the United States',
};

const UNICHAT_LEGAL: Legal = {
  ...REPLIVA_LEGAL,
  operatorName: 'Unichat',
  proprietor: null,
  address: null,
  phone: null,
  businessHours: null,
  supportEmail: null,
  privacyEmail: null,
  legalEmail: null,
  jurisdictionCourts: 'the competent courts of Bangladesh',
};

const LEGAL_BY_BRAND: Record<BrandId, Legal> = {
  repliva: REPLIVA_LEGAL,
  unichat: UNICHAT_LEGAL,
};

export function legalFor(brand: Brand | BrandId): Legal {
  return LEGAL_BY_BRAND[typeof brand === 'string' ? brand : brand.id];
}

/** The legal facts for the current request's brand. */
export async function getLegal(): Promise<Legal> {
  return legalFor(await getBrand());
}
