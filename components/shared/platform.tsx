import { Facebook, Globe, Instagram, MessageCircle, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types';

export const PLATFORM_META: Record<
  Platform,
  { label: string; icon: typeof Facebook; className: string; dot: string }
> = {
  FACEBOOK: {
    label: 'Messenger',
    icon: Facebook,
    className: 'bg-[#1877f2]/10 text-[#1877f2]',
    dot: 'bg-[#1877f2]',
  },
  INSTAGRAM: {
    label: 'Instagram',
    icon: Instagram,
    className: 'bg-[#d62976]/10 text-[#d62976]',
    dot: 'bg-[#d62976]',
  },
  WHATSAPP: {
    label: 'WhatsApp',
    icon: MessageCircle,
    className: 'bg-[#25d366]/12 text-[#128c4a]',
    dot: 'bg-[#25d366]',
  },
  WEBCHAT: {
    label: 'Website',
    icon: Globe,
    className: 'bg-[#4f46e5]/10 text-[#4f46e5]',
    dot: 'bg-[#4f46e5]',
  },
  INTERNAL: {
    label: 'Internal',
    icon: StickyNote,
    className: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
};

export function PlatformIcon({
  platform,
  className,
  withBackground = true,
}: {
  platform: Platform;
  className?: string;
  withBackground?: boolean;
}) {
  const meta = PLATFORM_META[platform] ?? PLATFORM_META.INTERNAL;
  const Icon = meta.icon;

  if (!withBackground) {
    return <Icon className={cn('h-4 w-4', className)} />;
  }

  return (
    <span
      className={cn('flex h-6 w-6 items-center justify-center rounded-md', meta.className, className)}
      title={meta.label}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

export function PlatformBadge({ platform, className }: { platform: Platform; className?: string }) {
  const meta = PLATFORM_META[platform] ?? PLATFORM_META.INTERNAL;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        meta.className,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

/** Small coloured dot overlaid on a contact avatar in the conversation list. */
export function PlatformDot({ platform, className }: { platform: Platform; className?: string }) {
  const meta = PLATFORM_META[platform] ?? PLATFORM_META.INTERNAL;
  return (
    <span
      className={cn('h-2.5 w-2.5 rounded-full ring-2 ring-card', meta.dot, className)}
      title={meta.label}
    />
  );
}
