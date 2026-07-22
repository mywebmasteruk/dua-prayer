'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  BookOpen,
  Bookmark,
  HandCoins,
  HandHeart,
  Home,
  Info,
  LayoutGrid,
  Settings,
  Shield,
  ShieldAlert,
  User,
  UserCheck,
} from 'lucide-react';

import { cn } from '@kit/ui/utils';

import {
  getCommunityNavState,
  isCommunityPathActive,
} from '~/lib/community-nav';

import { CommunityBrandLogo } from './community-brand-logo';

const ICONS = {
  Home,
  Channels: LayoutGrid,
  Resources: BookOpen,
  About: Info,
  Donate: HandCoins,
  Volunteer: HandHeart,
  Safety: Shield,
  Account: User,
  Bookmarks: Bookmark,
  Settings,
  Admin: ShieldAlert,
  'Sign in': UserCheck,
} as const;

const PRIMARY_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/channels', label: 'Channels' },
  { href: '/resources', label: 'Resources' },
  { href: '/about', label: 'About' },
  { href: '/donate', label: 'Donate' },
  { href: '/volunteer', label: 'Volunteer' },
  { href: '/safety', label: 'Safety' },
] as const;

export function CommunitySidebar({
  email,
  displayName,
  isAdmin = false,
  sidebarTagline = 'Share your duas, support one another, and browse community activity.',
}: {
  email?: string | null;
  displayName?: string | null;
  isAdmin?: boolean;
  sidebarTagline?: string;
}) {
  const pathname = usePathname() ?? '/';
  const navState = getCommunityNavState({ email, displayName, isAdmin });

  return (
    <div className="flex h-full min-h-0 max-h-full flex-col">
      <div>
        <CommunityBrandLogo href="/" priority />
        <p className="mt-2 text-xs leading-snug text-muted-foreground/75">
          {sidebarTagline}
        </p>
      </div>

      <nav
        aria-label="Primary"
        className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1"
      >
        {PRIMARY_LINKS.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            active={isCommunityPathActive(pathname, item.href)}
          />
        ))}

        {navState.guestAccountItem ? (
          <SidebarNavItem
            href={navState.guestAccountItem.href}
            label={navState.guestAccountItem.label}
            variant="cta"
          />
        ) : null}

        {navState.signedInItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            active={isCommunityPathActive(pathname, item.activePath)}
          />
        ))}

        {navState.showAdminLink ? (
          <SidebarNavItem
            href="/admin"
            label="Admin"
            active={isCommunityPathActive(pathname, '/admin')}
          />
        ) : null}
      </nav>

      {navState.signedInSummary ? (
        <div className="shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3">
          <Link
            href="/home"
            className="block rounded-2xl border border-border/70 bg-background/80 px-3 py-2.5 transition hover:bg-background"
          >
            <p className="truncate text-sm font-semibold text-foreground">
              {navState.signedInSummary.label}
            </p>
            {navState.signedInSummary.email ? (
              <p className="truncate text-xs text-muted-foreground">
                {navState.signedInSummary.email}
              </p>
            ) : null}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function SidebarNavItem({
  href,
  label,
  active = false,
  variant = 'default',
}: {
  href: string;
  label: string;
  active?: boolean;
  variant?: 'default' | 'cta';
}) {
  const Icon = ICONS[label as keyof typeof ICONS] ?? Home;

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex w-full max-w-full items-center gap-3 rounded-full px-3 py-2.5 text-[14px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-4 lg:py-2.5',
        variant === 'cta'
          ? 'justify-center -translate-x-1 gap-2 bg-primary/90 text-[14px] font-semibold text-primary-foreground shadow-sm hover:bg-primary lg:text-[15px]'
          : cn(
              'hover:bg-white/70 lg:text-[16px]',
              active
                ? 'font-bold text-primary'
                : 'font-normal text-foreground/55 hover:text-foreground/75',
            ),
      )}
    >
      <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
