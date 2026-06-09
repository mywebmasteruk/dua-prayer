import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Settings2, Shield } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminNav } from "@/components/admin/admin-nav"
import { VolunteerFormSettings } from "@/components/admin/volunteer-form-settings"
import { getVolunteerFilloutSettingForAdmin } from "@/app/actions/settings"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default async function AdminSettingsPage() {
  const ctx = await getAdminContext()

  if (!ctx) redirect("/auth?next=/admin/settings")

  const canVolunteer =
    hasPermission(ctx, "manage_settings") || hasPermission(ctx, "manage_volunteers")
  const canManageAdmins = ctx.isFoundingAdmin || hasPermission(ctx, "manage_admins")

  if (!canVolunteer && !canManageAdmins) redirect("/auth?error=not_admin")

  const volunteerFilloutValue = canVolunteer ? await getVolunteerFilloutSettingForAdmin() : ""

  return (
    <InnerPageLayout activePath="/admin" contentClassName="max-w-[691px]">
      <Link
        href={hasPermission(ctx, "manage_duas") ? "/admin" : "/"}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>
      <div className="mb-6 flex items-center gap-2">
        <Settings2 className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>
      <p className="-mt-4 mb-6 text-sm text-muted-foreground">Configure site-wide options for public pages.</p>

      <AdminNav permissions={ctx.permissions} isFoundingAdmin={ctx.isFoundingAdmin} active="settings" />

      {canManageAdmins && (
        <section className="mb-6 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Roles &amp; Access</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Invite admins, assign roles, and review permissions.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-full">
              <Link href="/admin/settings/roles">
                <Shield className="h-4 w-4" aria-hidden="true" />
                Manage roles
              </Link>
            </Button>
          </div>
        </section>
      )}

      {hasPermission(ctx, "manage_settings") && (
        <section className="mb-6 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Site copy</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit sidebar, footer, and About page text.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-full">
              <Link href="/admin/copy">Edit copy</Link>
            </Button>
          </div>
        </section>
      )}

      {canVolunteer && (
        <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Volunteer application form</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect a Fillout form for the &quot;Apply to Volunteer&quot; button on{" "}
            <Link href="/volunteer" className="text-primary underline-offset-2 hover:underline">
              /volunteer
            </Link>
            .
          </p>
          <div className="mt-6">
            <VolunteerFormSettings initialValue={volunteerFilloutValue} />
          </div>
        </section>
      )}
    </InnerPageLayout>
  )
}
