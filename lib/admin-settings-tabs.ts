export type SettingsTabId = "posting" | "custom-code"

export const SETTINGS_TABS: ReadonlyArray<{ id: SettingsTabId; label: string }> = [
  { id: "posting", label: "Posting & Access" },
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
