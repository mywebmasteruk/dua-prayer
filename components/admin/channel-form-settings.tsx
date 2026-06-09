"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { updateChannelFilloutSetting } from "@/app/actions/settings"

type ChannelFormSettingsProps = {
  initialValue: string
}

export function ChannelFormSettings({ initialValue }: ChannelFormSettingsProps) {
  const [value, setValue] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    const result = await updateChannelFilloutSetting(value)

    if ("error" in result && result.error) {
      toast({
        title: "Could not save",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Saved",
        description: value.trim()
          ? "Channel application form updated. /channels/apply will show the Fillout embed."
          : "Channel form cleared. /channels/apply will show a not-configured message.",
      })
    }

    setIsSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="channel-fillout">Fillout embed</Label>
        <Textarea
          id="channel-fillout"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={6}
          placeholder={'Paste iframe HTML, https://forms.fillout.com/t/yourFormId, or just the form ID (e.g. abc123)'}
          className="font-mono text-xs leading-relaxed"
        />
        <p className="text-xs leading-5 text-muted-foreground">
          From Fillout: Share → Embed → copy the iframe snippet or form link. Only{" "}
          <code className="rounded bg-muted px-1 py-0.5">forms.fillout.com</code> URLs are accepted — scripts are
          never stored or rendered. Add a Fillout webhook to{" "}
          <code className="rounded bg-muted px-1 py-0.5">/api/webhooks/channel</code> so submissions appear in the
          Applications tab for approval.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Save channel form"
          )}
        </Button>
        <Button type="button" variant="outline" disabled={isSaving} onClick={() => setValue("")}>
          Clear
        </Button>
        <Link
          href="/channels/apply"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Preview apply page
        </Link>
      </div>
    </form>
  )
}
