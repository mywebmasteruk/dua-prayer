import { AuthLayoutShell } from '@kit/auth/auth-layout';

import { AppLogo } from '~/components/app-logo';

function AuthLayout({ children }: React.PropsWithChildren) {
  return <AuthLayoutShell Logo={AppLogo}>{children}</AuthLayoutShell>;
}

export default AuthLayout;
