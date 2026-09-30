import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LEGAL, LEGAL_LINKS } from '@/lib/legal';

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
      <p className="mt-3">
        © {new Date().getFullYear()} {LEGAL.operatorName}. Facebook, Instagram, WhatsApp and Meta are
        trademarks of Meta Platforms, Inc. {LEGAL.productName} is not affiliated with or endorsed by
        Meta.
      </p>
    </footer>
  );
}
