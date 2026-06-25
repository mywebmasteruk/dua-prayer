"use client"

import { useMemo, useState } from "react"
import { Copy, ExternalLink, Loader2 } from "lucide-react"
import { AdminSection } from "@/components/admin/admin-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { saveRssSettings } from "@/app/actions/rss"
import type { RssSettings } from "@/lib/rss-settings-server"

type ChannelOption = { id: string; name: string }

export function RssSettingsForm({
  initialSettings,
  channels,
  feedUrl,
}: {
  initialSettings: RssSettings
  channels: ChannelOption[]
  feedUrl: string
}) {
  const [settings, setSettings] = useState(initialSettings)
  const [isSaving, setIsSaving] = useState(false)

  const set = <K extends keyof RssSettings>(key: K, value: RssSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }))

  const excludedSet = useMemo(() => new Set(settings.excludedChannelIds), [settings.excludedChannelIds])

  const toggleChannelExclusion = (id: string, exclude: boolean) => {
    setSettings((prev) => {
      const next = new Set(prev.excludedChannelIds)
      if (exclude) next.add(id)
      else next.delete(id)
      return { ...prev, excludedChannelIds: Array.from(next) }
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    const result = await saveRssSettings(settings)
    setIsSaving(false)

    if ("error" in result && result.error) {
      toast({ title: "Could not save RSS settings", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "RSS settings saved", description: "Feed readers will pick up the new feed within the TTL." })
  }

  const handleCopyFeedUrl = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl)
      toast({ title: "Feed URL copied", description: feedUrl })
    } catch {
      toast({ title: "Could not copy", description: "Copy it manually from the field below.", variant: "destructive" })
    }
  }

  return (
    <AdminSection
      title="RSS Feed"
      description="Publish recent duas as an RSS 2.0 feed at /feed.xml so people can follow new content in their reader of choice."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-start justify-between gap-4 rounded-md border border-border/60 bg-muted/30 p-4">
          <div className="space-y-1">
            <Label htmlFor="rss-enabled" className="text-sm font-semibold text-foreground">
              Feed enabled
            </Label>
            <p className="text-xs leading-5 text-muted-foreground">
              When off, /feed.xml returns 404 and the &lt;link rel=&quot;alternate&quot;&gt; tag is removed from pages.
            </p>
          </div>
          <Switch
            id="rss-enabled"
            checked={settings.enabled}
            onCheckedChange={(value) => set("enabled", value)}
            aria-label="Enable RSS feed"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Feed URL</Label>
          <div className="flex items-center gap-2">
            <Input value={feedUrl} readOnly className="font-mono text-xs" />
            <Button type="button" variant="outline" size="sm" onClick={handleCopyFeedUrl} title="Copy feed URL">
              <Copy className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Copy feed URL</span>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <a
                href={`https://validator.w3.org/feed/check.cgi?url=${encodeURIComponent(feedUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Validate at W3C"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Validate</span>
              </a>
            </Button>
          </div>
        </div>

        <Field
          id="rss-title"
          label="Feed title"
          hint="Channel title shown in feed readers. Falls back to your site name when blank."
        >
          <Input id="rss-title" value={settings.title} onChange={(e) => set("title", e.target.value)} placeholder="DuaPrayer — Latest Duas" />
        </Field>

        <Field
          id="rss-description"
          label="Feed description"
          hint="One-line summary of what subscribers will receive."
        >
          <Textarea
            id="rss-description"
            value={settings.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            placeholder="The latest duas shared by the DuaPrayer community."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="rss-author" label="Author / managing editor" hint="Optional. Shown as managingEditor in the feed.">
            <Input
              id="rss-author"
              value={settings.author}
              onChange={(e) => set("author", e.target.value)}
              placeholder="editor@duaprayer.com (DuaPrayer team)"
            />
          </Field>

          <Field id="rss-copyright" label="Copyright" hint="Optional. Free-form copyright string.">
            <Input
              id="rss-copyright"
              value={settings.copyright}
              onChange={(e) => set("copyright", e.target.value)}
              placeholder="© DuaPrayer"
            />
          </Field>

          <Field
            id="rss-language"
            label="Language"
            hint="RFC 1766 code such as en, en-gb, ar."
          >
            <Input
              id="rss-language"
              value={settings.language}
              onChange={(e) => set("language", e.target.value)}
              placeholder="en"
              maxLength={5}
            />
          </Field>

          <Field
            id="rss-ttl"
            label="TTL (minutes)"
            hint="Cache hint for readers. 10–60 is typical."
          >
            <Input
              id="rss-ttl"
              type="number"
              min={1}
              max={1440}
              value={settings.ttlMinutes}
              onChange={(e) => set("ttlMinutes", Number.parseInt(e.target.value, 10) || 0)}
            />
          </Field>

          <Field
            id="rss-item-count"
            label="Items per feed"
            hint="Number of recent duas to include (1–50)."
          >
            <Input
              id="rss-item-count"
              type="number"
              min={1}
              max={50}
              value={settings.itemCount}
              onChange={(e) => set("itemCount", Number.parseInt(e.target.value, 10) || 0)}
            />
          </Field>
        </div>

        <div className="space-y-3 rounded-md border border-border/60 p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Content sources</p>
            <p className="text-xs leading-5 text-muted-foreground">Pick which kinds of duas appear in the feed. At least one must be selected.</p>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-md border border-border/40 px-3 py-2 text-sm">
            <span>
              <span className="block font-medium text-foreground">Channel posts</span>
              <span className="block text-xs text-muted-foreground">Duas posted into approved channels.</span>
            </span>
            <Switch
              checked={settings.includeChannelPosts}
              onCheckedChange={(value) => set("includeChannelPosts", value)}
              aria-label="Include channel posts"
            />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-md border border-border/40 px-3 py-2 text-sm">
            <span>
              <span className="block font-medium text-foreground">Freeform duas</span>
              <span className="block text-xs text-muted-foreground">Duas posted to the open feed (no channel).</span>
            </span>
            <Switch
              checked={settings.includeFreeformDuas}
              onCheckedChange={(value) => set("includeFreeformDuas", value)}
              aria-label="Include freeform duas"
            />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-md border border-border/40 px-3 py-2 text-sm">
            <span>
              <span className="block font-medium text-foreground">Only verified channels</span>
              <span className="block text-xs text-muted-foreground">When on, hides posts from unverified channels.</span>
            </span>
            <Switch
              checked={settings.onlyVerifiedChannels}
              onCheckedChange={(value) => set("onlyVerifiedChannels", value)}
              aria-label="Only verified channels"
              disabled={!settings.includeChannelPosts}
            />
          </label>
        </div>

        {settings.includeChannelPosts && channels.length > 0 ? (
          <div className="space-y-3 rounded-md border border-border/60 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Exclude specific channels</p>
              <p className="text-xs leading-5 text-muted-foreground">
                Tick channels whose posts should NOT appear in the feed. Leave all unticked to include every approved channel.
              </p>
            </div>
            <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {channels.map((channel) => {
                const isExcluded = excludedSet.has(channel.id)
                return (
                  <label key={channel.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isExcluded}
                      onChange={(e) => toggleChannelExclusion(channel.id, e.target.checked)}
                      className="h-4 w-4 rounded border-border"
                    />
                    <span className="truncate">{channel.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              "Save RSS settings"
            )}
          </Button>
        </div>
      </form>
    </AdminSection>
  )
}

function Field({ id, label, hint, children }: { id: string; label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </Label>
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  )
}
