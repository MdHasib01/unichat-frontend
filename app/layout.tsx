import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { LEGAL } from '@/lib/legal';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Repliva — one inbox for every customer conversation',
    template: '%s · Repliva',
  },
  description:
    'Repliva brings Facebook Messenger, Instagram Direct and WhatsApp Business into a single inbox, with automation, an AI assistant trained on your business, and team collaboration.',
  applicationName: 'Repliva',
  metadataBase: new URL(LEGAL.siteUrl),
  icons: { icon: '/favicon.svg', apple: '/app-icon-1024.png' },
  openGraph: {
    type: 'website',
    siteName: 'Repliva',
    title: 'Repliva — one inbox for every customer conversation',
    description:
      'Answer Facebook Messenger, Instagram Direct, WhatsApp Business and website chat messages from one shared inbox.',
    images: [{ url: '/app-icon-1024.png', width: 1024, height: 1024, alt: 'Repliva' }],
  },
  // Meta Business Manager → Brand safety → Domains → "Meta-tag verification".
  // DNS TXT verification needs no code; this is only for the meta-tag route.
  ...(process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION
    ? { other: { 'facebook-domain-verification': process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
