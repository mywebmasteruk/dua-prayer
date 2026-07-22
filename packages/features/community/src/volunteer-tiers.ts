export const VOLUNTEER_TIERS = ['helper', 'supervisor', 'manager'] as const;

export type VolunteerTier = (typeof VOLUNTEER_TIERS)[number];

export const VOLUNTEER_STATUSES = ['active', 'suspended'] as const;

export type VolunteerStatus = (typeof VOLUNTEER_STATUSES)[number];

export const VOLUNTEER_TIER_LABELS: Record<VolunteerTier, string> = {
  helper: 'Helper',
  supervisor: 'Supervisor',
  manager: 'Manager',
};

export const VOLUNTEER_STATUS_LABELS: Record<VolunteerStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
};

export function isVolunteerTier(value: unknown): value is VolunteerTier {
  return (
    typeof value === 'string' &&
    (VOLUNTEER_TIERS as readonly string[]).includes(value)
  );
}

export function isVolunteerStatus(value: unknown): value is VolunteerStatus {
  return (
    typeof value === 'string' &&
    (VOLUNTEER_STATUSES as readonly string[]).includes(value)
  );
}
