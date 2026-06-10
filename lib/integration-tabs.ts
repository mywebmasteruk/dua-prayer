export type IntegrationTabId =
  | "stripe"
  | "fillout"
  | "webhooks"
  | "supabase"
  | "auth"
  | "api-keys"

export const INTEGRATION_TABS: { id: IntegrationTabId; label: string }[] = [
  { id: "stripe", label: "Stripe" },
  { id: "fillout", label: "Fillout" },
  { id: "webhooks", label: "Webhooks" },
  { id: "supabase", label: "Supabase" },
  { id: "auth", label: "Email & Auth" },
  { id: "api-keys", label: "API keys & MCP" },
]

export function isIntegrationTabId(value: string | undefined): value is IntegrationTabId {
  return INTEGRATION_TABS.some((tab) => tab.id === value)
}

/** Legacy `?tab=volunteer-webhook` bookmarks open the consolidated Webhooks tab. */
export function resolveIntegrationTabId(value: string | undefined): IntegrationTabId | undefined {
  if (value === "volunteer-webhook") return "webhooks"
  return isIntegrationTabId(value) ? value : undefined
}
