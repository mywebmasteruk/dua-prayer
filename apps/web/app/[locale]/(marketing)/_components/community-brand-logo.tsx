import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@kit/ui/utils';

export function CommunityBrandLogo({
  href = '/',
  showWordmark = false,
  className,
  priority = false,
}: {
  href?: string;
  showWordmark?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const content = (
    <>
      <Image
        src="/logo-icon.png"
        alt=""
        aria-hidden={showWordmark}
        width={36}
        height={36}
        className={cn('h-9 w-9 shrink-0 object-contain object-left', className)}
        priority={priority}
      />
      {showWordmark ? (
        <span className="text-[17px] font-semibold tracking-tight text-foreground">
          DuaPrayer
        </span>
      ) : null}
    </>
  );

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="DuaPrayer home"
    >
      {content}
    </Link>
  );
}
