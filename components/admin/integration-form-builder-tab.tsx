"use client"

import { AdminSection } from "@/components/admin/admin-section"
import { FormBuilder } from "@/components/admin/form-builder"
import { updateChannelFormRegistry, updateVolunteerFormRegistry } from "@/app/actions/settings"
import { REQUIRED_CHANNEL_BINDINGS, REQUIRED_VOLUNTEER_BINDINGS, type FormRegistry } from "@/lib/form-fields"

const CHANNEL_BINDINGS = [
  { value: "none", label: "None (store only)" },
  { value: "channelName", label: "Channel name" },
  { value: "applicantName", label: "Applicant name" },
  { value: "email", label: "Email" },
  { value: "handle", label: "Handle" },
  { value: "description", label: "Description" },
]

const VOLUNTEER_BINDINGS = [
  { value: "none", label: "None (store only)" },
  { value: "email", label: "Email" },
  { value: "name", label: "Name" },
]

type IntegrationFormBuilderTabProps = {
  channelRegistry: FormRegistry
  volunteerRegistry: FormRegistry
  canManageChannels: boolean
  canManageVolunteer: boolean
}

export function IntegrationFormBuilderTab({
  channelRegistry,
  volunteerRegistry,
  canManageChannels,
  canManageVolunteer,
}: IntegrationFormBuilderTabProps) {
  return (
    <div className="space-y-10">
      <AdminSection
        title="Volunteer application form"
        description="Fields shown on /volunteer. Add, remove, reorder, or relabel fields — changes apply instantly with no code changes."
        contentClassName="pt-0"
      >
        {canManageVolunteer ? (
          <FormBuilder
            title="Volunteer form fields"
            description="Email is required and cannot be removed."
            initialRegistry={volunteerRegistry}
            bindingOptions={VOLUNTEER_BINDINGS}
            requiredBindings={REQUIRED_VOLUNTEER_BINDINGS}
            action={updateVolunteerFormRegistry}
          />
        ) : (
          <p className="text-sm text-muted-foreground">You don&apos;t have permission to manage the volunteer form.</p>
        )}
      </AdminSection>

      <AdminSection
        title="Channel application form"
        description="Fields shown on /channels/apply. Email, channel name, and description are required system fields."
        contentClassName="pt-0"
      >
        {canManageChannels ? (
          <FormBuilder
            title="Channel form fields"
            description="Email, channel name, and description are required and cannot be removed."
            initialRegistry={channelRegistry}
            bindingOptions={CHANNEL_BINDINGS}
            requiredBindings={REQUIRED_CHANNEL_BINDINGS}
            action={updateChannelFormRegistry}
          />
        ) : (
          <p className="text-sm text-muted-foreground">You don&apos;t have permission to manage the channel form.</p>
        )}
      </AdminSection>
    </div>
  )
}
