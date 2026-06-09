import { redirect } from "next/navigation"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminDuaList } from "@/components/admin/admin-dua-list"
import { AdminFilters } from "@/components/admin/admin-filters"
import { getCategories, getAdminDuas } from "../actions/duas"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

function defaultAdminRedirect(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>) {
  if (hasPermission(ctx, "manage_duas")) return null
  if (hasPermission(ctx, "manage_channels")) return "/admin/channels"
  if (hasPermission(ctx, "manage_users")) return "/admin/users"
  if (hasPermission(ctx, "manage_settings")) return "/admin/copy"
  if (hasPermission(ctx, "manage_volunteers")) return "/admin/volunteers"
  if (hasPermission(ctx, "manage_admins")) return "/admin/settings/roles"
  return signInHref({ error: "not_admin" })
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; category?: string }>
}) {
  const params = await searchParams
  const ctx = await getAdminContext()

  if (!ctx) redirect(signInHref({ next: "/admin" }))

  const redirectTo = defaultAdminRedirect(ctx)
  if (redirectTo) redirect(redirectTo)

  if (!hasPermission(ctx, "manage_duas")) redirect(signInHref({ error: "not_admin" }))

  const categories = await getCategories({ includeInactive: true })
  const duas = await getAdminDuas({
    search: params.search,
    status: params.status,
    category: params.category,
  })

  return (
    <InnerPageLayout activePath="/admin" contentClassName="max-w-[691px]">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage duas and moderate content</p>
      </div>

      <AdminFilters categories={categories} />
      <AdminDuaList initialDuas={duas} categories={categories} />
    </InnerPageLayout>
  )
}
