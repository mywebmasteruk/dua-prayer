import Link from "next/link"
import { redirect } from "next/navigation"
import { CreditCard, Settings2, Shield, Type } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSection } from "@/components/admin/admin-section"
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
    <InnerPageLayout activePath="/admin/settings">
      <AdminPageHeader
        icon={Settings2}
        title="Settings"
        description="Configure site-wide options for public pages and admin tools."
      />

      <div className="space-y-5">
        {canManageStripe && (
          <AdminSection
            title="Stripe donations"
            description={
              <>
                Paste API keys from the masjidweb.com Stripe account to enable{" "}
                <Link href="/donate" className="text-primary underline-offset-2 hover:underline">
                  /donate
                </Link>
                .
              </>
            }
            action={
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link href="/admin/settings/stripe">
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  Stripe settings
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

        {hasPermission(ctx, "manage_settings") && (
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

        {canVolunteer && (
          <AdminSection
            title="Volunteer application form"
            description={
              <>
                Connect a Fillout form for the &quot;Apply to Volunteer&quot; button on{" "}
                <Link href="/volunteer" className="text-primary underline-offset-2 hover:underline">
                  /volunteer
                </Link>
                . Point Fillout&apos;s webhook to{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/webhooks/volunteer</code> (see{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/volunteer-webhook.md</code>). Review
                submissions in{" "}
                <Link href="/admin/volunteers" className="text-primary underline-offset-2 hover:underline">
                  Admin → Volunteers
                </Link>
                .
              </>
            }
            contentClassName="pt-0"
          >
            <VolunteerFormSettings initialValue={volunteerFilloutValue} />
          </AdminSection>
        )}
      </div>
    </InnerPageLayout>
  )
}
