import Link from 'next/link';
import { UnichatWordmark } from '@/components/shared/brand';
import { Button } from '@/components/ui/button';
import { LegalFooter } from '@/components/legal/legal-footer';
import { LEGAL } from '@/lib/legal';

/**
 * Public frame for the home page and the legal pages. No SessionProvider and
 * no API calls, so they render for signed-out visitors and Meta's reviewers.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label={`${LEGAL.productName} home`}>
            <UnichatWordmark />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
              <Link href="/register">Create workspace</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 sm:px-6 sm:py-14">{children}</main>

      <div className="border-t border-border">
        <LegalFooter className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6" />
      </div>
    </div>
  );
}
