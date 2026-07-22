import { AuthLayoutShell } from '@kit/auth/auth-layout';
import { getSiteCopy } from '@kit/community/server/actions';

import { AppLogo } from '~/components/app-logo';

async function AuthLayout({ children }: React.PropsWithChildren) {
  const copy = await getSiteCopy();

  return (
    <AuthLayoutShell
      Logo={() => (
        <div className="flex flex-col items-center gap-2 text-center">
          <AppLogo href="/" />
          <p className="text-muted-foreground max-w-xs text-sm">
            {copy.authTagline}
          </p>
        </div>
      )}
    >
      {children}
    </AuthLayoutShell>
  );
}

export default AuthLayout;
