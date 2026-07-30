import pathsConfig from '~/config/paths.config';

export type CommunityNavItem = {
  href: string;
  label: string;
  activePath: string;
};

export type CommunityNavState = {
  showAdminLink: boolean;
  guestAccountItem: { href: string; label: string; variant: 'cta' } | null;
  signedInSummary: { label: string; email?: string | null } | null;
  signedInItems: CommunityNavItem[];
  mobileUserItem: { href: string; label: string };
};

export function getCommunityNavState({
  email,
  displayName,
  isAdmin = false,
}: {
  email?: string | null;
  displayName?: string | null;
  isAdmin?: boolean;
}): CommunityNavState {
  if (!email) {
    return {
      showAdminLink: false,
      guestAccountItem: {
        href: pathsConfig.auth.signIn,
        label: 'Sign in',
        variant: 'cta',
      },
      signedInSummary: null,
      signedInItems: [],
      mobileUserItem: {
        href: pathsConfig.auth.signIn,
        label: 'Sign in',
      },
    };
  }

  return {
    showAdminLink: isAdmin,
    guestAccountItem: null,
    signedInSummary: {
      label: displayName?.trim() || email,
      email,
    },
    signedInItems: [
      {
        href: pathsConfig.app.home,
        label: 'Account',
        activePath: pathsConfig.app.home,
      },
      {
        href: '/bookmarks',
        label: 'Bookmarks',
        activePath: '/bookmarks',
      },
      {
        href: pathsConfig.app.personalAccountSettings,
        label: 'Settings',
        activePath: pathsConfig.app.personalAccountSettings,
      },
    ],
    mobileUserItem: isAdmin
      ? { href: '/admin', label: 'Admin' }
      : { href: pathsConfig.app.home, label: 'Account' },
  };
}

export function isCommunityPathActive(activePath: string, href: string) {
  const normalizedActive = stripLocalePrefix(activePath);
  const normalizedHref = stripLocalePrefix(href);

  if (normalizedHref === '/') return normalizedActive === '/';

  return (
    normalizedActive === normalizedHref ||
    normalizedActive.startsWith(`${normalizedHref}/`)
  );
}

export function stripLocalePrefix(pathname: string) {
  const match = pathname.match(/^\/([a-z]{2})(?=\/|$)/);

  if (!match) return pathname || '/';

  const rest = pathname.slice(match[0].length);

  if (!rest) return '/';

  return rest.startsWith('/') ? rest : `/${rest}`;
}
