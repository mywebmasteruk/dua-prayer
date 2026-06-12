export type SettingsTabId =
  | "general"
  | "posting"
  | "ai-provider"
  | "ai-bots"
  | "integrations"
  | "roles"
  | "custom-code"

export const SETTINGS_TABS: ReadonlyArray<{ id: SettingsTabId; label: string }> = [
  { id: "general", label: "General / Site Content" },
  { id: "posting", label: "Posting & Access" },
  { id: "ai-provider", label: "AI Provider" },
  { id: "ai-bots", label: "AI Bots" },
  { id: "integrations", label: "Integrations" },
  { id: "roles", label: "Roles & Permissions" },
  { id: "custom-code", label: "Custom Code" },
]

export function isSettingsTabId(value: string | undefined): value is SettingsTabId {
  return SETTINGS_TABS.some((tab) => tab.id === value)
}

export function resolveSettingsTab(
  value: string | null | undefined,
  fallback: SettingsTabId,
): SettingsTabId {
  return isSettingsTabId(value ?? undefined) ? (value as SettingsTabId) : fallback
}
