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
import type { AiProviderAdminView, ModelMode, ReasoningEffort } from "@/lib/ai-provider"

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
  const [modelMode, setModelMode] = useState<ModelMode>(initial.modelMode)
  const [timeoutSec, setTimeoutSec] = useState(Math.round(initial.moderationTimeoutMs / 1000))
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>(initial.reasoningEffort)
  const [maxTokens, setMaxTokens] = useState(initial.maxTokens)
  const [temperature, setTemperature] = useState(initial.temperature)
  const [requestTimeoutSec, setRequestTimeoutSec] = useState(Math.round(initial.requestTimeoutMs / 1000))
  const [apiKey, setApiKey] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const autoSupported = provider === "openrouter"
  const autoActive = modelMode === "auto" && autoSupported
  const [availableModels, setAvailableModels] = useState<string[]>(() => {
    const fallbacks = getFallbackModels(initial.provider)
    if (initial.model && initial.provider !== "none" && !fallbacks.includes(initial.model)) {
      return [initial.model, ...fallbacks]
    }
    return fallbacks
  })
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

    const moderationTimeoutMs = timeoutSec * 1000
    const requestTimeoutMs = requestTimeoutSec * 1000
    const result = await updateAiProviderSettings({
      enabled,
      provider,
      model,
      apiKey,
      modelMode,
      moderationTimeoutMs,
      reasoningEffort,
      maxTokens,
      temperature,
      requestTimeoutMs,
    })
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
        modelMode,
        moderationTimeoutMs,
        reasoningEffort,
        maxTokens,
        temperature,
        requestTimeoutMs,
        autoModel: modelMode === "auto" && provider === "openrouter" ? view.autoModel : null,
      })
      setApiKey("")
      toast({
        title: "AI Provider saved",
        description: autoActive
          ? "Auto mode: the latest free model will be used (refreshes daily)."
          : "Moderation and dua bots will use this provider.",
      })
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

          {autoSupported && (
            <>
              <Label htmlFor="ai-provider-model-mode" className="sm:pt-2.5">
                Model selection
              </Label>
              <div className="space-y-1.5">
                <Select
                  value={modelMode}
                  onValueChange={(v) => setModelMode(v as ModelMode)}
                  disabled={isSaving}
                >
                  <SelectTrigger id="ai-provider-model-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto — always use the latest free model</SelectItem>
                    <SelectItem value="manual">Manual — pick a specific model</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {autoActive
                    ? `Auto mode picks the newest capable free model from OpenRouter (refreshed daily)${
                        view.autoModel ? `. Currently: ${view.autoModel}` : ""
                      }. No need to update this manually.`
                    : "Manual mode uses the exact model selected below."}
                </p>
              </div>
            </>
          )}

          <Label htmlFor="ai-provider-model" className="sm:pt-2.5">
            Model
          </Label>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Select
                value={model}
                onValueChange={setModel}
                disabled={isSaving || provider === "none" || availableModels.length === 0 || autoActive}
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

          {provider !== "none" && (
            <>
              <Label htmlFor="ai-moderation-timeout" className="sm:pt-2.5">
                Moderation timeout
              </Label>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Input
                    id="ai-moderation-timeout"
                    type="number"
                    min={2}
                    max={30}
                    step={1}
                    value={timeoutSec}
                    onChange={(event) => setTimeoutSec(Number(event.target.value))}
                    disabled={isSaving}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">seconds (2–30)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  How long to wait for a moderation verdict before publishing anyway. Free models are slower, so
                  allow more time. If the check times out or errors, the dua publishes and the local keyword filter
                  still applies.
                </p>
              </div>
            </>
          )}

          {provider !== "none" && (
            <>
              <Label htmlFor="ai-reasoning-effort" className="sm:pt-2.5">
                Reasoning effort
              </Label>
              <div className="space-y-1.5">
                <Select value={reasoningEffort} onValueChange={(v) => setReasoningEffort(v as ReasoningEffort)} disabled={isSaving}>
                  <SelectTrigger id="ai-reasoning-effort"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None — fastest/cheapest (some models reject this)</SelectItem>
                    <SelectItem value="low">Low — minimal reasoning (recommended)</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High — most deliberate, slowest</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  For hybrid/reasoning models (e.g. Kimi). &quot;None&quot; can return an error on providers that make
                  reasoning mandatory — use Low if unsure.
                </p>
              </div>

              <Label htmlFor="ai-temperature" className="sm:pt-2.5">
                Temperature
              </Label>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Input
                    id="ai-temperature"
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={temperature}
                    onChange={(event) => setTemperature(Number(event.target.value))}
                    disabled={isSaving}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">0 = faithful, 1+ = creative</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lower for verbatim/retrieval bots; higher for freeform composing.
                </p>
              </div>

              <Label htmlFor="ai-max-tokens" className="sm:pt-2.5">
                Max output tokens
              </Label>
              <div className="space-y-1.5">
                <Input
                  id="ai-max-tokens"
                  type="number"
                  min={256}
                  max={8000}
                  step={100}
                  value={maxTokens}
                  onChange={(event) => setMaxTokens(Number(event.target.value))}
                  disabled={isSaving}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Upper bound on each response. Must cover reasoning + the dua; too low truncates output.
                </p>
              </div>

              <Label htmlFor="ai-request-timeout" className="sm:pt-2.5">
                Request timeout
              </Label>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Input
                    id="ai-request-timeout"
                    type="number"
                    min={5}
                    max={55}
                    step={1}
                    value={requestTimeoutSec}
                    onChange={(event) => setRequestTimeoutSec(Number(event.target.value))}
                    disabled={isSaving}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">seconds (5–55)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  How long to wait for a generation call before aborting. Keep below the 60s function limit.
                </p>
              </div>
            </>
          )}

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
