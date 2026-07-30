import { OnboardingGate } from '@kit/community/components';
import { getMyOnboardingState, getSiteCopy } from '@kit/community/server/actions';
import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { CommunityShell } from '~/(marketing)/_components/community-shell';

export const dynamic = 'force-dynamic';

async function SiteLayout(props: React.PropsWithChildren) {
  const client = getSupabaseServerClient();
  const user = await requireUser(client, { verifyMfa: false });

  const [copy, onboarding] = await Promise.all([
    getSiteCopy(),
    user.data
      ? getMyOnboardingState()
      : Promise.resolve({
          needsOnboarding: false,
          topics: [],
          channels: [],
          followedIds: [],
        }),
  ]);

  return (
    <>
      <CommunityShell
        user={user.data}
        isAdmin={Boolean(user.data?.is_superadmin)}
        sidebarTagline={copy.authTagline}
      >
        {props.children}
      </CommunityShell>

      {user.data && onboarding.needsOnboarding ? (
        <OnboardingGate
          topicCategories={onboarding.topics}
          followSuggestions={onboarding.channels}
          initialFollowedIds={onboarding.followedIds}
        />
      ) : null}
    </>
  );
}

export default SiteLayout;
