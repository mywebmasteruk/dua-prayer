import { cn } from "@/lib/utils"
import { BrandLogo } from "./brand-logo"

interface PageLogoLinkProps {
  className?: string
}

/** Minimal home link — not a sticky header bar. */
export function PageLogoLink({ className }: PageLogoLinkProps) {
  return (
    <div className={cn(className)}>
      <BrandLogo variant="icon" href="/" showWordmark priority className="h-9 w-9 shrink-0" />
    </div>
  )
}
