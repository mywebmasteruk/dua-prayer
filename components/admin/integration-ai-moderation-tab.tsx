"use client"

import { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { AdminSection } from "@/components/admin/admin-section"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { updateAiModerationSettings } from "@/app/actions/ai-moderation-settings"
import type { AiModerationAdminView, AiModerationProvider } from "@/lib/ai-moderation"

type IntegrationAiModerationTabProps = {
  initial: AiModerationAdminView
}

export function IntegrationAiModerationTab({ initial }: IntegrationAiModerationTabProps) {
  const [view, setView] = useState(initial)
  const [enabled, setEnabled] = useState(initial.enabled)
  const [provider, setProvider] = useState<AiModerationProvider>(initial.provider)
  const [model, setModel] = useState(initial.model)
  const [apiKey, setApiKey] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    const result = await updateAiModerationSettings({ enabled, provider, model, apiKey })
    if ("error" in result && result.error) {
      toast({ title: "Could not save AI moderation", description: result.error, variant: "destructive" })
    } else {
      const trimmedKey = apiKey.trim()
      setView({
        enabled,
        provider,
        model: model.trim() || "gpt-4o-mini",
        hasApiKey: trimmedKey ? true : view.hasApiKey,
        apiKeyLast4: trimmedKey ? trimmedKey.slice(-4) : view.apiKeyLast4,
        ready: enabled && provider === "openai" && Boolean(trimmedKey || view.hasApiKey),
      })
      setApiKey("")
      toast({ title: "AI moderation saved", description: "New dua submissions will use the updated policy." })
    }

    setIsSaving(false)
  }

  const handleClearApiKey = async () => {
    setIsSaving(true)
    const result = await updateAiModerationSettings({ clearApiKey: true })
    if ("error" in result && result.error) {
      toast({ title: "Could not remove API key", description: result.error, variant: "destructive" })
    } else {
      setView((current) => ({ ...current, hasApiKey: false, apiKeyLast4: null, ready: false }))
      setApiKey("")
      toast({ title: "AI moderation API key removed" })
    }
    setIsSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AdminSection
        title="AI moderation status"
        description="Review new dua submissions before they appear publicly when AI detects unsafe language or context."
        action={
          <AdminStatusBadge
            label={enabled ? (view.ready ? "Enabled" : "Needs API key") : "Disabled"}
            tone={enabled && view.ready ? "success" : "warning"}
          />
        }
      >
        <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          <p className="flex items-start gap-2 font-semibold">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Fail-safe moderation
          </p>
          <p className="mt-1">
            If AI moderation is enabled and the provider cannot be reached, the dua is saved as unpublished and flagged
            for manual review instead of being published automatically.
          </p>
        </div>
      </AdminSection>

      <AdminSection title="Provider" description="OpenAI is implemented for this MVP. Other providers can be added later.">
        <div className="grid gap-4 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:items-start sm:gap-x-6">
          <Label htmlFor="ai-moderation-enabled" className="sm:pt-2.5">
            Enabled
          </Label>
          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="ai-moderation-enabled"
              checked={enabled}
              disabled={isSaving}
              onCheckedChange={setEnabled}
              aria-label="Enable AI moderation"
            />
            <span className="text-sm text-muted-foreground">
              {enabled ? "Moderate new duas before publishing" : "Do not call AI moderation"}
            </span>
          </div>

          <Label htmlFor="ai-moderation-provider" className="sm:pt-2.5">
            Provider
          </Label>
          <div className="space-y-1.5">
            <Select value={provider} onValueChange={(value) => setProvider(value as AiModerationProvider)} disabled={isSaving}>
              <SelectTrigger id="ai-moderation-provider">
                <SelectValue placeholder="Choose provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Disabled / None</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Choose None to keep saved credentials but stop provider calls.</p>
          </div>

          <Label htmlFor="ai-moderation-model" className="sm:pt-2.5">
            Model
          </Label>
          <div className="space-y-1.5">
            <Input
              id="ai-moderation-model"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="gpt-4o-mini"
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">Default: gpt-4o-mini.</p>
          </div>

          <Label htmlFor="ai-moderation-api-key" className="sm:pt-2.5">
            API key
          </Label>
          <div className="space-y-1.5">
            <Input
              id="ai-moderation-api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={view.hasApiKey ? "Leave blank to keep current key" : "sk-…"}
              className="font-mono text-xs"
            />
            {view.hasApiKey ? (
              <p className="text-xs text-muted-foreground">
                Saved key ends in <span className="font-mono">{view.apiKeyLast4}</span>. The full key is never displayed.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Required when OpenAI moderation is enabled.</p>
            )}
            {view.hasApiKey ? (
              <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={handleClearApiKey}>
                Remove saved API key
              </Button>
            ) : null}
          </div>
        </div>
      </AdminSection>

      <div className="flex flex-wrap items-center gap-3 px-1">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Save AI moderation"
          )}
        </Button>
      </div>

      <p className="px-1 text-xs leading-5 text-muted-foreground">
        Policy covers abuse, hate, threats, harassment, explicit/private personal details, political incitement, scams,
        and severe unsafe context. Normal duas about illness, grief, disasters, or hardship are allowed.
      </p>
    </form>
  )
}
