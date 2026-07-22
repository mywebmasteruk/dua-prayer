export type IntegrationTabId =
  | "stripe"
  | "form-builder"
  | "webhooks"
  | "supabase"
  | "auth"
  | "api-keys"
  | "ai-moderation"

export const INTEGRATION_TABS: { id: IntegrationTabId; label: string }[] = [
  { id: "stripe", label: "Stripe" },
  { id: "form-builder", label: "Form builder" },
  { id: "webhooks", label: "Webhooks" },
  { id: "supabase", label: "Supabase" },
  { id: "auth", label: "Email & Auth" },
  { id: "api-keys", label: "API keys & MCP" },
  { id: "ai-moderation", label: "AI Provider" },
]

export function isIntegrationTabId(value: string | undefined): value is IntegrationTabId {
  return INTEGRATION_TABS.some((tab) => tab.id === value)
}

/** Legacy bookmarks: `?tab=volunteer-webhook` → Webhooks; `?tab=fillout` → Form builder. */
export function resolveIntegrationTabId(value: string | undefined): IntegrationTabId | undefined {
  if (value === "volunteer-webhook") return "webhooks"
  if (value === "fillout") return "form-builder"
  return isIntegrationTabId(value) ? value : undefined
}
