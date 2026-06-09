import { redirect } from "next/navigation"
import { BookOpen } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminDuaList } from "@/components/admin/admin-dua-list"
import { AdminFilters } from "@/components/admin/admin-filters"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { getCategories, getAdminDuas } from "../actions/duas"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"

function defaultAdminRedirect(ctx: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>) {
  if (hasPermission(ctx, "manage_duas")) return null
  if (hasPermission(ctx, "manage_channels")) return "/admin/channels"
  if (hasPermission(ctx, "manage_users")) return "/admin/users"
  if (hasPermission(ctx, "manage_settings")) return "/admin/copy"
  if (hasPermission(ctx, "manage_volunteers")) return "/admin/volunteers"
  if (hasPermission(ctx, "manage_admins")) return "/admin/users/roles"
  if (hasPermission(ctx, "view_analytics")) return "/admin/volunteers/roles"
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
    <InnerPageLayout activePath="/admin">
      <AdminPageHeader
        icon={BookOpen}
        title="Duas"
        description="Review, publish, and moderate community prayer requests."
      />

      <AdminFilters categories={categories} resultCount={duas.length} />
      <AdminDuaList initialDuas={duas} categories={categories} />
    </InnerPageLayout>
  )
}
