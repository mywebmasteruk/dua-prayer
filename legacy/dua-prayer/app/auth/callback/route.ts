import { createServerSupabaseClient } from "@/lib/supabase/server"
import { accountStatusPostAuthRedirect, getProfileAccessState } from "@/lib/account-status"
import { resolveAdminLandingPath, userHasAdminAccess } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import { safeNextPath } from "@/lib/safe-redirect"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = safeNextPath(requestUrl.searchParams.get("next"))

  if (!code) {
    return NextResponse.redirect(new URL(signInHref(), requestUrl.origin))
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL(signInHref({ error: error.message }), requestUrl.origin))
  }

  const access = await getProfileAccessState(data.user.id)
  const accountStatusDestination = access ? accountStatusPostAuthRedirect(access.accountStatus) : null
  if (accountStatusDestination) {
    return NextResponse.redirect(new URL(accountStatusDestination, requestUrl.origin))
  }

  const user = { id: data.user.id, email: data.user.email }
  const wantsAdmin = next === "/admin" || next.startsWith("/admin")

  if (wantsAdmin) {
    const hasAccess = await userHasAdminAccess(user)
    if (!hasAccess) {
      return NextResponse.redirect(new URL(signInHref({ error: "not_admin" }), requestUrl.origin))
    }
    if (next === "/admin" || next === "/admin/") {
      const landing = await resolveAdminLandingPath(user)
      return NextResponse.redirect(new URL(landing, requestUrl.origin))
    }
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  const hasAccess = await userHasAdminAccess(user)
  const destination =
    hasAccess && next === "/" ? await resolveAdminLandingPath(user) : next

  return NextResponse.redirect(new URL(destination, requestUrl.origin))
}
