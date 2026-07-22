import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@kit/supabase/database';
import type { JWTUserData } from '@kit/supabase/types';
import { createTeamAccountsApi } from '@kit/team-accounts/api';
import type { TeamAccountWorkspaceShape } from '@kit/team-accounts/shared';

/**
 * @name composeTeamWorkspace
 * @description
 * Pure data-loader that composes the team account workspace from an
 * authenticated client + user + slug.
 *
 * Returns null when the user has no accessible workspace for that slug
 * (RLS denied, slug unknown, mid-deletion race). Callers decide how to surface
 * the missing case — RSCs redirect, route handlers return JSON 404.
 *
 * Callable from any server-only context (server actions, route handlers,
 * RSCs, middleware).
 */
export async function composeTeamWorkspace(
  client: SupabaseClient<Database>,
  user: JWTUserData,
  accountSlug: string,
): Promise<TeamAccountWorkspaceShape | null> {
  const api = createTeamAccountsApi(client);
  const workspace = await api.getAccountWorkspace(accountSlug);

  if (!workspace.data?.account) {
    return null;
  }

  return {
    ...workspace.data,
    user,
  };
}
