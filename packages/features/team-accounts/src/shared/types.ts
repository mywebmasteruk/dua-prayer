import type { Database } from '@kit/supabase/database';
import type { JWTUserData } from '@kit/supabase/types';

export type TeamAccountSummaryRow =
  Database['public']['Views']['user_accounts']['Row'];

export type TeamAccountWorkspaceAccount =
  Database['public']['Functions']['team_account_workspace']['Returns'][number];

export interface TeamAccountWorkspaceShape {
  account: TeamAccountWorkspaceAccount;
  accounts: TeamAccountSummaryRow[];
  user: JWTUserData;
}
