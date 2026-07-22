# Server Action Examples

Real examples from the Makerkit codebase.

## Team Billing Action

Location: `apps/web/app/home/[account]/billing/_lib/server/server-actions.ts`

```typescript
'use server';

import { redirect } from 'next/navigation';

import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { TeamBillingPortalSchema, TeamCheckoutSchema } from '../schema/team-billing.schema';
import { createTeamBillingService } from './team-billing.service';

export const createTeamAccountCheckoutSession = authActionClient
  .inputSchema(TeamCheckoutSchema)
  .action(async ({ parsedInput: data }) => {
    const client = getSupabaseServerClient();
    const service = createTeamBillingService(client);

    return service.createCheckout(data);
  });

export const createBillingPortalSession = authActionClient
  .inputSchema(TeamBillingPortalSchema)
  .action(async ({ parsedInput: params }) => {
    const client = getSupabaseServerClient();
    const service = createTeamBillingService(client);

    const url = await service.createBillingPortalSession(params);

    redirect(url);
  });
```

## Personal Settings Action

```typescript
'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '@kit/next/safe-action';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { UpdateProfileSchema } from '../schemas/profile.schema';

export const updateProfileAction = authActionClient
  .inputSchema(UpdateProfileSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    const logger = await getLogger();
    const ctx = { name: 'update-profile', userId: user.id };

    logger.info(ctx, 'Updating user profile');

    const client = getSupabaseServerClient();

    const { error } = await client
      .from('accounts')
      .update({ name: data.name })
      .eq('id', user.id);

    if (error) {
      logger.error({ ...ctx, error }, 'Failed to update profile');
      throw error;
    }

    logger.info(ctx, 'Profile updated successfully');

    revalidatePath('/home/settings');

    return { success: true };
  });
```

## Action with Redirect

```typescript
'use server';

import { redirect } from 'next/navigation';

import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { CreateProjectSchema } from '../schemas/project.schema';
import { createProjectService } from './project.service';

export const createProjectAction = authActionClient
  .inputSchema(CreateProjectSchema)
  .action(async ({ parsedInput: data }) => {
    const client = getSupabaseServerClient();
    const service = createProjectService(client);
    const project = await service.create(data);

    redirect(`/home/${data.accountSlug}/projects/${project.id}`);
  });
```

## Delete Action

```typescript
'use server';

import { revalidatePath } from 'next/cache';

import { authActionClient } from '@kit/next/safe-action';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { DeleteItemSchema } from '../schemas/item.schema';

export const deleteItemAction = authActionClient
  .inputSchema(DeleteItemSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    const logger = await getLogger();
    const ctx = { name: 'delete-item', userId: user.id, itemId: data.itemId };

    logger.info(ctx, 'Deleting item');

    const client = getSupabaseServerClient();

    const { error } = await client
      .from('items')
      .delete()
      .eq('id', data.itemId)
      .eq('account_id', data.accountId); // RLS will also validate

    if (error) {
      logger.error({ ...ctx, error }, 'Failed to delete item');
      throw error;
    }

    logger.info(ctx, 'Item deleted successfully');

    revalidatePath(`/home/${data.accountSlug}/items`);

    return { success: true };
  });
```

## Error Handling with isRedirectError

```typescript
'use server';

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { redirect } from 'next/navigation';

import { authActionClient } from '@kit/next/safe-action';
import { getLogger } from '@kit/shared/logger';

import { FormSchema } from '../schemas/form.schema';

export const submitFormAction = authActionClient
  .inputSchema(FormSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    const logger = await getLogger();
    const ctx = { name: 'submit-form', userId: user.id };

    try {
      logger.info(ctx, 'Submitting form');

      await processForm(data);

      logger.info(ctx, 'Form submitted, redirecting');

      redirect('/success');
    } catch (error) {
      if (!isRedirectError(error)) {
        logger.error({ ...ctx, error }, 'Form submission failed');
        throw error;
      }
      throw error; // Re-throw redirect
    }
  });
```
