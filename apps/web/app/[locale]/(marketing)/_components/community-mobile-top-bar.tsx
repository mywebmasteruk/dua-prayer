'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Plus, Search, X } from 'lucide-react';

import { Input } from '@kit/ui/input';

import { CommunityBrandLogo } from './community-brand-logo';
import { useCommunityRightRail } from './community-shell-context';

export function CommunityMobileTopBar({
  showCompose = false,
}: {
  showCompose?: boolean;
}) {
  const router = useRouter();
  const { setComposeOpen, searchOpen, setSearchOpen } = useCommunityRightRail();
  const [query, setQuery] = useState('');

  return (
    <div className="lg:hidden">
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <CommunityBrandLogo href="/" showWordmark priority className="h-8 w-8" />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label={searchOpen ? 'Hide search' : 'Search'}
            aria-expanded={searchOpen}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {searchOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Search className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          {showCompose ? (
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              aria-label="Share dua"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(22,163,74,0.16)] transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {searchOpen ? (
        <form
          className="border-b border-border/70 px-4 pb-3 pt-2"
          onSubmit={(event) => {
            event.preventDefault();
            const next = query.trim();
            setSearchOpen(false);
            router.push(next ? `/?q=${encodeURIComponent(next)}` : '/');
          }}
        >
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search duas…"
            aria-label="Search duas"
            className="rounded-full bg-background"
            autoFocus
          />
        </form>
      ) : null}
    </div>
  );
}
