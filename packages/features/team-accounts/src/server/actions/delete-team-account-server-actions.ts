'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { authActionClient } from '@kit/next/safe-action';
import { verifyOtpForPurpose } from '@kit/otp/orchestration';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { DeleteTeamAccountSchema } from '../../schema/delete-team-account.schema';
import { assertAccountOwner } from '../orchestration';
import { createDeleteTeamAccountService } from '../services/delete-team-account.service';

const enableTeamAccountDeletion =
  process.env.NEXT_PUBLIC_ENABLE_TEAM_ACCOUNTS_DELETION === 'true';

export const deleteTeamAccountAction = authActionClient
  .inputSchema(DeleteTeamAccountSchema)
  .action(async ({ parsedInput: params, ctx: { user } }) => {
    const logger = await getLogger();

    const client = getSupabaseServerClient();

    const ctx = {
      name: 'team-accounts.delete',
      userId: user.id,
      accountId: params.accountId,
    };

    if (!enableTeamAccountDeletion) {
      logger.warn(ctx, `Team account deletion is not enabled`);

      throw new Error('Team account deletion is not enabled');
    }

    await verifyOtpForPurpose({
      client,
      logger,
      ctx,
      userId: user.id,
      token: params.otp,
      purpose: `delete-team-account-${params.accountId}`,
      // allow a few honest retries while still bounding brute-force attempts
      maxVerificationAttempts: 5,
    });

    const isOwner = await assertAccountOwner({
      client,
      accountId: params.accountId,
    });

    if (!isOwner) {
      throw new Error('You do not have permission to delete this account');
    }

    const service = createDeleteTeamAccountService();

    logger.info(ctx, `Deleting team account...`);

    await service.deleteTeamAccount(client, {
      accountId: params.accountId,
      userId: user.id,
    });

    logger.info(ctx, `Team account request successfully sent`);

    revalidatePath('/');
    redirect('/home');
  });
