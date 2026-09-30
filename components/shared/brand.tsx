'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useBrand } from '@/components/brand-provider';

/**
 * Unichat mark — three overlapping message bubbles standing for the three
 * channels landing in one inbox. Drawn inline so it stays crisp and themable.
 */
function UnichatMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-7 w-7', className)} role="img" aria-label="Unichat">
      <defs>
        <linearGradient id="unichat-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(243 75% 62%)" />
          <stop offset="100%" stopColor="hsl(262 83% 58%)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#unichat-mark)" />
      <path
        d="M9.2 10.4h9.4c1.3 0 2.4 1.05 2.4 2.35v4.7c0 1.3-1.1 2.35-2.4 2.35h-4.6l-3.5 2.6c-.35.26-.85.01-.85-.42v-2.18H9.2c-1.33 0-2.4-1.05-2.4-2.35v-4.7c0-1.3 1.07-2.35 2.4-2.35Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M22.9 13.1h.2c1.33 0 2.4 1.06 2.4 2.36v3.9c0 1.3-1.07 2.35-2.4 2.35h-.45v1.7c0 .43-.5.68-.85.42l-2.75-2.12h-.9v-3.55c0-1.72-1.42-3.12-3.17-3.12h-1.2v-1.94h9.12Z"
        fill="white"
        fillOpacity="0.6"
      />
    </svg>
  );
}

/** The current brand's logo mark (Unichat on its own domain, Repliva elsewhere). */
export function BrandLogo({ className }: { className?: string }) {
  const brand = useBrand();
  if (brand.id === 'unichat') return <UnichatMark className={className} />;
  return (
    <Image
      src="/repliva-logo.png"
      alt="Repliva"
      width={1304}
      height={1206}
      priority
      className={cn('h-7 w-7 object-contain', className)}
    />
  );
}

export function BrandWordmark({
  className,
  showIcon = true,
}: {
  className?: string;
  showIcon?: boolean;
}) {
  const brand = useBrand();
  return (
    <span className={cn('flex items-center gap-2', className)}>
      {showIcon ? <BrandLogo /> : null}
      <span className="text-[17px] font-semibold tracking-tight text-foreground">{brand.name}</span>
    </span>
  );
}
