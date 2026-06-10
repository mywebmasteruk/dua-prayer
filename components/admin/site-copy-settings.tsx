"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Languages, Loader2 } from "lucide-react"
import { BetaBannerSettings } from "@/components/admin/beta-banner-settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { updateSiteCopy } from "@/app/actions/site-copy"
import { SITE_COPY_LABELS, type SiteCopy, type SiteCopyKey } from "@/lib/site-copy"
import { SITE_COPY_GROUPS, type SiteCopyField, type SiteCopySection } from "@/lib/site-copy-groups"
import type { BetaBannerSettings as BetaBannerSettingsValue } from "@/lib/site-settings-server"

type SiteCopySettingsProps = {
  initialCopy: SiteCopy
  betaBannerSettings?: BetaBannerSettingsValue | null
}

type FieldEditorProps = {
  copy: SiteCopy
  fieldKey: SiteCopyKey
  id: string
  label?: string
  description?: string
  onChange: (key: SiteCopyKey, value: string) => void
}

function getRows(key: SiteCopyKey) {
  if (
    key === "aboutMission" ||
    key === "donatePageIntro" ||
    key === "homeFollowingEmptyDescription" ||
    key === "composerDescriptionEn" ||
    key === "composerDescriptionAr"
  ) {
    return 5
  }

  if (
    key === "homeFeedEmptyDescription" ||
    key === "channelsPageSubtitle" ||
    key === "composerPlaceholderEn" ||
    key === "composerPlaceholderAr"
  ) {
    return 3
  }

  return 2
}

function getGroupFieldCount(sections: readonly SiteCopySection[]) {
  return sections.reduce((count, section) => count + section.fields.length, 0)
}

function getChangedCount(current: SiteCopy, initial: SiteCopy) {
  return (Object.keys(current) as SiteCopyKey[]).filter((key) => current[key] !== initial[key]).length
}

function FieldEditor({ copy, fieldKey, id, label, description, onChange }: FieldEditorProps) {
  const resolvedLabel = label ?? SITE_COPY_LABELS[fieldKey].label
  const resolvedDescription = description ?? SITE_COPY_LABELS[fieldKey].description
  const isArabic = fieldKey.endsWith("Ar")

  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-background p-4">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-semibold text-foreground">
          {resolvedLabel}
        </Label>
        <p className="text-xs leading-5 text-muted-foreground">{resolvedDescription}</p>
      </div>
      <Textarea
        id={id}
        value={copy[fieldKey]}
        onChange={(event) => onChange(fieldKey, event.target.value)}
        rows={getRows(fieldKey)}
        dir={isArabic ? "rtl" : "ltr"}
        className={isArabic ? "text-right" : undefined}
        required
      />
    </div>
  )
}

function TranslationField({ copy, field, onChange }: { copy: SiteCopy; field: SiteCopyField; onChange: FieldEditorProps["onChange"] }) {
  switch (field.type) {
    case "single":
      return <FieldEditor copy={copy} fieldKey={field.key} id={`copy-${field.key}`} onChange={onChange} />
    case "translation":
      return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
          <div className="border-b border-border/50 bg-muted/30 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-foreground">{field.label}</h4>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{field.description}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/70">
                <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                Translation pair
              </span>
            </div>
          </div>
          <div className="grid gap-0 md:grid-cols-2">
            <div className="space-y-2 border-b border-border/50 p-4 md:border-b-0 md:border-r">
              <Label htmlFor={`copy-${field.enKey}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                English
              </Label>
              <Textarea
                id={`copy-${field.enKey}`}
                value={copy[field.enKey]}
                onChange={(event) => onChange(field.enKey, event.target.value)}
                rows={getRows(field.enKey)}
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2 p-4">
              <Label
                htmlFor={`copy-${field.arKey}`}
                className="block text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Arabic
              </Label>
              <Textarea
                id={`copy-${field.arKey}`}
                value={copy[field.arKey]}
                onChange={(event) => onChange(field.arKey, event.target.value)}
                rows={getRows(field.arKey)}
                dir="rtl"
                className="text-right"
                required
              />
            </div>
          </div>
        </div>
      )
    case "referenceTranslation":
      return (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
          <div className="grid gap-0 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-2 border-b border-border/50 bg-muted/20 p-4 md:border-b-0 md:border-r">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">English reference</p>
              <p className="rounded-xl border border-border/60 bg-background px-3 py-2 text-sm text-foreground">
                {field.englishText}
              </p>
              <p className="text-xs leading-5 text-muted-foreground">{field.description}</p>
            </div>
            <div className="space-y-2 p-4">
              <Label htmlFor={`copy-${field.arKey}`} className="block text-right text-sm font-semibold text-foreground">
                {field.label} — Arabic
              </Label>
              <Textarea
                id={`copy-${field.arKey}`}
                value={copy[field.arKey]}
                onChange={(event) => onChange(field.arKey, event.target.value)}
                rows={getRows(field.arKey)}
                dir="rtl"
                className="text-right"
                required
              />
            </div>
          </div>
        </div>
      )
    default: {
      const exhaustive: never = field
      return exhaustive
    }
  }
}

export function SiteCopySettings({ initialCopy, betaBannerSettings }: SiteCopySettingsProps) {
  const [copy, setCopy] = useState(initialCopy)
  const [savedCopy, setSavedCopy] = useState(initialCopy)
  const [isSaving, setIsSaving] = useState(false)
  const changedCount = useMemo(() => getChangedCount(copy, savedCopy), [copy, savedCopy])

  const handleCopyChange = (key: SiteCopyKey, value: string) => {
    setCopy((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    const result = await updateSiteCopy(copy)
    setIsSaving(false)

    if ("error" in result && result.error) {
      toast({ title: "Could not save content", description: result.error, variant: "destructive" })
      return
    }

    setSavedCopy(copy)
    toast({ title: "Site content saved", description: "Public pages will show the updated text." })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Content workspace</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Choose a page or parent section, then edit its copy without scrolling through every field.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {changedCount > 0 ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700 ring-1 ring-amber-200">
              {changedCount} unsaved {changedCount === 1 ? "change" : "changes"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              No unsaved changes
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue={SITE_COPY_GROUPS[0].value} className="space-y-5">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          {SITE_COPY_GROUPS.map((group) => (
            <TabsTrigger
              key={group.value}
              value={group.value}
              className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm data-[state=active]:border-primary/40 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {group.label}
            </TabsTrigger>
          ))}
          {betaBannerSettings ? (
            <TabsTrigger
              value="banner"
              className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm data-[state=active]:border-primary/40 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Banner
            </TabsTrigger>
          ) : null}
        </TabsList>

        {SITE_COPY_GROUPS.map((group) => (
          <TabsContent key={group.value} value={group.value} className="mt-0 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Card className="border-border/60 shadow-none">
                <CardHeader className="space-y-2 border-b border-border/50">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{group.label}</CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {getGroupFieldCount(group.sections)} {getGroupFieldCount(group.sections) === 1 ? "field" : "fields"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-5">
                  {group.sections.map((section) => (
                    <details key={section.title} className="group rounded-2xl border border-border/60 bg-card" open>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 marker:hidden">
                        <span className="space-y-1">
                          <span className="block text-sm font-semibold text-foreground">{section.title}</span>
                          <span className="block text-xs leading-5 text-muted-foreground">{section.description}</span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-muted-foreground group-open:hidden">Show</span>
                        <span className="hidden shrink-0 text-xs font-semibold text-muted-foreground group-open:inline">Hide</span>
                      </summary>
                      <div className="space-y-4 border-t border-border/50 p-4">
                        {section.fields.map((field) => (
                          <TranslationField
                            key={field.type === "single" ? field.key : field.id}
                            copy={copy}
                            field={field}
                            onChange={handleCopyChange}
                          />
                        ))}
                      </div>
                    </details>
                  ))}
                </CardContent>
              </Card>

              <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
                <p className="text-xs leading-5 text-muted-foreground">
                  Save once after editing any tab. Empty fields are rejected to protect public copy.
                </p>
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
              </div>
            </form>
          </TabsContent>
        ))}

        {betaBannerSettings ? (
          <TabsContent value="banner" className="mt-0 space-y-4">
            <Card className="border-border/60 shadow-none">
              <CardHeader className="space-y-1 border-b border-border/50">
                <CardTitle className="text-lg">Beta top banner</CardTitle>
                <CardDescription>
                  Enable the site-wide beta notice, edit rich text, and set the background color.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <BetaBannerSettings initialSettings={betaBannerSettings} />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
