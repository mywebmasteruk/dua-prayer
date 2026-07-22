'use client';

import { Plus } from 'lucide-react';

import { CommunityBrandLogo } from './community-brand-logo';
import { useCommunityRightRail } from './community-shell-context';

export function CommunityMobileTopBar({
  showCompose = false,
}: {
  showCompose?: boolean;
}) {
  const { setComposeOpen } = useCommunityRightRail();

  return (
    <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3 lg:hidden">
      <CommunityBrandLogo href="/" showWordmark priority className="h-8 w-8" />
      {showCompose ? (
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          aria-label="Share dua"
          className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(22,163,74,0.16)] transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : (
        <span className="ml-auto" />
      )}
    </div>
  );
}
