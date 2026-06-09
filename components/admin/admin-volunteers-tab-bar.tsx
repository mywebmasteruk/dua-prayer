"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export type AdminVolunteersTabId = "applicants" | "roles"

type AdminVolunteersTabBarProps = {
  showApplicantsTab: boolean
  showRolesTab: boolean
}

export function AdminVolunteersTabBar({ showApplicantsTab, showRolesTab }: AdminVolunteersTabBarProps) {
  const pathname = usePathname()
  const activeTab: AdminVolunteersTabId = pathname.startsWith("/admin/volunteers/roles")
    ? "roles"
    : "applicants"

  const tabs: Array<{ id: AdminVolunteersTabId; label: string; href: string }> = []
  if (showApplicantsTab) {
    tabs.push({ id: "applicants", label: "Applicants", href: "/admin/volunteers" })
  }
  if (showRolesTab) {
    tabs.push({ id: "roles", label: "Roles", href: "/admin/volunteers/roles" })
  }

  if (tabs.length <= 1) return null

  return (
    <div
      className="flex overflow-x-auto border-b border-border/70 bg-background [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Volunteer administration"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "relative shrink-0 px-4 py-3 text-sm transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-5 sm:text-[15px]",
              isActive ? "font-semibold text-foreground" : "font-normal text-muted-foreground",
            )}
          >
            {tab.label}
            {isActive ? (
              <span
                className="absolute bottom-0 left-1/2 h-0.5 w-[calc(100%-1rem)] max-w-24 -translate-x-1/2 rounded-full bg-primary"
                aria-hidden="true"
              />
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}
