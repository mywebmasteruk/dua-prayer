import Link from 'next/link';

import { ChannelApplyForm } from '@kit/community/components';
import { getMyPendingChannelApplication } from '@kit/community/server/advanced-actions';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

export const generateMetadata = async () => {
  return {
    title: 'Apply for a channel',
    description: 'Request a community channel space.',
  };
};

async function ChannelApplyPage() {
  await requireUserInServerComponent();
  const pending = await getMyPendingChannelApplication();

  return (
    <div className="container mx-auto max-w-xl space-y-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Apply for a channel
        </h1>
        <p className="text-muted-foreground text-sm">
          Tell us about the space you want to open. Applications are reviewed by
          admins.
        </p>
      </header>

      {pending ? (
        <div className="rounded-xl border p-4 text-sm">
          Your application for <strong>{pending.name}</strong> (@{pending.handle})
          is under review.
          <div className="mt-3">
            <Link href="/channels" className="underline">
              Back to channels
            </Link>
          </div>
        </div>
      ) : (
        <ChannelApplyForm />
      )}
    </div>
  );
}

export default ChannelApplyPage;
