import { signInHref } from "@/lib/auth-modal"
import { isFoundingAdminEmail } from "@/lib/admin-policy"

export type SidebarAccountItem = {
  href: string
  label: string
  variant?: "default" | "cta"
}

export type SignedInNavItem = {
  href: string
  label: string
  activePath: string
}

export type UserNavState = {
  showAdminLink: boolean
  guestAccountItem: SidebarAccountItem | null
  signedInSummary: { eyebrow: string; label: string } | null
  signedInItems: SignedInNavItem[]
  mobileUserItem: { href: string; label: string }
}

export function getUserNavState(email?: string | null, isAdmin = false): UserNavState {
  // Show the Admin link to the founding admin OR anyone with admin permissions
  // (moderators, approved volunteers, etc.) — not just the founding email.
  const showAdminLink = isFoundingAdminEmail(email) || isAdmin

  if (!email) {
    return {
      showAdminLink: false,
      guestAccountItem: {
        href: signInHref(),
        label: "Sign in",
        variant: "cta",
      },
      signedInSummary: null,
      signedInItems: [],
      mobileUserItem: {
        href: signInHref(),
        label: "Sign in",
      },
    }
  }

  return {
    showAdminLink,
    guestAccountItem: null,
    signedInSummary: {
      eyebrow: "Signed in",
      label: email,
    },
    signedInItems: [
      {
        href: "/profile",
        label: "Profile",
        activePath: "/profile",
      },
      {
        href: "/bookmarks",
        label: "Bookmarks",
        activePath: "/bookmarks",
      },
      {
        href: "/notifications",
        label: "Notifications",
        activePath: "/notifications",
      },
    ],
    mobileUserItem: showAdminLink
      ? {
          href: "/admin",
          label: "Admin",
        }
      : {
          href: "/account",
          label: "Account",
        },
  }
}
