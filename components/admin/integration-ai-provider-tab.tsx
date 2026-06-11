"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react"
import { AdminSection } from "@/components/admin/admin-section"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { updateAiProviderSettings } from "@/app/actions/ai-provider-settings"
import { fetchProviderModels } from "@/app/actions/fetch-provider-models"
import { PROVIDER_CATALOG, AI_PROVIDER_IDS, type AiProvider } from "@/lib/ai-provider-catalog"
import type { AiProviderAdminView } from "@/lib/ai-provider"

type IntegrationAiProviderTabProps = {
  initial: AiProviderAdminView
}

function getProviderMeta(provider: AiProvider) {
  return provider !== "none" ? PROVIDER_CATALOG[provider] : null
}

function getFallbackModels(provider: AiProvider): string[] {
  return provider !== "none" ? (PROVIDER_CATALOG[provider]?.fallbackModels ?? []) : []
}

function getDefaultModel(provider: AiProvider): string {
  return provider !== "none" ? (PROVIDER_CATALOG[provider]?.defaultModel ?? "") : ""
}

export function IntegrationAiProviderTab({ initial }: IntegrationAiProviderTabProps) {
  const [view, setView] = useState(initial)
  const [enabled, setEnabled] = useState(initial.enabled)
  const [provider, setProvider] = useState<AiProvider>(initial.provider)
  const [model, setModel] = useState(initial.model)
  const [apiKey, setApiKey] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [availableModels, setAvailableModels] = useState<string[]>(getFallbackModels(initial.provider))
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  const meta = getProviderMeta(provider)

  // On mount: if provider is set and has a saved key, load models from stored key
  useEffect(() => {
    if (initial.provider !== "none" && (initial.hasApiKey || initial.provider === "ollama")) {
      void loadModels(initial.provider, undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadModels(prov: AiProvider, newKey: string | undefined) {
    if (prov === "none") return
    setIsLoadingModels(true)
    const result = await fetchProviderModels(prov, newKey)
    if ("models" in result && result.models.length > 0) {
      setAvailableModels(result.models)
      setModel((current) => (result.models.includes(current) ? current : result.models[0]))
    }
    setIsLoadingModels(false)
  }

  function handleProviderChange(newProvider: AiProvider) {
    setProvider(newProvider)
    const fallbacks = getFallbackModels(newProvider)
    setAvailableModels(fallbacks)
    setModel(getDefaultModel(newProvider))
    // Auto-fetch models if Ollama (no key needed) or if already has a key saved
    if (newProvider !== "none" && (newProvider === "ollama" || view.hasApiKey)) {
      void loadModels(newProvider, apiKey.trim() || undefined)
    }
  }

  function handleApiKeyBlur() {
    const trimmed = apiKey.trim()
    if (trimmed && provider !== "none") {
      void loadModels(provider, trimmed)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    const result = await updateAiProviderSettings({ enabled, provider, model, apiKey })
    if ("error" in result && result.error) {
      toast({ title: "Could not save AI Provider", description: result.error, variant: "destructive" })
    } else {
      const trimmedKey = apiKey.trim()
      const providerReady = enabled && provider !== "none" && (provider === "ollama" || Boolean(trimmedKey || view.hasApiKey))
      setView({
        enabled,
        provider,
        model: model || getDefaultModel(provider),
        hasApiKey: trimmedKey ? true : view.hasApiKey,
        apiKeyLast4: trimmedKey ? trimmedKey.slice(-4) : view.apiKeyLast4,
        ready: providerReady,
      })
      setApiKey("")
      toast({ title: "AI Provider saved", description: "Moderation and dua bots will use this provider." })
    }

    setIsSaving(false)
  }

  const handleClearApiKey = async () => {
    setIsSaving(true)
    const result = await updateAiProviderSettings({ clearApiKey: true })
    if ("error" in result && result.error) {
      toast({ title: "Could not remove API key", description: result.error, variant: "destructive" })
    } else {
      setView((current) => ({ ...current, hasApiKey: false, apiKeyLast4: null, ready: false }))
      setApiKey("")
      toast({ title: "AI Provider API key removed" })
    }
    setIsSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AdminSection
        title="AI Provider status"
        description="One provider setting powers both AI moderation and event-aware dua generation."
        action={
          <AdminStatusBadge
            label={enabled ? (view.ready ? "Ready" : "Needs API key") : "Disabled"}
            tone={enabled && view.ready ? "success" : "warning"}
          />
        }
      >
        <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          <p className="flex items-start gap-2 font-semibold">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Fail-safe AI usage
          </p>
          <p className="mt-1">
            If the provider cannot be reached, moderation queues submissions for manual review and dua bots log a
            visible error instead of posting guessed content.
          </p>
        </div>
      </AdminSection>

      <AdminSection title="Provider" description="Select a provider and enter your API key. Models load automatically once a key is saved.">
        <div className="grid gap-4 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:items-start sm:gap-x-6">
          <Label htmlFor="ai-provider-enabled" className="sm:pt-2.5">
            Enabled
          </Label>
          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="ai-provider-enabled"
              checked={enabled}
              disabled={isSaving}
              onCheckedChange={setEnabled}
              aria-label="Enable AI Provider"
            />
            <span className="text-sm text-muted-foreground">
              {enabled ? "Allow moderation and bot generation provider calls" : "Do not call the AI provider"}
            </span>
          </div>

          <Label htmlFor="ai-provider-provider" className="sm:pt-2.5">
            Provider
          </Label>
          <div className="space-y-1.5">
            <Select value={provider} onValueChange={(v) => handleProviderChange(v as AiProvider)} disabled={isSaving}>
              <SelectTrigger id="ai-provider-provider">
                <SelectValue placeholder="Choose provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Disabled / None</SelectItem>
                {AI_PROVIDER_IDS.filter((id) => id !== "none").map((id) => (
                  <SelectItem key={id} value={id}>
                    {PROVIDER_CATALOG[id].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Choose None to keep saved credentials but stop provider calls.</p>
          </div>

          <Label htmlFor="ai-provider-model" className="sm:pt-2.5">
            Model
          </Label>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Select
                value={availableModels.includes(model) ? model : (availableModels[0] ?? "")}
                onValueChange={setModel}
                disabled={isSaving || provider === "none" || availableModels.length === 0}
              >
                <SelectTrigger id="ai-provider-model" className="flex-1">
                  <SelectValue placeholder={isLoadingModels ? "Loading models…" : "Choose model"} />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isLoadingModels || provider === "none" || isSaving}
                onClick={() => loadModels(provider, apiKey.trim() || undefined)}
                title="Refresh model list"
              >
                {isLoadingModels ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoadingModels
                ? "Fetching available models from provider…"
                : "Model list loads automatically after entering your API key."}
            </p>
          </div>

          {provider !== "none" && meta?.requiresApiKey && (
            <>
              <Label htmlFor="ai-provider-api-key" className="sm:pt-2.5">
                API key
              </Label>
              <div className="space-y-1.5">
                <Input
                  id="ai-provider-api-key"
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  onBlur={handleApiKeyBlur}
                  placeholder={view.hasApiKey ? "Leave blank to keep current key" : (meta?.keyPlaceholder ?? "API key")}
                  className="font-mono text-xs"
                />
                {view.hasApiKey && provider === initial.provider ? (
                  <p className="text-xs text-muted-foreground">
                    Saved key ends in <span className="font-mono">{view.apiKeyLast4}</span>. The full key is never
                    displayed.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Required for {meta?.label ?? "this provider"}. Models will load automatically after you enter the key.
                  </p>
                )}
                {view.hasApiKey && provider === initial.provider ? (
                  <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={handleClearApiKey}>
                    Remove saved API key
                  </Button>
                ) : null}
              </div>
            </>
          )}

          {provider === "ollama" && (
            <>
              <Label className="sm:pt-2.5">Connection</Label>
              <p className="pt-2 text-sm text-muted-foreground">
                Ollama runs locally — no API key required. Make sure Ollama is running at{" "}
                <span className="font-mono text-xs">localhost:11434</span>.
              </p>
            </>
          )}
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
            "Save AI Provider"
          )}
        </Button>
      </div>

      <p className="px-1 text-xs leading-5 text-muted-foreground">
        Moderation policy covers abuse, hate, threats, harassment, explicit/private personal details, political
        incitement, scams, and unsafe context. Bot generation uses this same provider to draft duas from approved
        RSS/news event sources.
      </p>
    </form>
  )
}
