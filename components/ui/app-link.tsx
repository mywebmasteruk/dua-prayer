"use client"

import * as React from "react"
import Link, { type LinkProps } from "next/link"
import { cn } from "@/lib/utils"

type AppLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    className?: string
  }

const AppLink = React.forwardRef<HTMLAnchorElement, AppLinkProps>(
  ({ className, prefetch = true, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        prefetch={prefetch}
        className={cn("tap-feedback", className)}
        {...props}
      />
    )
  },
)
AppLink.displayName = "AppLink"

export { AppLink }
