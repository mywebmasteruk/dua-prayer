"use client"

import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { updatePostingMode } from "@/app/actions/settings"
import { AdminSection } from "@/components/admin/admin-section"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { POSTING_MODE_OPTIONS, type PostingMode } from "@/lib/posting-settings-shared"

type PostingAccessSettingsProps = {
  initialMode: PostingMode
  canManageSettings: boolean
}

export function PostingAccessSettings({ initialMode, canManageSettings }: PostingAccessSettingsProps) {
  const [selectedMode, setSelectedMode] = useState<PostingMode>(initialMode)
  const [savedMode, setSavedMode] = useState<PostingMode>(initialMode)
  const [isSaving, setIsSaving] = useState(false)

  const hasChanges = selectedMode !== savedMode

  const handleSave = async () => {
    if (!canManageSettings || !hasChanges) return

    setIsSaving(true)
    const result = await updatePostingMode(selectedMode)
    setIsSaving(false)

    if ("error" in result && result.error) {
      toast({ title: "Could not update posting access", description: result.error, variant: "destructive" })
      return
    }

    setSavedMode(selectedMode)
    toast({ title: "Posting access updated" })
  }

  return (
    <AdminSection
      title="Posting & Access"
      description="Control who can submit new public duas from the homepage composer. Admin moderation tools remain available."
      action={
        canManageSettings ? (
          <Button type="button" size="sm" onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              "Save posting access"
            )}
          </Button>
        ) : null
      }
    >
      <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Posting mode">
        {POSTING_MODE_OPTIONS.map((option) => {
          const isSelected = selectedMode === option.mode
          return (
            <button
              key={option.mode}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={!canManageSettings || isSaving}
              onClick={() => setSelectedMode(option.mode)}
              className={cn(
                "flex min-h-36 flex-col rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/70 bg-background hover:border-primary/40 hover:bg-muted/30",
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="font-semibold text-foreground">{option.label}</span>
                {isSelected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /> : null}
              </span>
              <span className="mt-3 text-sm leading-6 text-muted-foreground">{option.helper}</span>
            </button>
          )
        })}
      </div>
      {!canManageSettings ? (
        <p className="mt-4 text-sm text-muted-foreground">You don&apos;t have permission to update posting access.</p>
      ) : null}
    </AdminSection>
  )
}
