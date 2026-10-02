import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LEGAL, LEGAL_LINKS, PHONE_HREF } from '@/lib/legal';
import { BrandName } from '@/components/brand-provider';

/**
 * The business identity line. Its text must read exactly
 * "Repliva — Proprietor: Md. Hasibuzzaman · <address> · <phone> · <email>"
 * to match the documents given to Meta.
 */
export function BusinessIdentity({ className }: { className?: string }) {
  return (
    <p className={className}>
      {LEGAL.operatorName} — Proprietor: {LEGAL.proprietor} · {LEGAL.address} ·{' '}
      <a href={PHONE_HREF} className="hover:text-foreground hover:underline">
        {LEGAL.phone}
      </a>{' '}
      ·{' '}
      <a href={`mailto:${LEGAL.supportEmail}`} className="hover:text-foreground hover:underline">
        {LEGAL.supportEmail}
      </a>
    </p>
  );
}

export function LegalFooter({ className }: { className?: string }) {
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
        © {new Date().getFullYear()} {LEGAL.operatorName}. Facebook, Instagram, WhatsApp and Meta are
        trademarks of Meta Platforms, Inc. <BrandName /> is not affiliated with or endorsed by
        Meta Platforms, Inc.
      </p>
    </footer>
  );
}
