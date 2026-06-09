import Link from "next/link"
import { redirect } from "next/navigation"
import { CreditCard, Settings2, Shield } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminNav } from "@/components/admin/admin-nav"
import { VolunteerFormSettings } from "@/components/admin/volunteer-form-settings"
import { getVolunteerFilloutSettingForAdmin } from "@/app/actions/settings"
import { getAdminContext, hasPermission } from "@/lib/auth"
import { signInHref } from "@/lib/auth-modal"
import { Button } from "@/components/ui/button"

export default async function AdminSettingsPage() {
  const ctx = await getAdminContext()

  if (!ctx) redirect(signInHref({ next: "/admin/settings" }))

  const canVolunteer =
    hasPermission(ctx, "manage_settings") || hasPermission(ctx, "manage_volunteers")
  const canManageAdmins = ctx.isFoundingAdmin || hasPermission(ctx, "manage_admins")
  const canManageStripe = ctx.isFoundingAdmin || hasPermission(ctx, "manage_settings")

  if (!canVolunteer && !canManageAdmins) redirect(signInHref({ error: "not_admin" }))

  const volunteerFilloutValue = canVolunteer ? await getVolunteerFilloutSettingForAdmin() : ""

  return (
    <InnerPageLayout activePath="/admin" contentClassName="max-w-[691px]">
      <div className="mb-2 flex items-center gap-2">
        <Settings2 className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Configure site-wide options for public pages.</p>

      <AdminNav permissions={ctx.permissions} isFoundingAdmin={ctx.isFoundingAdmin} active="settings" />

      {canManageStripe && (
        <section className="mb-6 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Stripe donations</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Paste API keys from the masjidweb.com Stripe account to enable{" "}
                <Link href="/donate" className="text-primary underline-offset-2 hover:underline">
                  /donate
                </Link>
                .
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-full">
              <Link href="/admin/settings/stripe">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Stripe settings
              </Link>
            </Button>
          </div>
        </section>
      )}

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
