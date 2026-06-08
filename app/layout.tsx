import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/toaster"
import { NavigationProvider } from "@/components/navigation-provider"
import { AppTooltipProvider } from "@/components/app-tooltip-provider"

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AppTooltipProvider>
            <Suspense fallback={null}>
              <NavigationProvider>{children}</NavigationProvider>
            </Suspense>
            <Toaster />
          </AppTooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
