import Link from 'next/link';
import { UnichatLogo } from '@/components/shared/brand';
import { Button } from '@/components/ui/button';
import { LegalFooter } from '@/components/legal/legal-footer';
import { LEGAL } from '@/lib/legal';

/**
 * Public frame for the legal pages. No SessionProvider and no API calls, so
 * the pages render for signed-out visitors and Meta's reviewers alike.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/privacy" className="flex items-center gap-2">
            <span aria-hidden>
              <UnichatLogo />
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-foreground">
              {LEGAL.productName}
            </span>
          </Link>
          <Button asChild size="sm" variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">{children}</main>

      <div className="border-t border-border">
        <LegalFooter className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6" />
      </div>
    </div>
  );
}
