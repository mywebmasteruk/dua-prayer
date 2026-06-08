import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/"

  if (!code) {
    return NextResponse.redirect(new URL("/auth", requestUrl.origin))
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const authUrl = new URL("/auth", requestUrl.origin)
    authUrl.searchParams.set("error", error.message)
    return NextResponse.redirect(authUrl)
  }

  const wantsAdmin = next === "/admin" || next.startsWith("/admin")
  if (wantsAdmin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", data.user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL("/auth?error=not_admin", requestUrl.origin))
    }
    return NextResponse.redirect(new URL("/admin", requestUrl.origin))
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single()

  const destination = profile?.is_admin && next === "/" ? "/admin" : next
  return NextResponse.redirect(new URL(destination, requestUrl.origin))
}
