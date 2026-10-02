import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { BrandProvider } from '@/components/brand-provider';
import { getBrand, legalFor } from '@/lib/brand-server';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

/** Names, icons and URLs follow the domain the visitor used (lib/brand.ts). */
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  const tagline = `${brand.name} — one inbox for every customer conversation`;

  return {
    title: { default: tagline, template: `%s · ${brand.name}` },
    description: `${brand.name} brings Facebook Messenger, Instagram Direct and WhatsApp Business into a single inbox, with automation, an AI assistant trained on your business, and team collaboration.`,
    applicationName: brand.name,
    metadataBase: new URL(brand.siteUrl),
    icons: { icon: brand.favicon, apple: brand.icon },
    openGraph: {
      type: 'website',
      siteName: brand.name,
      title: tagline,
      description:
        'Answer Facebook Messenger, Instagram Direct, WhatsApp Business and website chat messages from one shared inbox.',
      images: [{ url: brand.icon, width: 1024, height: 1024, alt: brand.name }],
    },
    // The internal testing domain is never indexed (it also sends
    // X-Robots-Tag and a Disallow-all robots.txt — see middleware.ts).
    ...(brand.id === 'unichat' ? { robots: { index: false, follow: false } } : {}),
    // Meta Business Manager → Brand safety → Domains → "Meta-tag verification",
    // production only. Read at request time (this layout renders per request),
    // so setting FACEBOOK_DOMAIN_VERIFICATION on the server needs no rebuild.
    ...(brand.id === 'repliva' && process.env.FACEBOOK_DOMAIN_VERIFICATION
      ? { other: { 'facebook-domain-verification': process.env.FACEBOOK_DOMAIN_VERIFICATION } }
      : {}),
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();

  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen font-sans">
        <BrandProvider brand={brand} legal={legalFor(brand)}>
          <Providers>{children}</Providers>
        </BrandProvider>
      </body>
    </html>
  );
}
