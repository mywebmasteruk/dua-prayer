"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { submitChannelApplication } from "@/app/actions/channel-applications"
import { channelHandleFromName, normalizeChannelHandle } from "@/lib/channel-types"

type ChannelApplyFormProps = {
  onSubmitted?: () => void
}

export function ChannelApplyForm({ onSubmitted }: ChannelApplyFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [handle, setHandle] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    const result = await submitChannelApplication({
      name,
      description,
      handle: handle.trim() ? handle : undefined,
      message: message.trim() ? message : undefined,
    })

    setIsSubmitting(false)

    if ("error" in result && result.error) {
      toast({ title: "Could not submit application", description: result.error, variant: "destructive" })
      return
    }

    toast({
      title: "Application submitted",
      description: "We'll review your channel application and follow up by email.",
    })
    setName("")
    setDescription("")
    setHandle("")
    setMessage("")
    onSubmitted?.()
  }

  const previewHandle = handle.trim()
    ? normalizeChannelHandle(handle)
    : name.trim()
      ? channelHandleFromName(name)
      : ""

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-5">
      <div className="space-y-1.5">
        <Label htmlFor="channel-apply-name">Channel name</Label>
        <Input
          id="channel-apply-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Masjid Al-Noor"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="channel-apply-handle">Handle</Label>
        <Input
          id="channel-apply-handle"
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder={previewHandle ? `@${previewHandle}` : "@yourcommunity"}
        />
        <p className="text-xs text-muted-foreground">
          Optional public handle. Leave blank to derive from the channel name.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="channel-apply-description">Description</Label>
        <Textarea
          id="channel-apply-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder="Who is this channel for, and what kind of duas will be shared?"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="channel-apply-message">Additional context</Label>
        <Textarea
          id="channel-apply-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="Links, community size, moderation plans, or anything else we should know."
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="rounded-full">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Submitting…
          </>
        ) : (
          "Submit application"
        )}
      </Button>
    </form>
  )
}
