import { cache } from 'react';

import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';
import { composeUserWorkspace } from '~/lib/server/workspace/compose-user-workspace';

export { composeUserWorkspace };

export type UserWorkspace = Awaited<ReturnType<typeof loadUserWorkspace>>;

/**
 * @name loadUserWorkspace
 * @description
 * Load the user workspace data. It's a cached per-request function that fetches the user workspace data.
 * It can be used across the server components to load the user workspace data.
 */
export const loadUserWorkspace = cache(workspaceLoader);

async function workspaceLoader() {
  const client = getSupabaseServerClient();
  const user = await requireUserInServerComponent();
  const data = await composeUserWorkspace(client, user);

  // If the user is not found or the workspace is not found,
  // redirect to the home page - this may happen if the JWT is invalid or expired (ex. user deleted?)
  if (!data) {
    redirect('/');
  }

  return data;
}
