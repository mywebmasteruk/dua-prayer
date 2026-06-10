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

export function getUserNavState(email?: string | null): UserNavState {
  const showAdminLink = isFoundingAdminEmail(email)

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
        href: "/?tab=following",
        label: "Following",
        activePath: "/?tab=following",
      },
      {
        href: "/channels/apply",
        label: "Apply for channel",
        activePath: "/channels/apply",
      },
    ],
    mobileUserItem: showAdminLink
      ? {
          href: "/admin",
          label: "Admin",
        }
      : {
          href: "/?tab=following",
          label: "Following",
        },
  }
}
