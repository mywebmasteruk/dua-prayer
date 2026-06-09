import Link from "next/link"
import { redirect } from "next/navigation"
import { Plug, Settings2, Shield, Type } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSection } from "@/components/admin/admin-section"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import { Button } from "@/components/ui/button"

export default async function AdminSettingsPage() {
  const ctx = await getAdminContext()

  if (!ctx) redirect(signInHref({ next: "/admin/settings" }))

  const canManageSettings = ctx.isFoundingAdmin || hasPermission(ctx, "manage_settings")
  const canManageAdmins = ctx.isFoundingAdmin || hasPermission(ctx, "manage_admins")

  if (!canManageSettings && !canManageAdmins) redirect(signInHref({ error: "not_admin" }))

  return (
    <InnerPageLayout activePath="/admin/settings">
      <AdminPageHeader
        icon={Settings2}
        title="Settings"
        description="Site-wide admin options. Integrations live under Integration in the sidebar."
      />

      <div className="space-y-5">
        {(canManageSettings || hasPermission(ctx, "manage_volunteers")) && (
          <AdminSection
            title="Integrations"
            description="Stripe donations, Fillout volunteer forms, webhooks, Supabase, and auth configuration."
            action={
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link href="/admin/integration">
                  <Plug className="h-4 w-4" aria-hidden="true" />
                  Open Integration
                </Link>
              </Button>
            }
          />
        )}

        {canManageAdmins && (
          <AdminSection
            title="Roles & Access"
            description="Invite admins, assign roles, and review permissions."
            action={
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link href="/admin/settings/roles">
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  Manage roles
                </Link>
              </Button>
            }
          />
        )}

        {canManageSettings && (
          <AdminSection
            title="Site copy"
            description="Edit sidebar, footer, and About page text."
            action={
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link href="/admin/copy">
                  <Type className="h-4 w-4" aria-hidden="true" />
                  Edit copy
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </InnerPageLayout>
  )
}
