'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SETTINGS_NAV } from '@/lib/navigation';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Configure this workspace. Every setting here applies only to the organization you are in."
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="shrink-0 lg:w-48" aria-label="Settings sections">
          <div className="flex gap-1 overflow-x-auto border-b border-border lg:flex-col lg:border-b-0 lg:border-none">
            {SETTINGS_NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </PageContainer>
  );
}
