"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { updateBetaBannerSettings } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { renderBannerRichText, sanitizeBannerColor } from "@/lib/banner-rich-text"
import type { BetaBannerSettings as BetaBannerSettingsValue } from "@/lib/site-settings-server"

type BetaBannerSettingsProps = {
  initialSettings: BetaBannerSettingsValue
}

export function BetaBannerSettings({ initialSettings }: BetaBannerSettingsProps) {
  const [enabled, setEnabled] = useState(initialSettings.enabled)
  const [message, setMessage] = useState(initialSettings.message)
  const [bgColor, setBgColor] = useState(initialSettings.bgColor)
  const [isSaving, setIsSaving] = useState(false)

  const safeBgColor = sanitizeBannerColor(bgColor)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    const result = await updateBetaBannerSettings({ enabled, message, bgColor })
    setIsSaving(false)

    if ("error" in result && result.error) {
      toast({ title: "Could not save beta banner", description: result.error, variant: "destructive" })
      return
    }

    toast({ title: "Beta banner saved", description: "The public banner will update shortly." })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 p-4">
        <div className="space-y-1">
          <Label htmlFor="beta-banner-enabled">Show beta banner</Label>
          <p className="text-xs text-muted-foreground">Toggle the site-wide public warning banner.</p>
        </div>
        <Switch id="beta-banner-enabled" checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="beta-banner-message">Banner message</Label>
        <p className="text-xs text-muted-foreground">
          Supports safe markdown links like [learn more](/about) or [contact](mailto:hello@example.com).
        </p>
        <Textarea
          id="beta-banner-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="beta-banner-bg-color">Background color</Label>
          <Input
            id="beta-banner-bg-color"
            type="text"
            value={bgColor}
            onChange={(event) => setBgColor(event.target.value)}
            placeholder="#fef3c7"
          />
          <p className="text-xs text-muted-foreground">Use a hex color, for example #fef3c7.</p>
        </div>
        <Input
          aria-label="Pick beta banner background color"
          type="color"
          value={safeBgColor}
          onChange={(event) => setBgColor(event.target.value)}
          className="h-10 w-16 p-1"
        />
      </div>

      <div className="rounded-2xl border border-border/60 p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Preview</p>
        <div
          className="rounded-xl px-3 py-2 text-center text-xs font-medium leading-5 text-slate-900 sm:text-sm"
          style={{ backgroundColor: safeBgColor }}
        >
          {renderBannerRichText(message)}
        </div>
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          "Save beta banner"
        )}
      </Button>
    </form>
  )
}
