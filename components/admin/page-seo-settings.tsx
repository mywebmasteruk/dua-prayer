"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { AdminSection } from "@/components/admin/admin-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { savePageSeo } from "@/app/actions/page-seo"
import { PAGE_SEO_PAGES, type PageSeoOverrides, type PageSeoSlug } from "@/lib/page-seo-server"

type PageSeoMap = Record<PageSeoSlug, PageSeoOverrides>

export function PageSeoSettingsForm({ initialOverrides }: { initialOverrides: PageSeoMap }) {
  return (
    <AdminSection
      title="Per-page SEO"
      description="Override the title, description, and share image for individual pages. Leave a field blank to fall back to the global SEO & Social settings."
    >
      <div className="space-y-8">
        {PAGE_SEO_PAGES.map((page) => (
          <PageSeoCard
            key={page.slug}
            slug={page.slug}
            label={page.label}
            path={page.path}
            initial={initialOverrides[page.slug] ?? { title: "", description: "", image: "" }}
          />
        ))}
      </div>
    </AdminSection>
  )
}

function PageSeoCard({
  slug,
  label,
  path,
  initial,
}: {
  slug: PageSeoSlug
  label: string
  path: string
  initial: PageSeoOverrides
}) {
  const [values, setValues] = useState(initial)
  const [isSaving, setIsSaving] = useState(false)

  const set = <K extends keyof PageSeoOverrides>(key: K, value: PageSeoOverrides[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    setIsSaving(true)
    const result = await savePageSeo(slug, values)
    setIsSaving(false)
    if ("error" in result && result.error) {
      toast({ title: `Could not save ${label}`, description: result.error, variant: "destructive" })
      return
    }
    toast({ title: `${label} SEO saved`, description: "Search and social previews will update shortly." })
  }

  return (
    <div className="space-y-4 rounded-lg border border-border/60 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <code className="text-xs text-muted-foreground">{path}</code>
      </div>

      <Field id={`page-${slug}-title`} label="Title" hint="Overrides og:title and the browser tab title.">
        <Input
          id={`page-${slug}-title`}
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Falls back to the global site title"
        />
      </Field>

      <Field id={`page-${slug}-description`} label="Description" hint="Meta description / og:description. Aim for ~150 characters.">
        <Textarea
          id={`page-${slug}-description`}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          placeholder="Falls back to the global site description"
        />
      </Field>

      <Field id={`page-${slug}-image`} label="Share image" hint="og:image. Full https:// URL or a path like /og-image.png. Falls back to the global image.">
        <Input
          id={`page-${slug}-image`}
          value={values.image}
          onChange={(e) => set("image", e.target.value)}
          placeholder="/og-image.png"
        />
        {values.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={values.image}
            alt={`${label} share preview`}
            className="mt-2 max-h-32 w-auto rounded-md border border-border/60 object-contain"
          />
        ) : null}
      </Field>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={isSaving} size="sm">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            `Save ${label}`
          )}
        </Button>
      </div>
    </div>
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
