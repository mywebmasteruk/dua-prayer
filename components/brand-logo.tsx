import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  variant?: "icon" | "wide"
  className?: string
  href?: string
  priority?: boolean
}

export function BrandLogo({ variant = "icon", className, href = "/", priority }: BrandLogoProps) {
  const src = variant === "wide" ? "/logo-wide.png" : "/logo-icon.png"
  const width = variant === "wide" ? 220 : 36
  const height = variant === "wide" ? 48 : 36

  const image = (
    <Image
      src={src}
      alt="DuaPrayer"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      priority={priority}
    />
  )

  if (!href) return image

  return (
    <Link href={href} className="tap-feedback inline-flex shrink-0 items-center" aria-label="DuaPrayer home">
      {image}
    </Link>
  )
}
