'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Crown, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAVIGATION, isCrownRoute, type NavItem } from '@/lib/navigation';
import { BrandLogo, BrandWordmark } from '@/components/shared/brand';
import { Badge, Tooltip } from '@/components/ui/primitives';
import { useSession } from '@/hooks/use-session';
import { useCrownDialog } from './crown-dialog';

const COLLAPSE_STORAGE_KEY = 'app:sidebar-collapsed';
const GROUPS_STORAGE_KEY = 'app:sidebar-groups';

interface SidebarProps {
  unreadCount?: number;
  /** Mobile drawer calls this after a navigation so the drawer closes. */
  onNavigate?: () => void;
  forceExpanded?: boolean;
}

export function Sidebar({ unreadCount = 0, onNavigate, forceExpanded = false }: SidebarProps) {
  const pathname = usePathname();
  const { can } = useSession();
  const crown = useCrownDialog();

  const [collapsed, setCollapsed] = React.useState(false);
  const [openGroups, setOpenGroups] = React.useState<string[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  // Collapsed/expanded state persists per browser (spec section 29).
  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true');
      const stored = window.localStorage.getItem(GROUPS_STORAGE_KEY);
      if (stored) setOpenGroups(JSON.parse(stored) as string[]);
    } catch {
      /* storage can be unavailable in private mode */
    }
    setHydrated(true);
  }, []);

  // Whichever group contains the current route is always open.
  React.useEffect(() => {
    const parent = NAVIGATION.find((item) =>
      item.children?.some((child) => pathname.startsWith(child.href)),
    );
    if (parent) {
      setOpenGroups((current) => (current.includes(parent.href) ? current : [...current, parent.href]));
    }
  }, [pathname]);

  const isCollapsed = forceExpanded ? false : collapsed;

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const toggleGroup = (href: string) => {
    setOpenGroups((current) => {
      const next = current.includes(href) ? current.filter((h) => h !== href) : [...current, href];
      try {
        window.localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));

  const handleCrownClick = (event: React.MouseEvent, href: string) => {
    event.preventDefault();
    crown.open(href);
    onNavigate?.();
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200',
        isCollapsed ? 'w-[68px]' : 'w-64',
      )}
      data-collapsed={isCollapsed}
    >
      <div className={cn('flex h-14 shrink-0 items-center border-b border-sidebar-border', isCollapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        <Link href="/dashboard" className="flex items-center" onClick={onNavigate}>
          {isCollapsed ? <BrandLogo /> : <BrandWordmark />}
        </Link>
        {!forceExpanded && !isCollapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3" aria-label="Main navigation">
        {NAVIGATION.map((item) => {
          // Permission-gated sections disappear for roles that cannot use them.
          if (item.permission && !can(item.permission) && !item.children?.some((c) => c.crown)) {
            return null;
          }

          if (item.children?.length) {
            return (
              <SidebarGroup
                key={item.href}
                item={item}
                collapsed={isCollapsed}
                open={hydrated && openGroups.includes(item.href)}
                onToggle={() => toggleGroup(item.href)}
                isActive={isActive}
                onNavigate={onNavigate}
                onCrownClick={handleCrownClick}
              />
            );
          }

          return (
            <SidebarLink
              key={item.href}
              item={item}
              collapsed={isCollapsed}
              active={isActive(item.href)}
              badge={item.badgeKey === 'inboxUnread' ? unreadCount : undefined}
              onNavigate={onNavigate}
              onCrownClick={handleCrownClick}
            />
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-2">
        <SidebarLink
          item={{ label: 'Settings', href: '/settings', icon: Settings }}
          collapsed={isCollapsed}
          active={isActive('/settings')}
          onNavigate={onNavigate}
          onCrownClick={handleCrownClick}
        />
        {!forceExpanded && isCollapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="mt-1 flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  collapsed,
  active,
  badge,
  nested = false,
  onNavigate,
  onCrownClick,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  badge?: number;
  nested?: boolean;
  onNavigate?: () => void;
  onCrownClick: (event: React.MouseEvent, href: string) => void;
}) {
  const Icon = item.icon;
  const crowned = item.crown || isCrownRoute(item.href);

  const content = (
    <Link
      href={item.href}
      onClick={(event) => (crowned ? onCrownClick(event, item.href) : onNavigate?.())}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
        collapsed && 'justify-center px-2',
        nested && !collapsed && 'pl-3',
        active
          ? 'bg-sidebar-accent text-primary'
          : 'text-sidebar-foreground hover:bg-secondary hover:text-foreground',
        crowned && 'text-muted-foreground',
      )}
    >
      <Icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-primary')} />
      {!collapsed ? (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {crowned ? <Crown className="h-3.5 w-3.5 shrink-0 text-warning" aria-label="Not for sale yet" /> : null}
          {badge && badge > 0 ? (
            <Badge variant="default" className="h-5 min-w-5 justify-center px-1.5 tabular-nums">
              {badge > 99 ? '99+' : badge}
            </Badge>
          ) : null}
        </>
      ) : null}

      {collapsed && badge && badge > 0 ? (
        <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-primary" />
      ) : null}
    </Link>
  );

  if (collapsed) {
    return (
      <div className="relative">
        <Tooltip
          side="right"
          content={
            <span className="flex items-center gap-1.5">
              {item.label}
              {crowned ? <Crown className="h-3 w-3 text-warning" /> : null}
              {badge ? <span className="opacity-70">· {badge}</span> : null}
            </span>
          }
        >
          {content}
        </Tooltip>
      </div>
    );
  }

  return <div className="relative">{content}</div>;
}

function SidebarGroup({
  item,
  collapsed,
  open,
  onToggle,
  isActive,
  onNavigate,
  onCrownClick,
}: {
  item: NavItem;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  onCrownClick: (event: React.MouseEvent, href: string) => void;
}) {
  const Icon = item.icon;
  const groupActive = item.children?.some((child) => isActive(child.href)) ?? false;
  const allCrown = item.children?.every((child) => child.crown) ?? false;

  // Collapsed rail: the group icon shows its children in a tooltip list.
  if (collapsed) {
    return (
      <Tooltip
        side="right"
        content={
          <div className="space-y-1">
            <p className="font-medium">{item.label}</p>
            {item.children?.map((child) => (
              <p key={child.href} className="flex items-center gap-1.5 text-2xs opacity-80">
                {child.label}
                {child.crown ? <Crown className="h-2.5 w-2.5 text-warning" /> : null}
              </p>
            ))}
          </div>
        }
      >
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex w-full items-center justify-center rounded-lg px-2 py-2 transition-colors',
            groupActive ? 'bg-sidebar-accent text-primary' : 'text-sidebar-foreground hover:bg-secondary',
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </button>
      </Tooltip>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
          groupActive
            ? 'text-primary'
            : 'text-sidebar-foreground hover:bg-secondary hover:text-foreground',
        )}
      >
        <Icon className={cn('h-[18px] w-[18px] shrink-0', groupActive && 'text-primary')} />
        <span className="flex-1 truncate text-left">{item.label}</span>
        {allCrown ? <Crown className="h-3.5 w-3.5 text-warning" /> : null}
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div className="ml-[18px] mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
          {item.children?.map((child) => (
            <SidebarLink
              key={child.href}
              item={child}
              collapsed={false}
              nested
              active={isActive(child.href)}
              onNavigate={onNavigate}
              onCrownClick={onCrownClick}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
