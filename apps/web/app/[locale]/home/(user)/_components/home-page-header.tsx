import { cookies } from 'next/headers';

import { PageHeader } from '@kit/ui/page';

import { personalAccountNavigationConfig } from '~/config/personal-account-navigation.config';

export async function HomeLayoutPageHeader(
  props: React.PropsWithChildren<{
    title: string | React.ReactNode;
    description: string | React.ReactNode;
  }>,
) {
  const cookieStore = await cookies();
  const layoutStyleCookie = cookieStore.get('layout-style')?.value;
  const displaySidebarTrigger =
    (layoutStyleCookie ?? personalAccountNavigationConfig.style) === 'sidebar';

  return (
    <PageHeader
      description={props.description}
      displaySidebarTrigger={displaySidebarTrigger}
    >
      {props.children}
    </PageHeader>
  );
}
