import Link from "next/link"
import { AdminSection } from "@/components/admin/admin-section"
import { VolunteerFormSettings } from "@/components/admin/volunteer-form-settings"

type IntegrationFilloutTabProps = {
  initialValue: string
}

export function IntegrationFilloutTab({ initialValue }: IntegrationFilloutTabProps) {
  return (
    <AdminSection
      title="Volunteer application form"
      description={
        <>
          Connect a Fillout form for the &quot;Apply to Volunteer&quot; button on{" "}
          <Link href="/volunteer" className="text-primary underline-offset-2 hover:underline">
            /volunteer
          </Link>
          . Point Fillout&apos;s webhook to{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/webhooks/volunteer</code> (see the Volunteer
          webhook tab). Review submissions in{" "}
          <Link href="/admin/volunteers" className="text-primary underline-offset-2 hover:underline">
            Admin → Volunteers
          </Link>
          .
        </>
      }
      contentClassName="pt-0"
    >
      <VolunteerFormSettings initialValue={initialValue} />
    </AdminSection>
  )
}
