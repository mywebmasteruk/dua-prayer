import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  variant?: "icon" | "wide"
  className?: string
  /** Set to a path to wrap in a home link. Omit for image-only (no nested anchors). */
  href?: string
  showWordmark?: boolean
  wordmarkClassName?: string
  priority?: boolean
}

const defaultWordmarkClassName = "text-[17px] font-semibold tracking-tight text-foreground"

export function BrandLogo({
  variant = "icon",
  className,
  href,
  showWordmark = false,
  wordmarkClassName = defaultWordmarkClassName,
  priority,
}: BrandLogoProps) {
  const src = variant === "wide" ? "/logo-wide.png" : "/logo-icon.png"
  const width = variant === "wide" ? 220 : 36
  const height = variant === "wide" ? 48 : 36

  const content = (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden={showWordmark}
        width={width}
        height={height}
        className={cn("object-contain", variant === "icon" && "object-left", className)}
        priority={priority}
      />
      {showWordmark && variant === "icon" ? (
        <span className={wordmarkClassName}>DuaPrayer</span>
      ) : null}
    </>
  )

  const lockupClassName = cn(
    "tap-feedback inline-flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    showWordmark && "justify-start",
  )

  if (!href) {
    return <span className={lockupClassName}>{content}</span>
  }

  return (
    <Link href={href} className={lockupClassName} aria-label="DuaPrayer home">
      {content}
    </Link>
  )
}
