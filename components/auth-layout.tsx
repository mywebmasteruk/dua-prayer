import type { ReactNode } from "react"
import { getSiteCopy } from "@/lib/site-copy"
import { BrandLogo } from "./brand-logo"
import { Footer } from "./footer"

interface AuthLayoutProps {
  children: ReactNode
}

/** Focused sign-in shell: logo header, centered form column, aligned footer — no sidebar. */
export async function AuthLayout({ children }: AuthLayoutProps) {
  const siteCopy = await getSiteCopy()

  return (
    <div className="flex min-h-screen flex-col bg-muted/40 text-foreground">
      <header className="site-container pt-8 pb-4">
        <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
          <BrandLogo variant="icon" href="/" showWordmark priority className="h-9 w-9 shrink-0" />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {siteCopy.sidebarTagline}
          </p>
        </div>
      </header>

      <main className="site-container flex flex-1 flex-col items-center px-4 pb-10">
        <div className="flex w-full max-w-md flex-1 flex-col justify-center py-6">{children}</div>
      </main>

      <Footer footerTagline={siteCopy.footerTagline} />
    </div>
  )
}
