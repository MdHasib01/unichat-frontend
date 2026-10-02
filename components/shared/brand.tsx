'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useBrand } from '@/components/brand-provider';

/** The current domain's logo, from its brand (lib/brand-server.ts). */
export function BrandLogo({ className }: { className?: string }) {
  const { name, logo } = useBrand();
  // width and height are the display size, so Next serves a small 1x/2x
  // image rather than the full-size original.
  return (
    <Image
      src={logo.src}
      alt={name}
      width={logo.width}
      height={logo.height}
      priority
      // The optimizer does not process SVG; serve it as-is.
      unoptimized={logo.src.endsWith('.svg')}
      className={cn('h-7 w-auto', logo.rounded && 'rounded-[9px]', className)}
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
