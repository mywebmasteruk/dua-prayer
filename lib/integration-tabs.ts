export type IntegrationTabId =
  | "stripe"
  | "fillout"
  | "volunteer-webhook"
  | "supabase"
  | "auth"

export const INTEGRATION_TABS: { id: IntegrationTabId; label: string }[] = [
  { id: "stripe", label: "Stripe" },
  { id: "fillout", label: "Fillout" },
  { id: "volunteer-webhook", label: "Volunteer webhook" },
  { id: "supabase", label: "Supabase" },
  { id: "auth", label: "Email & Auth" },
]

export function isIntegrationTabId(value: string | undefined): value is IntegrationTabId {
  return INTEGRATION_TABS.some((tab) => tab.id === value)
}

export function resolveIntegrationTabId(value: string | undefined): IntegrationTabId | undefined {
  return isIntegrationTabId(value) ? value : undefined
}
