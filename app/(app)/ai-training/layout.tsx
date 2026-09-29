'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PageContainer, PageHeader } from '@/components/layout/app-shell';

const TABS = [
  { label: 'AI Setup', href: '/ai-training/setup' },
  { label: 'Train Messages', href: '/ai-training/train-content' },
  { label: 'Knowledge', href: '/ai-training/knowledge' },
  { label: 'Test', href: '/ai-training/test' },
];

export default function AITrainingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <PageContainer>
      <PageHeader
        title="AI Training"
        description="Teach the assistant about your business, decide when it may answer on its own, and test it before customers do."
      />

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                '-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </PageContainer>
  );
}
