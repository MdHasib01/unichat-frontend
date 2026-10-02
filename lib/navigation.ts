import type { LucideIcon } from 'lucide-react';
import {
  BadgeHelp,
  BookOpen,
  BarChart3,
  Bot,
  Boxes,
  BrainCircuit,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Mic,
  Package,
  PhoneCall,
  Plug,
  Rocket,
  ShoppingCart,
  Sparkles,
  Truck,
  UserCircle,
  Wand2,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * Crown-marked entries stay visible and clickable, but the underlying
   * service is not for sale yet (spec sections 29 and 48). They must never
   * ship fake functionality — clicking opens the availability dialog.
   */
  crown?: boolean;
  /** Permission needed to reach the real feature. */
  permission?: string;
  children?: NavItem[];
  badgeKey?: 'inboxUnread';
}

export const NAVIGATION: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Inbox', href: '/inbox', icon: Inbox, permission: 'conversations.read', badgeKey: 'inboxUnread' },
  { label: 'Integrations', href: '/integrations', icon: Plug, permission: 'integrations.read' },
  {
    label: 'Sales',
    href: '/sales',
    icon: ShoppingCart,
    permission: 'sales.read',
    children: [
      { label: 'Orders', href: '/sales/orders', icon: Boxes },
      { label: 'Products', href: '/sales/products', icon: Package },
      { label: 'Parcels', href: '/sales/parcels', icon: Truck },
    ],
  },
  {
    label: 'Calls',
    href: '/calls',
    icon: PhoneCall,
    permission: 'calls.read',
    children: [
      { label: 'AI Calls', href: '/calls/ai', icon: Bot, crown: true },
      { label: 'Recordings', href: '/calls/recordings', icon: Mic },
    ],
  },
  {
    label: 'Marketing',
    href: '/marketing',
    icon: Megaphone,
    children: [
      { label: 'AdsFlow', href: '/marketing/ads-flow', icon: Rocket, crown: true },
      { label: 'Creative Studio', href: '/marketing/creative-studio', icon: Wand2, crown: true },
      { label: 'Ad Launcher', href: '/marketing/ad-launcher', icon: Sparkles, crown: true },
    ],
  },
  {
    label: 'AI Training',
    href: '/ai-training',
    icon: BrainCircuit,
    permission: 'ai.read',
    children: [
      { label: 'AI Setup', href: '/ai-training/setup', icon: Bot },
      { label: 'Train Messages', href: '/ai-training/train-content', icon: MessagesSquare },
      { label: 'Knowledge', href: '/ai-training/knowledge', icon: BookOpen },
    ],
  },
  { label: 'Insights', href: '/analytics', icon: BarChart3, permission: 'analytics.read' },
  { label: 'Account', href: '/account', icon: UserCircle },
  { label: 'Help', href: '/help', icon: BadgeHelp },
];

/** The services that are visible but not currently for sale. */
export const CROWN_SERVICES: Record<string, { title: string; description: string }> = {
  '/calls/ai': {
    title: 'AI Calls',
    description:
      'Automated voice conversations that answer, qualify and route calls using your business knowledge.',
  },
  '/marketing/ads-flow': {
    title: 'AdsFlow',
    description:
      'Plan, budget and orchestrate multi-channel ad campaigns from the same workspace as your inbox.',
  },
  '/marketing/creative-studio': {
    title: 'Creative Studio',
    description: 'Generate and manage ad creatives, captions and variations for your campaigns.',
  },
  '/marketing/ad-launcher': {
    title: 'Ad Launcher',
    description: 'Publish campaigns straight to connected ad accounts and track results alongside your conversations.',
  },
};

export function isCrownRoute(href: string): boolean {
  return href in CROWN_SERVICES;
}

export const SETTINGS_NAV = [
  { label: 'Business', href: '/settings/business' },
  { label: 'Team', href: '/settings/team' },
  { label: 'Notifications', href: '/settings/notifications' },
  { label: 'Security', href: '/settings/security' },
  { label: 'Billing', href: '/settings/billing' },
];

export const ACCOUNT_NAV = [
  { label: 'Profile', href: '/account/profile' },
  { label: 'Security', href: '/account/security' },
  { label: 'Notifications', href: '/account/notifications' },
];
