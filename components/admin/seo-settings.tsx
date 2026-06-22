"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { AdminSection } from "@/components/admin/admin-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { saveSeoSettings } from "@/app/actions/seo"
import type { SeoSettings } from "@/lib/seo-settings-server"

export function SeoSettingsForm({ initialSettings }: { initialSettings: SeoSettings }) {
  const [settings, setSettings] = useState(initialSettings)
  const [isSaving, setIsSaving] = useState(false)

  const set = <K extends keyof SeoSettings>(key: K, value: SeoSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    const result = await saveSeoSettings(settings)
    setIsSaving(false)

    if ("error" in result && result.error) {
      toast({ title: "Could not save SEO settings", description: result.error, variant: "destructive" })
      return
    }
    toast({ title: "SEO settings saved", description: "Search and social share previews will update shortly." })
  }

  return (
    <AdminSection
      title="SEO & Social Sharing"
      description="Control how the site appears in Google results and in link previews on X, WhatsApp, Facebook, and elsewhere."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Field
          id="seo-site-name"
          label="Site name"
          hint="Your brand name. Shown as the source label on social cards (og:site_name)."
        >
          <Input id="seo-site-name" value={settings.siteName} onChange={(e) => set("siteName", e.target.value)} placeholder="DuaPrayer" />
        </Field>

        <Field
          id="seo-title"
          label="Site title"
          hint="The headline for search results and link previews (the browser tab title and og:title)."
        >
          <Input id="seo-title" value={settings.title} onChange={(e) => set("title", e.target.value)} placeholder="DuaPrayer — Make Dua & Pray For The Ummah" />
        </Field>

        <Field
          id="seo-description"
          label="Site description"
          hint="The summary under the title in search results and link previews (meta description / og:description). Aim for ~150 characters."
        >
          <Textarea id="seo-description" value={settings.description} onChange={(e) => set("description", e.target.value)} rows={3} />
        </Field>

        <Field
          id="seo-image"
          label="Social share image"
          hint="The large preview image on social cards (og:image). Use a full https:// URL or a path like /logo-wide.png. Recommended 1200×630."
        >
          <Input id="seo-image" value={settings.image} onChange={(e) => set("image", e.target.value)} placeholder="https://www.duaprayer.com/og-image.png" />
          {settings.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.image}
              alt="Social share preview"
              className="mt-2 max-h-40 w-auto rounded-md border border-border/60 object-contain"
            />
          ) : null}
        </Field>

        <Field
          id="seo-favicon"
          label="Favicon"
          hint="The small icon shown in browser tabs and bookmarks. Use a full https:// URL or a path like /favicon.png (PNG or ICO)."
        >
          <Input id="seo-favicon" value={settings.favicon} onChange={(e) => set("favicon", e.target.value)} placeholder="/favicon.png" />
          {settings.favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.favicon} alt="Favicon preview" className="mt-2 h-8 w-8 rounded border border-border/60 object-contain" />
          ) : null}
        </Field>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              "Save SEO settings"
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
