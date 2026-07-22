'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import {
  setVolunteerStatusAction,
  updateVolunteerTierAction,
} from '../server/advanced-actions';
import {
  VOLUNTEER_STATUS_LABELS,
  VOLUNTEER_TIER_LABELS,
  VOLUNTEER_TIERS,
  type VolunteerStatus,
  type VolunteerTier,
} from '../volunteer-tiers';

export type VolunteerRosterRow = {
  user_id: string;
  email: string;
  name: string;
  tier: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export function AdminVolunteerRoster({
  volunteers: initial,
}: {
  volunteers: VolunteerRosterRow[];
}) {
  const [volunteers, setVolunteers] = useState(initial);
  const [isPending, startTransition] = useTransition();

  if (volunteers.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No volunteers on the roster yet. Approve an application to add someone.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {volunteers.map((volunteer) => (
        <li key={volunteer.user_id} className="rounded-xl border p-4">
          <div className="font-medium">
            {volunteer.name || volunteer.email || volunteer.user_id}
          </div>
          <div className="text-muted-foreground text-sm">
            {volunteer.email} ·{' '}
            {VOLUNTEER_STATUS_LABELS[
              volunteer.status as VolunteerStatus
            ] ?? volunteer.status}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Select
              value={volunteer.tier}
              onValueChange={(value) => {
                if (!value) return;

                startTransition(async () => {
                  const result = await updateVolunteerTierAction({
                    userId: volunteer.user_id,
                    tier: value as VolunteerTier,
                  });

                  if (result?.serverError) {
                    toast.error(result.serverError);
                    return;
                  }

                  setVolunteers((current) =>
                    current.map((item) =>
                      item.user_id === volunteer.user_id
                        ? { ...item, tier: value }
                        : item,
                    ),
                  );
                  toast.success('Tier updated');
                });
              }}
            >
              <SelectTrigger className="w-[160px]" disabled={isPending}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOLUNTEER_TIERS.map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {VOLUNTEER_TIER_LABELS[tier]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                const nextStatus: VolunteerStatus =
                  volunteer.status === 'active' ? 'suspended' : 'active';

                startTransition(async () => {
                  const result = await setVolunteerStatusAction({
                    userId: volunteer.user_id,
                    status: nextStatus,
                  });

                  if (result?.serverError) {
                    toast.error(result.serverError);
                    return;
                  }

                  setVolunteers((current) =>
                    current.map((item) =>
                      item.user_id === volunteer.user_id
                        ? { ...item, status: nextStatus }
                        : item,
                    ),
                  );
                  toast.success(
                    nextStatus === 'active'
                      ? 'Volunteer reactivated'
                      : 'Volunteer suspended',
                  );
                });
              }}
            >
              {volunteer.status === 'active' ? 'Suspend' : 'Reactivate'}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
