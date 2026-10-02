import Link from 'next/link';
import { BrandWordmark } from '@/components/shared/brand';
import { Button } from '@/components/ui/button';
import { LegalFooter } from '@/components/legal/legal-footer';
import { getBrand } from '@/lib/brand-server';

/**
 * Public frame for the home page and the legal pages. No SessionProvider and
 * no API calls, so they render for signed-out visitors and Meta's reviewers.
 */
export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label={`${brand.name} home`}>
            <BrandWordmark />
          </Link>
          <div className="flex items-center gap-2">
            <nav aria-label="Site" className="flex items-center gap-1">
              <Button asChild size="sm" variant="ghost">
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="hidden md:inline-flex">
                <Link href="/contact">Contact</Link>
              </Button>
            </nav>
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
