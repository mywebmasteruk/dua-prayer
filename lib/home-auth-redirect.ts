import { signInHref } from "@/lib/auth-modal"
import { safeNextPath } from "@/lib/safe-redirect"

function isAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/")
}

export function resolveSignedInSignInRedirect({
  accountStatusDestination,
  isAdmin,
  next,
}: {
  accountStatusDestination?: string | null
  isAdmin: boolean
  next?: string | null
}): string {
  if (accountStatusDestination) return accountStatusDestination

  const safeNext = safeNextPath(next)
  if (!isAdminPath(safeNext)) return "/"

  return isAdmin ? safeNext : signInHref({ error: "not_admin" })
}
