'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '@kit/next/safe-action';
import { verifyOtpForPurpose } from '@kit/otp/orchestration';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { RemoveMemberSchema } from '../../schema/remove-member.schema';
import { TransferOwnershipConfirmationSchema } from '../../schema/transfer-ownership-confirmation.schema';
import { UpdateMemberRoleSchema } from '../../schema/update-member-role.schema';
import { assertAccountOwner } from '../orchestration';
import { createAccountMembersService } from '../services/account-members.service';

/**
 * @name removeMemberFromAccountAction
 * @description Removes a member from an account.
 */
export const removeMemberFromAccountAction = authActionClient
  .inputSchema(RemoveMemberSchema)
  .action(async ({ parsedInput: { accountId, userId } }) => {
    const client = getSupabaseServerClient();
    const service = createAccountMembersService(client);

    await service.removeMemberFromAccount({
      accountId,
      userId,
    });

    // revalidate all pages that depend on the account
    revalidatePath('/home/[account]', 'layout');

    return { success: true };
  });

/**
 * @name updateMemberRoleAction
 * @description Updates the role of a member in an account.
 */
export const updateMemberRoleAction = authActionClient
  .inputSchema(UpdateMemberRoleSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    const client = getSupabaseServerClient();
    const service = createAccountMembersService(client);
    const adminClient = getSupabaseServerAdminClient();

    // update the role of the member. The acting user's id is passed so the
    // service can verify the actor is not assigning a role more elevated than
    // their own.
    await service.updateMemberRole(data, adminClient, user.id);

    // revalidate all pages that depend on the account
    revalidatePath('/home/[account]', 'layout');

    return { success: true };
  });

/**
 * @name transferOwnershipAction
 * @description Transfers the ownership of an account to another member.
 * Requires OTP verification for security.
 */
export const transferOwnershipAction = authActionClient
  .inputSchema(TransferOwnershipConfirmationSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    const client = getSupabaseServerClient();
    const logger = await getLogger();

    const ctx = {
      name: 'teams.transferOwnership',
      userId: user.id,
      accountId: data.accountId,
    };

    logger.info(ctx, 'Processing team ownership transfer request...');

    const isOwner = await assertAccountOwner({
      client,
      accountId: data.accountId,
    });

    if (!isOwner) {
      logger.error(ctx, 'User is not the owner of this account');

      throw new Error(
        `You must be the owner of the account to transfer ownership`,
      );
    }

    // Verify the OTP
    await verifyOtpForPurpose({
      client,
      logger,
      ctx,
      userId: user.id,
      token: data.otp,
      purpose: `transfer-team-ownership-${data.accountId}`,
      logInvalid: true,
      logMismatch: true,
      // allow a few honest retries while still bounding brute-force attempts
      maxVerificationAttempts: 5,
    });

    logger.info(
      ctx,
      'OTP verification successful. Proceeding with ownership transfer...',
    );

    const service = createAccountMembersService(client);

    // at this point, the user is authenticated, is the owner of the account, and has verified via OTP
    // so we proceed with the transfer of ownership with admin privileges
    const adminClient = getSupabaseServerAdminClient();

    // transfer the ownership of the account
    await service.transferOwnership(data, adminClient);

    // revalidate all pages that depend on the account
    revalidatePath('/home/[account]', 'layout');

    logger.info(ctx, 'Team ownership transferred successfully');

    return {
      success: true,
    };
  });
