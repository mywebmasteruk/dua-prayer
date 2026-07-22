import { OnboardingGate } from '@kit/community/components';
import { getMyOnboardingState } from '@kit/community/server/actions';
import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { SiteFooter } from '~/(marketing)/_components/site-footer';
import { SiteHeader } from '~/(marketing)/_components/site-header';

export const dynamic = 'force-dynamic';

async function SiteLayout(props: React.PropsWithChildren) {
  const client = getSupabaseServerClient();
  const user = await requireUser(client, { verifyMfa: false });
  const onboarding = user.data
    ? await getMyOnboardingState()
    : {
        needsOnboarding: false,
        topics: [],
        channels: [],
        followedIds: [],
      };

  return (
    <div className={'flex min-h-screen flex-col'}>
      <SiteHeader user={user.data} />

      {props.children}

      <SiteFooter />

      {user.data && onboarding.needsOnboarding ? (
        <OnboardingGate
          topicCategories={onboarding.topics}
          followSuggestions={onboarding.channels}
          initialFollowedIds={onboarding.followedIds}
        />
      ) : null}
    </div>
  );
}

export default SiteLayout;
