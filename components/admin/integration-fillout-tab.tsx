"use client"

import Link from "next/link"
import { AdminSection } from "@/components/admin/admin-section"
import { VolunteerFormSettings } from "@/components/admin/volunteer-form-settings"
import { ChannelFormSettings } from "@/components/admin/channel-form-settings"

type IntegrationFilloutTabProps = {
  volunteerFilloutValue: string
  channelFilloutValue: string
  canManageVolunteer: boolean
  canManageChannels: boolean
}

export function IntegrationFilloutTab({
  volunteerFilloutValue,
  channelFilloutValue,
  canManageVolunteer,
  canManageChannels,
}: IntegrationFilloutTabProps) {
  return (
    <div className="space-y-10">
      <AdminSection
        title="Volunteer application form"
        description={
          <>
            Connect a Fillout form for the &quot;Apply to Volunteer&quot; button on{" "}
            <Link href="/volunteer" className="text-primary underline-offset-2 hover:underline">
              /volunteer
            </Link>
            . Point Fillout&apos;s webhook in{" "}
            <Link href="/admin/integration?tab=webhooks" className="text-primary underline-offset-2 hover:underline">
              Integration → Webhooks
            </Link>
            . Review submissions in{" "}
            <Link href="/admin/volunteers" className="text-primary underline-offset-2 hover:underline">
              Admin → Volunteers
            </Link>
            .
          </>
        }
        contentClassName="pt-0"
      >
        {canManageVolunteer ? (
          <VolunteerFormSettings initialValue={volunteerFilloutValue} />
        ) : (
          <p className="text-sm text-muted-foreground">You don&apos;t have permission to manage volunteer form settings.</p>
        )}
      </AdminSection>

      <AdminSection
        title="Channel application form"
        description={
          <>
            Optional Fillout embed for{" "}
            <Link href="/channels/apply" className="text-primary underline-offset-2 hover:underline">
              /channels/apply
            </Link>
            . Signed-in users can also submit in-app applications, which appear in the Applications tab in{" "}
            <Link href="/admin/channels" className="text-primary underline-offset-2 hover:underline">
              Admin → Channels
            </Link>
            . For webhook setup, see{" "}
            <Link href="/admin/integration?tab=webhooks" className="text-primary underline-offset-2 hover:underline">
              Integration → Webhooks
            </Link>
            .
          </>
        }
        contentClassName="pt-0"
      >
        {canManageChannels ? (
          <ChannelFormSettings initialValue={channelFilloutValue} />
        ) : (
          <p className="text-sm text-muted-foreground">You don&apos;t have permission to manage channel form settings.</p>
        )}
      </AdminSection>
    </div>
  )
}
