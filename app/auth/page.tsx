import { getServerUser } from "@/lib/server-user"
import { redirect } from "next/navigation"
import { signInHref } from "@/lib/auth-modal"

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string; next?: string }>
}) {
  const params = await searchParams
  const user = await getServerUser()

  if (user && params.next === "/admin") redirect("/admin")
  if (user) redirect("/")

  redirect(
    signInHref({
      next: params.next,
      error: params.error,
      reset: params.reset === "success" ? "success" : undefined,
    }),
  )
}
