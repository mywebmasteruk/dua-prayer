import 'server-only';

import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { createNotificationsApi } from '@kit/notifications/api';

const AMEEN_MILESTONES = [10, 25, 50, 100, 250, 500, 1000] as const;

export function crossedAmeenMilestone(newLikes: number): number | null {
  return (AMEEN_MILESTONES as readonly number[]).includes(newLikes)
    ? newLikes
    : null;
}

/**
 * Best-effort in-app notification via Makerkit notifications.
 * Personal accounts use id = auth user id.
 */
export async function notifyAccount(input: {
  accountId: string | null | undefined;
  body: string;
  link?: string | null;
  type?: 'info' | 'warning' | 'error';
}) {
  if (!input.accountId) return;

  try {
    const admin = getSupabaseServerAdminClient();
    const api = createNotificationsApi(admin);

    await api.createNotification({
      account_id: input.accountId,
      body: input.body,
      link: input.link ?? null,
      type: input.type ?? 'info',
      channel: 'in_app',
    });
  } catch (error) {
    const logger = await getLogger();
    logger.error(
      { error, name: 'community.notify', accountId: input.accountId },
      'Failed to create community notification',
    );
  }
}
