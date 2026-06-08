import Link from "next/link"
import { redirect } from "next/navigation"
import { Settings2 } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import { AdminDuaList } from "@/components/admin/admin-dua-list"
import { AdminFilters } from "@/components/admin/admin-filters"
import { AdminNav } from "@/components/admin/admin-nav"
import { getCategories, getAdminDuas } from "../actions/duas"
import { getAdminContext, hasPermission } from "@/lib/auth"

function defaultAdminRedirect(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>) {
  if (hasPermission(ctx, "manage_duas")) return null
  if (hasPermission(ctx, "manage_settings") || hasPermission(ctx, "manage_volunteers")) {
    return "/admin/settings"
  }
  if (hasPermission(ctx, "manage_admins")) return "/admin/settings/roles"
  return "/auth?error=not_admin"
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; category?: string }>
}) {
  const params = await searchParams
  const ctx = await getAdminContext()

  if (!ctx) redirect("/auth?next=/admin")

  const redirectTo = defaultAdminRedirect(ctx)
  if (redirectTo) redirect(redirectTo)

  if (!hasPermission(ctx, "manage_duas")) redirect("/auth?error=not_admin")

  const categories = await getCategories()
  const duas = await getAdminDuas({
    search: params.search,
    status: params.status,
    category: params.category,
  })

  const canAccessSettings =
    hasPermission(ctx, "manage_settings") ||
    hasPermission(ctx, "manage_volunteers") ||
    hasPermission(ctx, "manage_admins")

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header user={ctx.user} isAdmin />

      <main className="flex-1 max-w-[691px] mx-auto w-full px-4 pb-8">
        <div className="mb-6 mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage duas and moderate content</p>
          </div>
          {canAccessSettings && (
            <Button variant="outline" size="sm" asChild className="rounded-full">
              <Link href="/admin/settings">
                <Settings2 className="h-4 w-4" aria-hidden="true" />
                Settings
              </Link>
            </Button>
          )}
        </div>

        <AdminNav permissions={ctx.permissions} isFoundingAdmin={ctx.isFoundingAdmin} active="dashboard" />

        <AdminFilters categories={categories} />
        <AdminDuaList initialDuas={duas} categories={categories} />
      </main>
      <Footer />
    </div>
  )
}
