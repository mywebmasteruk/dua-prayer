"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { LayoutGrid, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { ChannelApplyForm } from "@/components/channels/channel-apply-form"
import { createFilloutEmbedSession, FILLOUT_EMBED_ORIGIN } from "@/lib/fillout"
import { signInHref } from "@/lib/auth-modal"

const CHANNEL_CONTACT_EMAIL = "volunteers@duaprayer.app"

type ChannelApplySectionProps = {
  filloutSrc: string | null
  isSignedIn: boolean
  pendingChannelName?: string | null
  /** When true, opens the form inline instead of behind a button + dialog. */
  inline?: boolean
}

export function ChannelApplySection({
  filloutSrc,
  isSignedIn,
  pendingChannelName,
  inline = false,
}: ChannelApplySectionProps) {
  const [open, setOpen] = useState(inline)
  const [submittedInline, setSubmittedInline] = useState(false)
  const contactMailto = `mailto:${CHANNEL_CONTACT_EMAIL}?subject=${encodeURIComponent("DuaPrayer channel application")}`

  const filloutEmbed = useMemo(
    () => (filloutSrc ? createFilloutEmbedSession(filloutSrc) : null),
    [filloutSrc],
  )

  const handleFilloutSubmit = useCallback(() => {
    if (!inline) setOpen(false)
    toast({
      title: "Application submitted",
      description: "Thanks — we'll review your channel application and follow up by email.",
    })
  }, [inline])

  useEffect(() => {
    if ((!open && !inline) || !filloutEmbed?.listensForSubmit) return

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== FILLOUT_EMBED_ORIGIN) return

      const data = event.data
      if (
        data &&
        typeof data === "object" &&
        "type" in data &&
        "embedId" in data &&
        data.type === "form_submit" &&
        data.embedId === filloutEmbed.embedId
      ) {
        handleFilloutSubmit()
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [open, inline, filloutEmbed, handleFilloutSubmit])

  const handleApplyClick = () => {
    if (!isSignedIn) {
      window.location.href = signInHref({ next: "/channels/apply" })
      return
    }
    if (filloutSrc) {
      setOpen(true)
      return
    }
    window.location.href = contactMailto
  }

  const filloutFrame = filloutSrc ? (
    <div className={inline ? "w-full" : "relative min-h-[420px] w-full bg-muted/20"}>
      <iframe
        src={filloutEmbed?.iframeSrc ?? filloutSrc}
        title="DuaPrayer channel application"
        className={
          inline
            ? "h-[min(75vh,720px)] w-full rounded-2xl border border-border/60 bg-muted/20"
            : "h-[min(70vh,640px)] w-full border-0"
        }
        loading="lazy"
        allow="clipboard-write"
      />
    </div>
  ) : (
    <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">
        The external Fillout form isn&apos;t configured. Use the in-app application below or email us instead.
      </p>
      <Button asChild className="rounded-full">
        <a href={contactMailto}>
          <Mail className="h-4 w-4" aria-hidden="true" />
          Email {CHANNEL_CONTACT_EMAIL}
        </a>
      </Button>
    </div>
  )

  const pendingMessage = pendingChannelName || submittedInline

  if (inline) {
    return (
      <section className="py-8">
        <h2 className="text-lg font-semibold tracking-tight">Application form</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Apply to open a channel — we&apos;ll review your application and follow up by email.
        </p>

        {!isSignedIn ? (
          <div className="mt-6 rounded-2xl border border-border/60 bg-muted/20 p-5">
            <p className="text-sm text-muted-foreground">Sign in to submit a channel application.</p>
            <Button asChild className="mt-4 rounded-full">
              <Link href={signInHref({ next: "/channels/apply" })}>Sign in to apply</Link>
            </Button>
          </div>
        ) : pendingMessage ? (
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
        ) : (
          <div className="mt-6 space-y-6">
            <ChannelApplyForm onSubmitted={() => setSubmittedInline(true)} />
            {filloutSrc ? (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Or use the external form
                </p>
                {filloutFrame}
              </div>
            ) : null}
          </div>
        )}
      </section>
    )
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-border/70 bg-white/95 p-0 shadow-2xl backdrop-blur-xl sm:rounded-[1.5rem]">
          <DialogHeader className="space-y-1 border-b border-border/60 px-6 pb-4 pt-6 pr-12">
            <DialogTitle className="text-xl font-semibold tracking-tight">Channel application</DialogTitle>
            <DialogDescription className="text-sm leading-6">
              Apply to open a channel — we&apos;ll review your application and follow up by email.
            </DialogDescription>
          </DialogHeader>
          {isSignedIn && !pendingChannelName ? (
            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
              <ChannelApplyForm onSubmitted={() => setOpen(false)} />
            </div>
          ) : (
            filloutFrame
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
