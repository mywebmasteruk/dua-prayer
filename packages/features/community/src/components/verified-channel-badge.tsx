'use client';

import { ShieldCheck } from 'lucide-react';

import { cn } from '@kit/ui/utils';

export function VerifiedChannelBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center text-primary', className)}
      aria-label="Verified channel"
      title="Verified channel"
    >
      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}
