'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ACCOUNT_NAV } from '@/lib/navigation';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="Your account"
        description="Your personal details and sign-in — these follow you across every workspace you belong to."
      />

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {ACCOUNT_NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                '-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {children}
    </PageContainer>
  );
}
