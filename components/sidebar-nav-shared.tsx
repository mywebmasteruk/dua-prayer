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
      <p className="mt-2 text-xs leading-snug text-muted-foreground/75">{tagline}</p>
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
        "group flex w-full max-w-full items-center gap-3 rounded-full px-3 py-2.5 text-[14px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-4 lg:py-2.5",
        variant === "cta"
          ? "justify-center -translate-x-1 gap-2 bg-primary/90 text-[14px] font-semibold text-primary-foreground shadow-sm hover:bg-primary lg:text-[15px]"
          : cn(
              "hover:bg-white lg:text-[16px]",
              active ? "font-bold text-primary" : "font-normal text-foreground/55 hover:text-foreground/75",
            ),
      )}
    >
      <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  )
}

export function isSidebarPathActive(activePath: string, href: string) {
  if (href === "/") return activePath === "/"
  return activePath === href || activePath.startsWith(`${href}/`)
}
