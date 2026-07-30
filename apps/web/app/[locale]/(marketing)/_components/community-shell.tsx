'use client';

import type { ReactNode } from 'react';

import type { JWTUserData } from '@kit/supabase/types';

import {
  CommunityShellProvider,
  useCommunityRightRail,
} from './community-shell-context';
import { CommunityMobileNav } from './community-mobile-nav';
import { CommunityMobileTopBar } from './community-mobile-top-bar';
import { CommunityRightRail } from './community-right-rail';
import { CommunitySidebar } from './community-sidebar';

function CommunityShellFrame({
  user,
  isAdmin = false,
  sidebarTagline,
  children,
}: {
  user?: JWTUserData | null;
  isAdmin?: boolean;
  sidebarTagline?: string;
  children: ReactNode;
}) {
  const { rightRail } = useCommunityRightRail();

  return (
    <div className="min-h-screen bg-muted text-foreground">
      <div
        className={
          rightRail
            ? 'mx-auto grid w-full max-w-[1265px] lg:grid-cols-[minmax(0,275px)_minmax(0,600px)_minmax(0,350px)] lg:justify-center'
            : 'mx-auto grid w-full max-w-[1265px] lg:grid-cols-[minmax(0,275px)_minmax(0,950px)] lg:justify-center'
        }
      >
        <aside
          aria-label="Site navigation"
          className="hidden lg:sticky lg:top-0 lg:col-start-1 lg:block lg:h-[calc(100dvh-2rem)] lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-hidden lg:px-4 lg:pb-0 lg:pt-3 lg:text-foreground/70"
        >
          <CommunitySidebar
            email={user?.email}
            displayName={user?.email ?? null}
            isAdmin={isAdmin || Boolean(user?.is_superadmin)}
            sidebarTagline={sidebarTagline}
          />
        </aside>

        <main
          className="min-w-0 bg-white pb-20 shadow-[0_24px_80px_rgba(15,23,42,0.045)] lg:col-start-2 lg:pb-0"
          aria-label="Community content"
        >
          <CommunityMobileTopBar showCompose={Boolean(rightRail)} />
          {children}
        </main>

        {rightRail ? (
          <aside
            aria-label="Community trends and platform context"
            className="hidden lg:sticky lg:top-0 lg:col-start-3 lg:block lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto lg:px-4 lg:pb-3 lg:pt-3 lg:text-foreground/65"
          >
            <CommunityRightRail {...rightRail} />
          </aside>
        ) : null}
      </div>

      <CommunityMobileNav email={user?.email} isAdmin={isAdmin} />
    </div>
  );
}

export function CommunityShell({
  user,
  isAdmin = false,
  sidebarTagline,
  children,
}: {
  user?: JWTUserData | null;
  isAdmin?: boolean;
  sidebarTagline?: string;
  children: ReactNode;
}) {
  return (
    <CommunityShellProvider>
      <CommunityShellFrame
        user={user}
        isAdmin={isAdmin}
        sidebarTagline={sidebarTagline}
      >
        {children}
      </CommunityShellFrame>
    </CommunityShellProvider>
  );
}
