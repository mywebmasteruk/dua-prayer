import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandLogo } from "./brand-logo"

export function SidebarBranding({
  tagline,
  logoHref = "/",
}: {
  tagline: string
  logoHref?: string
}) {
  return (
    <div>
      <BrandLogo variant="icon" href={logoHref} showWordmark priority className="h-9 w-9 shrink-0" />
      <p className="mt-2 text-xs leading-snug text-muted-foreground">{tagline}</p>
    </div>
  )
}

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  active = false,
  variant = "default",
}: {
  href: string
  label: string
  icon: LucideIcon
  active?: boolean
  variant?: "default" | "cta"
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex w-full max-w-full items-center gap-3 rounded-full px-3 py-2.5 text-[14px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-4 lg:py-3",
        variant === "cta"
          ? "justify-center -translate-x-1 gap-2 bg-primary text-[14px] font-bold text-primary-foreground hover:bg-primary/90 lg:text-[15px]"
          : cn(
              "hover:bg-muted/60 lg:text-[18px]",
              active ? "font-bold text-foreground" : "font-normal text-foreground/85",
            ),
      )}
    >
      <Icon className="h-[24px] w-[24px] shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  )
}

export function isSidebarPathActive(activePath: string, href: string) {
  if (href === "/") return activePath === "/"
  return activePath === href || activePath.startsWith(`${href}/`)
}
