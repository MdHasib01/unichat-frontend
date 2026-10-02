import { headers } from 'next/headers';
import type { Brand, BrandId } from './brand';
import type { Legal } from './legal';

// This module imports next/headers, so Next.js refuses to bundle it for the
// browser: neither domain's brand or legal facts reach the other's visitors.

/** Production, public, and the only domain used with Meta. */
export const PRODUCTION_HOST = 'repliva.site';
/** Internal testing only: Basic Auth, never indexed, never used with Meta. */
export const INTERNAL_HOST = 'unichat.nuktatechnologies.com';

const BRANDS: Record<BrandId, Brand> = {
  unichat: {
    id: 'unichat',
    name: 'Unichat',
    siteUrl: `https://${INTERNAL_HOST}`,
    favicon: '/favicon.svg',
    icon: '/unichat-icon-1024.png',
    logo: { src: '/unichat-icon.svg', width: 28, height: 28, rounded: true },
  },
  repliva: {
    id: 'repliva',
    name: 'Repliva',
    siteUrl: `https://${PRODUCTION_HOST}`,
    favicon: '/repliva-favicon.png',
    icon: '/app-icon-1024.png',
    // The badge is wide (1182×691 source), so it keeps its own width at 28px.
    logo: { src: '/repliva-logo.png', width: 48, height: 28, rounded: false },
  },
};

/** Picks the brand for a Host header value such as "repliva.site:443". */
export function brandForHost(host: string | null | undefined): Brand {
  // X-Forwarded-Host may carry a list; the first entry is the original.
  const hostname = (host ?? '').split(',')[0].trim().toLowerCase().replace(/:d+$/, '');
  return hostname === INTERNAL_HOST ? BRANDS.unichat : BRANDS.repliva;
}

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
// Client components get the current brand's facts through BrandProvider.

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
