import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AdminDuaList } from "@/components/admin/admin-dua-list"
import { AdminFilters } from "@/components/admin/admin-filters"
import { getCategories, getAdminDuas } from "../actions/duas"
import { requireAdmin } from "@/lib/auth"

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; category?: string }>
}) {
  const params = await searchParams
  const { user, isAdmin } = await requireAdmin()

  if (!user) redirect("/auth?next=/admin")
  if (!isAdmin) redirect("/auth?error=not_admin")

  const categories = await getCategories()
  const duas = await getAdminDuas({
    search: params.search,
    status: params.status,
    category: params.category,
  })

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header user={user} isAdmin />

      <main className="flex-1 max-w-[691px] mx-auto w-full px-4 pb-8">
        <div className="mb-6 mt-4">
          <h1 className="text-2xl font-semibold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage duas and moderate content</p>
        </div>

        <AdminFilters categories={categories} />
        <AdminDuaList initialDuas={duas} categories={categories} />
      </main>
      <Footer />
    </div>
  )
}
