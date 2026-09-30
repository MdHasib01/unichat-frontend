/**
 * The product is served under two brands from one codebase. The domain a
 * visitor uses decides which one they see: Unichat only on its own domain,
 * Repliva everywhere else (including localhost).
 *
 * The legal operator (LEGAL.operatorName) and contact emails are the same for
 * both brands — only the product name, logo and site address change.
 */

export type BrandId = 'unichat' | 'repliva';

export interface Brand {
  id: BrandId;
  name: string;
  /** Public origin for this brand, used for absolute links and metadata. */
  siteUrl: string;
  /** Browser-tab icon. */
  favicon: string;
  /** Square 1024×1024 image for Open Graph / home-screen icons. */
  icon: string;
}

export const UNICHAT_HOST = 'unichat.nuktatechnologies.com';

export const BRANDS: Record<BrandId, Brand> = {
  unichat: {
    id: 'unichat',
    name: 'Unichat',
    siteUrl: `https://${UNICHAT_HOST}`,
    favicon: '/favicon.svg',
    icon: '/unichat-icon-1024.png',
  },
  repliva: {
    id: 'repliva',
    name: 'Repliva',
    siteUrl: (process.env.NEXT_PUBLIC_APP_URL || 'https://repliva.site').replace(/\/$/, ''),
    favicon: '/repliva-favicon.png',
    icon: '/app-icon-1024.png',
  },
};

/** Picks the brand for a Host header value such as "unichat.nuktatechnologies.com:443". */
export function brandForHost(host: string | null | undefined): Brand {
  // X-Forwarded-Host may carry a list; the first entry is the original.
  const hostname = (host ?? '').split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
  return hostname === UNICHAT_HOST ? BRANDS.unichat : BRANDS.repliva;
}
