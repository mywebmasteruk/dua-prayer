"use client"

import { useState } from "react"
import Link from "next/link"
import { LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DynamicForm } from "@/components/forms/dynamic-form"
import { submitChannelApplication } from "@/app/actions/channel-applications"
import { signInHref } from "@/lib/auth-modal"
import type { FormRegistry } from "@/lib/form-fields"

const CHANNEL_CONTACT_EMAIL = "volunteers@duaprayer.app"

type ChannelApplySectionProps = {
  registry: FormRegistry
  isSignedIn: boolean
  userEmail?: string | null
  pendingChannelName?: string | null
  turnstileSiteKey?: string | null
  /** When true, opens the form inline instead of behind a button + dialog. */
  inline?: boolean
}

export function ChannelApplySection({
  registry,
  isSignedIn,
  userEmail,
  pendingChannelName,
  turnstileSiteKey,
  inline = false,
}: ChannelApplySectionProps) {
  const [open, setOpen] = useState(inline)
  const [submitted, setSubmitted] = useState(false)
  const contactMailto = `mailto:${CHANNEL_CONTACT_EMAIL}?subject=${encodeURIComponent("DuaPrayer channel application")}`

  const formEl = (
    <DynamicForm
      formKind="channel"
      registry={registry}
      action={submitChannelApplication}
      prefill={{ email: isSignedIn ? userEmail : null }}
      turnstileSiteKey={turnstileSiteKey}
      submitLabel="Submit application"
      onSuccess={() => {
        setSubmitted(true)
        if (!inline) setOpen(false)
      }}
    />
  )

  const pendingMessage = pendingChannelName || submitted

  const pendingBlock = (
    <div className="mt-6 rounded-2xl border border-border/60 bg-primary/[0.04] p-5">
      <p className="text-sm font-medium text-foreground">
        {pendingChannelName
          ? `Your application for “${pendingChannelName}” is under review.`
          : "Your channel application was submitted and is under review."}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        We&apos;ll email you when it&apos;s approved or if we need more information.
      </p>
    </div>
  )

  if (inline) {
    return (
      <section className="py-8">
        <h2 className="text-lg font-semibold tracking-tight">Application form</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Apply to open a channel — we&apos;ll review your application and follow up by email.
        </p>

        {!isSignedIn ? (
          <div className="mt-6 rounded-2xl border border-border/60 bg-muted/20 p-5">
            <p className="text-sm font-medium text-foreground">Log in or create an account before applying.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              After you sign in, we&apos;ll bring you back here to complete the channel application form.
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link href={signInHref({ next: "/channels/apply" })}>Log in or create account</Link>
            </Button>
          </div>
        ) : pendingMessage ? (
          pendingBlock
        ) : (
          <div className="mt-6">{formEl}</div>
        )}
      </section>
    )
  }

  const handleApplyClick = () => {
    if (!isSignedIn) {
      window.location.href = signInHref({ next: "/channels/apply" })
      return
    }
    setOpen(true)
  }

  return (
    <>
      <section className="py-8">
        <h2 className="text-lg font-semibold tracking-tight">Apply to open a channel</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Imams and community teams can request a shared space for duas and collective ameen. Tell us about your
          community — we&apos;ll review your application and follow up by email.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="lg" className="rounded-full" onClick={handleApplyClick}>
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            {isSignedIn ? "Start application" : "Sign in to apply"}
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            Prefer email?{" "}
            <a href={contactMailto} className="font-medium text-primary underline-offset-2 hover:underline">
              {CHANNEL_CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border/70 bg-white/95 shadow-2xl backdrop-blur-xl sm:rounded-[1.5rem]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-semibold tracking-tight">Channel application</DialogTitle>
            <DialogDescription className="text-sm leading-6">
              Apply to open a channel — we&apos;ll review your application and follow up by email.
            </DialogDescription>
          </DialogHeader>
          {submitted ? pendingBlock : formEl}
        </DialogContent>
      </Dialog>
    </>
  )
}
