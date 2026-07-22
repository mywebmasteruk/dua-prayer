import { cn } from "@/lib/utils"

type AdminStatusBadgeProps = {
  label: string
  tone?: "success" | "warning" | "danger" | "neutral"
  className?: string
}

const toneClasses: Record<NonNullable<AdminStatusBadgeProps["tone"]>, string> = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  neutral: "bg-secondary text-secondary-foreground",
}

export function AdminStatusBadge({ label, tone = "neutral", className }: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  )
}
