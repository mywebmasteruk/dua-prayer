"use client"

import { useState } from "react"
import { HandHeart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DynamicForm } from "@/components/forms/dynamic-form"
import { submitVolunteerApplication } from "@/app/actions/volunteer-applications"
import type { FormRegistry } from "@/lib/form-fields"

const VOLUNTEER_EMAIL = "volunteers@duaprayer.app"

type VolunteerApplySectionProps = {
  registry: FormRegistry
  turnstileSiteKey?: string | null
}

export function VolunteerApplySection({ registry, turnstileSiteKey }: VolunteerApplySectionProps) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const volunteerMailto = `mailto:${VOLUNTEER_EMAIL}?subject=${encodeURIComponent("DuaPrayer volunteer inquiry")}`

  return (
    <>
      <section className="py-8">
        <h2 className="text-lg font-semibold tracking-tight">Get in touch</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Tell us how you&apos;d like to contribute — your skills, availability, and time zone. We&apos;ll reply with
          next steps. Every bit of help keeps this space open for the Ummah.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="lg" className="rounded-full" onClick={() => setOpen(true)}>
            <HandHeart className="h-4 w-4" aria-hidden="true" />
            Apply to Volunteer
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            Opens a short application form. Prefer email?{" "}
            <a href={volunteerMailto} className="font-medium text-primary underline-offset-2 hover:underline">
              {VOLUNTEER_EMAIL}
            </a>
          </p>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border/70 bg-white/95 shadow-2xl backdrop-blur-xl sm:rounded-[1.5rem]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-semibold tracking-tight">Volunteer application</DialogTitle>
            <DialogDescription className="text-sm leading-6">
              Share your skills and availability. We&apos;ll follow up by email.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="rounded-2xl border border-border/60 bg-primary/[0.04] p-5">
              <p className="text-sm font-medium text-foreground">Thanks — your application was submitted.</p>
              <p className="mt-2 text-sm text-muted-foreground">We&apos;ll review it and follow up by email.</p>
            </div>
          ) : (
            <DynamicForm
              formKind="volunteer"
              registry={registry}
              action={submitVolunteerApplication}
              turnstileSiteKey={turnstileSiteKey}
              submitLabel="Submit application"
              onSuccess={() => setSubmitted(true)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
