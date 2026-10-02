'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LEGAL_LINKS, phoneHref } from '@/lib/legal';
import { BrandName, useLegal } from '@/components/brand-provider';

/**
 * The business identity line. On Repliva its text must read exactly
 * "Repliva — Proprietor: Md. Hasibuzzaman · <address> · <phone> · <email>"
 * to match the documents given to Meta. Brands without published contact
 * details (Unichat) render nothing.
 */
export function BusinessIdentity({ className }: { className?: string }) {
  const legal = useLegal();
  if (!legal.proprietor || !legal.address || !legal.phone || !legal.supportEmail) return null;

  return (
    <p className={className}>
      {legal.operatorName} — Proprietor: {legal.proprietor} · {legal.address} ·{' '}
      <a href={phoneHref(legal.phone)} className="hover:text-foreground hover:underline">
        {legal.phone}
      </a>{' '}
      ·{' '}
      <a href={`mailto:${legal.supportEmail}`} className="hover:text-foreground hover:underline">
        {legal.supportEmail}
      </a>
    </p>
  );
}

export function LegalFooter({ className }: { className?: string }) {
  const legal = useLegal();

  return (
    <footer className={cn('text-xs text-muted-foreground', className)}>
      <nav aria-label="Legal">
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {LEGAL_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-foreground hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <BusinessIdentity className="mt-3" />
      <p className="mt-2">
        © {new Date().getFullYear()} {legal.operatorName}. Facebook, Instagram, WhatsApp and Meta are
        trademarks of Meta Platforms, Inc. <BrandName /> is not affiliated with or endorsed by
        Meta Platforms, Inc.
      </p>
    </footer>
  );
}
