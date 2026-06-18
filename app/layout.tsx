import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/toaster"
import { NavigationProvider } from "@/components/navigation-provider"
import { AppTooltipProvider } from "@/components/app-tooltip-provider"
import { FollowedChannelsProvider } from "@/components/followed-channels-provider"
import { OnboardingGate } from "@/components/onboarding/onboarding-gate"
import { BetaBanner } from "@/components/beta-banner"
import { getCustomCode } from "@/lib/custom-code-server"
import { getServerUser } from "@/lib/server-user"
import { listMyFollowIds } from "@/app/actions/follows"
import { getMyPreferences } from "@/app/actions/preferences"
import { getCategories } from "@/app/actions/duas"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "DuaPrayer — Make Dua & Pray For The Ummah",
  description: "Share duas and pray for the Muslim Ummah. A community prayer wall.",
  icons: {
    icon: "/favicon.png",
    apple: "/logo-icon.png",
  },
  openGraph: {
    title: "DuaPrayer",
    description: "Make Dua & Pray For The Ummah",
    images: ["/logo-wide.png"],
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [customCode, user] = await Promise.all([getCustomCode(), getServerUser()])
  const initialFollowedIds = user ? await listMyFollowIds() : []

  // First-run onboarding: signed-in users who haven't completed it yet.
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  let onboarding: { topicCategories: typeof categories; followSuggestions: typeof categories } | null = null
  if (user) {
    const prefs = await getMyPreferences()
    if (!prefs.onboardedAt) {
      categories = await getCategories()
      onboarding = {
        topicCategories: categories.filter((c) => c.channel_type === "category"),
        followSuggestions: categories,
      }
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {customCode.header ? (
          <div dangerouslySetInnerHTML={{ __html: customCode.header }} />
        ) : null}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AppTooltipProvider>
            <Suspense fallback={null}>
              <NavigationProvider>
                <FollowedChannelsProvider initialFollowedIds={initialFollowedIds} isSignedIn={Boolean(user)}>
                  <BetaBanner />
                  {children}
                  {onboarding ? (
                    <OnboardingGate
                      topicCategories={onboarding.topicCategories}
                      followSuggestions={onboarding.followSuggestions}
                    />
                  ) : null}
                </FollowedChannelsProvider>
              </NavigationProvider>
            </Suspense>
            <Toaster />
          </AppTooltipProvider>
        </ThemeProvider>
        {customCode.footer ? (
          <div dangerouslySetInnerHTML={{ __html: customCode.footer }} />
        ) : null}
        <SpeedInsights />
      </body>
    </html>
  )
}
