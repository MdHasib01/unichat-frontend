import Link from 'next/link';
import { UnichatWordmark } from '@/components/shared/brand';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <UnichatWordmark className="mb-8" />
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The link may be out of date, or the page may belong to a workspace you no longer have access
        to.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
