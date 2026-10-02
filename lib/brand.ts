/**
 * The product is served under two brands from one codebase, and the domain a
 * visitor uses decides which one they see. The brand table and the host
 * mapping live in lib/brand-server.ts, which only server code can import, so
 * the browser only ever receives the current domain's brand.
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
  /** Logo shown in the header and sidebar, at 28px tall. */
  logo: { src: string; width: number; height: number; rounded: boolean };
}
