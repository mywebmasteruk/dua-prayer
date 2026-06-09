"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { HandHeart, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { createFilloutEmbedSession, FILLOUT_EMBED_ORIGIN } from "@/lib/fillout"

const VOLUNTEER_EMAIL = "volunteers@duaprayer.app"

type VolunteerApplySectionProps = {
  filloutSrc: string | null
}

export function VolunteerApplySection({ filloutSrc }: VolunteerApplySectionProps) {
  const [open, setOpen] = useState(false)
  const volunteerMailto = `mailto:${VOLUNTEER_EMAIL}?subject=${encodeURIComponent("DuaPrayer volunteer inquiry")}`

  const filloutEmbed = useMemo(
    () => (filloutSrc ? createFilloutEmbedSession(filloutSrc) : null),
    [filloutSrc],
  )

  const handleFilloutSubmit = useCallback(() => {
    setOpen(false)
    toast({
      title: "Application submitted",
      description: "Thanks — we'll be in touch by email.",
    })
  }, [])

  useEffect(() => {
    if (!open || !filloutEmbed?.listensForSubmit) return

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
  }, [open, filloutEmbed, handleFilloutSubmit])

  const handleApplyClick = () => {
    if (filloutSrc) {
      setOpen(true)
      return
    }
    window.location.href = volunteerMailto
  }

  return (
    <>
      <section className="py-8">
        <h2 className="text-lg font-semibold tracking-tight">Get in touch</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Tell us how you&apos;d like to contribute — your skills, availability, and time zone. We&apos;ll reply with
          next steps. Every bit of help keeps this space open for the Ummah.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="lg" className="rounded-full" onClick={handleApplyClick}>
            <HandHeart className="h-4 w-4" aria-hidden="true" />
            Apply to Volunteer
          </Button>
          <p className="text-xs leading-5 text-muted-foreground">
            {filloutSrc ? (
              <>Opens a short application form. Prefer email? </>
            ) : (
              <>Application form coming soon — email us for now. </>
            )}
            <a href={volunteerMailto} className="font-medium text-primary underline-offset-2 hover:underline">
              {VOLUNTEER_EMAIL}
            </a>
          </p>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-border/70 bg-white/95 p-0 shadow-2xl backdrop-blur-xl sm:rounded-[1.5rem]">
          <DialogHeader className="space-y-1 border-b border-border/60 px-6 pb-4 pt-6 pr-12">
            <DialogTitle className="text-xl font-semibold tracking-tight">Volunteer application</DialogTitle>
            <DialogDescription className="text-sm leading-6">
              Share your skills and availability. We&apos;ll follow up by email.
            </DialogDescription>
          </DialogHeader>

          {filloutSrc ? (
            <div className="relative min-h-[420px] w-full bg-muted/20">
              <iframe
                src={filloutEmbed?.iframeSrc ?? filloutSrc}
                title="DuaPrayer volunteer application"
                className="h-[min(70vh,640px)] w-full border-0"
                loading="lazy"
                allow="clipboard-write"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                The volunteer form isn&apos;t configured yet. Please email us instead.
              </p>
              <Button asChild className="rounded-full">
                <a href={volunteerMailto}>
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Email {VOLUNTEER_EMAIL}
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
