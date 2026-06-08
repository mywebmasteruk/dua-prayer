"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { updateVolunteerFilloutSetting } from "@/app/actions/settings"

type VolunteerFormSettingsProps = {
  initialValue: string
}

export function VolunteerFormSettings({ initialValue }: VolunteerFormSettingsProps) {
  const [value, setValue] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    const result = await updateVolunteerFilloutSetting(value)

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
          ? "Volunteer form updated. The /volunteer page will show the application modal."
          : "Volunteer form cleared. /volunteer will fall back to email.",
      })
    }

    setIsSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="volunteer-fillout">Fillout embed</Label>
        <Textarea
          id="volunteer-fillout"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={6}
          placeholder={'Paste iframe HTML, https://forms.fillout.com/t/yourFormId, or just the form ID (e.g. abc123)'}
          className="font-mono text-xs leading-relaxed"
        />
        <p className="text-xs leading-5 text-muted-foreground">
          From Fillout: Share → Embed → copy the iframe snippet or form link. Only{" "}
          <code className="rounded bg-muted px-1 py-0.5">forms.fillout.com</code> URLs are accepted — scripts are
          never stored or rendered.
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
            "Save volunteer form"
          )}
        </Button>
        <Button type="button" variant="outline" disabled={isSaving} onClick={() => setValue("")}>
          Clear
        </Button>
        <Link
          href="/volunteer"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Preview volunteer page
        </Link>
      </div>
    </form>
  )
}
