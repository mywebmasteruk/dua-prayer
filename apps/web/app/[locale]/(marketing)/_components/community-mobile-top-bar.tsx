import { CommunityBrandLogo } from './community-brand-logo';

export function CommunityMobileTopBar() {
  return (
    <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3 lg:hidden">
      <CommunityBrandLogo href="/" showWordmark priority className="h-8 w-8" />
    </div>
  );
}
