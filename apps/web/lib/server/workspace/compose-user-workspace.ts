import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createAccountsApi } from '@kit/accounts/api';
import type { UserWorkspaceShape } from '@kit/accounts/shared';
import type { Database } from '@kit/supabase/database';
import type { JWTUserData } from '@kit/supabase/types';
import { createAccountCreationPolicyEvaluator } from '@kit/team-accounts/policies';

import featureFlagsConfig from '~/config/feature-flags.config';

const shouldLoadAccounts = featureFlagsConfig.enableTeamAccounts;

/**
 * @name composeUserWorkspace
 * @description
 * Pure data-loader that composes the user workspace data from an authenticated
 * client + user.
 *
 * Returns null when the user has no accessible workspace (invalid/expired JWT
 * or deleted user). Callers decide how to surface the missing case — RSCs
 * redirect, route handlers return JSON 404.
 *
 * Callable from any server-only context (server actions, route handlers,
 * RSCs, middleware).
 */
export async function composeUserWorkspace(
  client: SupabaseClient<Database>,
  user: JWTUserData,
): Promise<UserWorkspaceShape | null> {
  const api = createAccountsApi(client);

  const accountsPromise = shouldLoadAccounts
    ? api.loadUserAccounts()
    : Promise.resolve([]);
  const workspacePromise = api.getAccountWorkspace();

  const [accounts, workspace] = await Promise.all([
    accountsPromise,
    workspacePromise,
  ]);

  if (!workspace) {
    return null;
  }

  // Check if user can create team accounts (policy check)
  const canCreateTeamAccount = shouldLoadAccounts
    ? await checkCanCreateTeamAccount(user.id)
    : { allowed: false, reason: undefined };

  return {
    accounts,
    workspace,
    user,
    canCreateTeamAccount,
  };
}

/**
 * Check if the user can create a team account based on policies.
 * Preliminary checks run without account name - name validation happens during submission.
 */
async function checkCanCreateTeamAccount(userId: string) {
  const evaluator = createAccountCreationPolicyEvaluator();
  const hasPolicies = await evaluator.hasPoliciesForStage('preliminary');

  if (!hasPolicies) {
    return { allowed: true, reason: undefined };
  }

  const context = {
    timestamp: new Date().toISOString(),
    userId,
    accountName: '',
  };

  const result = await evaluator.canCreateAccount(context, 'preliminary');

  return {
    allowed: result.allowed,
    reason: result.reasons[0],
  };
}
