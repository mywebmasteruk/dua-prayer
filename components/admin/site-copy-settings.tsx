"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { updateSiteCopy } from "@/app/actions/site-copy"
import { SITE_COPY_LABELS, type SiteCopy, type SiteCopyKey } from "@/lib/site-copy"

type SiteCopySettingsProps = {
  initialCopy: SiteCopy
}

const COPY_KEYS = Object.keys(SITE_COPY_LABELS) as SiteCopyKey[]

export function SiteCopySettings({ initialCopy }: SiteCopySettingsProps) {
  const [copy, setCopy] = useState(initialCopy)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    const result = await updateSiteCopy(copy)
    setIsSaving(false)

    if ("error" in result && result.error) {
      toast({ title: "Could not save content", description: result.error, variant: "destructive" })
      return
    }

    toast({ title: "Site content saved", description: "Public pages will show the updated text." })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {COPY_KEYS.map((key) => (
        <details key={key} className="group rounded-xl border border-border/60 bg-background" open={key === "sidebarTagline"}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
            <span>
              <span className="text-sm font-semibold text-foreground">{SITE_COPY_LABELS[key].label}</span>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                {SITE_COPY_LABELS[key].description}
              </span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-muted-foreground group-open:hidden">Show</span>
            <span className="hidden shrink-0 text-xs font-semibold text-muted-foreground group-open:inline">Hide</span>
          </summary>
          <div className="space-y-2 border-t border-border/50 px-4 py-4">
            <Label htmlFor={`copy-${key}`} className="sr-only">
              {SITE_COPY_LABELS[key].label}
            </Label>
            <Textarea
              id={`copy-${key}`}
              value={copy[key]}
              onChange={(event) => setCopy((prev) => ({ ...prev, [key]: event.target.value }))}
              rows={
                key === "aboutMission" || key === "donatePageIntro" || key === "homeFollowingEmptyDescription"
                  ? 5
                  : key === "homeFeedEmptyDescription" || key === "channelsPageSubtitle"
                    ? 3
                    : 2
              }
              required
            />
          </div>
        </details>
      ))}
      <Button type="submit" disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          "Save site content"
        )}
      </Button>
    </form>
  )
}
